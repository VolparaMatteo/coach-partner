import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.team import Team
from app.utils.sport_config import get_sport_config, get_all_sports

onboarding_bp = Blueprint("onboarding", __name__)


@onboarding_bp.route("/sports", methods=["GET"])
def list_sports():
    """Return available sports for onboarding step 1."""
    return jsonify({"sports": get_all_sports()})


@onboarding_bp.route("/sport-config/<sport>", methods=["GET"])
def sport_config(sport):
    """Return sport-specific configuration (positions, categories, etc.)."""
    config = get_sport_config(sport)
    if not config:
        return jsonify({"error": "Sport not found"}), 404
    return jsonify({"config": config})


@onboarding_bp.route("/step/sport", methods=["POST"])
@jwt_required()
def set_sport():
    """Step 1: Select sport."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    sport = data.get("sport")
    if sport not in ("football", "basketball", "volleyball"):
        return jsonify({"error": "Invalid sport. Choose: football, basketball, volleyball"}), 400

    user.sport = sport
    user.onboarding_step = 1
    db.session.commit()

    return jsonify({"message": "Sport selected", "user": user.to_dict()})


@onboarding_bp.route("/step/team", methods=["POST"])
@jwt_required()
def set_team():
    """Step 2: Create team profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not user.sport:
        return jsonify({"error": "Select a sport first"}), 400

    required = ["name"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Field '{field}' is required"}), 400

    team = Team(
        coach_id=user.id,
        name=data["name"].strip(),
        sport=user.sport,
        category=data.get("category"),
        level=data.get("level"),
        gender=data.get("gender"),
        num_athletes=data.get("num_athletes"),
        training_days=json.dumps(data.get("training_days", [])),
        match_day=data.get("match_day"),
        season=data.get("season", "2025-2026"),
    )
    db.session.add(team)
    user.onboarding_step = 2
    db.session.commit()

    return jsonify({"message": "Team created", "team": team.to_dict()})


@onboarding_bp.route("/step/philosophy", methods=["POST"])
@jwt_required()
def set_philosophy():
    """Step 3: Set coaching philosophy and focus areas."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    focus_areas = data.get("focus_areas", [])
    valid_areas = ["tactical", "technical", "physical", "mental", "prevention"]
    filtered = [a for a in focus_areas if a in valid_areas]

    user.philosophy_focus = json.dumps(filtered)
    user.coaching_level = data.get("coaching_level", user.coaching_level)
    user.years_experience = data.get("years_experience", user.years_experience)
    user.onboarding_step = 3
    db.session.commit()

    return jsonify({"message": "Philosophy set", "user": user.to_dict()})


@onboarding_bp.route("/step/roster", methods=["POST"])
@jwt_required()
def import_roster():
    """Step 4: Quick roster import (manual list)."""
    from app.models.athlete import Athlete

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    team_id = data.get("team_id")
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    athletes_data = data.get("athletes", [])
    created = []
    for a in athletes_data:
        if not a.get("first_name") or not a.get("last_name"):
            continue
        athlete = Athlete(
            team_id=team.id,
            first_name=a["first_name"].strip(),
            last_name=a["last_name"].strip(),
            jersey_number=a.get("jersey_number"),
            position=a.get("position"),
        )
        db.session.add(athlete)
        created.append(athlete)

    user.onboarding_step = 4
    db.session.commit()

    return jsonify({
        "message": f"{len(created)} athletes added",
        "athletes": [a.to_dict() for a in created],
    })


@onboarding_bp.route("/complete", methods=["POST"])
@jwt_required()
def complete_onboarding():
    """Mark onboarding as completed."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    user.onboarding_completed = True
    user.onboarding_step = 5
    db.session.commit()

    return jsonify({"message": "Onboarding completed! Welcome to Coach Partner.", "user": user.to_dict()})
