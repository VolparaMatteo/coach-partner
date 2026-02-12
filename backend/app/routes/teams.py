import json
from flask import Blueprint, request, jsonify
from app import db
from app.models.team import Team
from app.utils.auth import coach_required

teams_bp = Blueprint("teams", __name__)


@teams_bp.route("", methods=["GET"])
@coach_required
def list_teams(user):
    teams = Team.query.filter_by(coach_id=user.id).all()
    return jsonify({"teams": [t.to_dict() for t in teams]})


@teams_bp.route("/<int:team_id>", methods=["GET"])
@coach_required
def get_team(user, team_id):
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404
    return jsonify({"team": team.to_dict()})


@teams_bp.route("", methods=["POST"])
@coach_required
def create_team(user):
    data = request.get_json()
    if not data.get("name"):
        return jsonify({"error": "Team name is required"}), 400

    team = Team(
        coach_id=user.id,
        name=data["name"].strip(),
        sport=data.get("sport", user.sport),
        category=data.get("category"),
        level=data.get("level"),
        gender=data.get("gender"),
        num_athletes=data.get("num_athletes"),
        training_days=json.dumps(data.get("training_days", [])),
        match_day=data.get("match_day"),
        season=data.get("season"),
    )
    db.session.add(team)
    db.session.commit()
    return jsonify({"team": team.to_dict()}), 201


@teams_bp.route("/<int:team_id>", methods=["PATCH"])
@coach_required
def update_team(user, team_id):
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    data = request.get_json()
    updatable = ["name", "category", "level", "gender", "num_athletes", "match_day", "season"]
    for field in updatable:
        if field in data:
            setattr(team, field, data[field])
    if "training_days" in data:
        team.training_days = json.dumps(data["training_days"])

    db.session.commit()
    return jsonify({"team": team.to_dict()})


@teams_bp.route("/<int:team_id>", methods=["DELETE"])
@coach_required
def delete_team(user, team_id):
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    db.session.delete(team)
    db.session.commit()
    return jsonify({"message": "Team deleted"})
