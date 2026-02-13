from datetime import datetime
from flask import Blueprint, request, jsonify
from app import db
from app.models.season import Season
from app.models.team import Team
from app.utils.auth import coach_required

seasons_bp = Blueprint("seasons", __name__)


@seasons_bp.route("", methods=["GET"])
@coach_required
def list_seasons(user):
    seasons = (
        Season.query
        .filter_by(coach_id=user.id)
        .order_by(Season.start_date.desc())
        .all()
    )
    return jsonify({"seasons": [s.to_dict() for s in seasons]})


@seasons_bp.route("", methods=["POST"])
@coach_required
def create_season(user):
    data = request.get_json()

    if not data.get("name"):
        return jsonify({"error": "Season name is required"}), 400
    if not data.get("start_date"):
        return jsonify({"error": "Start date is required"}), 400
    if not data.get("end_date"):
        return jsonify({"error": "End date is required"}), 400

    try:
        start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if end_date <= start_date:
        return jsonify({"error": "End date must be after start date"}), 400

    is_active = data.get("is_active", True)

    # If this season will be active, deactivate all others for this coach
    if is_active:
        Season.query.filter_by(coach_id=user.id, is_active=True).update({"is_active": False})

    season = Season(
        coach_id=user.id,
        name=data["name"].strip(),
        start_date=start_date,
        end_date=end_date,
        is_active=is_active,
        notes=data.get("notes"),
    )
    db.session.add(season)
    db.session.commit()
    return jsonify({"season": season.to_dict()}), 201


@seasons_bp.route("/<int:season_id>", methods=["GET"])
@coach_required
def get_season(user, season_id):
    season = Season.query.filter_by(id=season_id, coach_id=user.id).first()
    if not season:
        return jsonify({"error": "Season not found"}), 404
    return jsonify({"season": season.to_dict()})


@seasons_bp.route("/<int:season_id>", methods=["PUT"])
@coach_required
def update_season(user, season_id):
    season = Season.query.filter_by(id=season_id, coach_id=user.id).first()
    if not season:
        return jsonify({"error": "Season not found"}), 404

    data = request.get_json()

    if "name" in data:
        season.name = data["name"].strip()
    if "notes" in data:
        season.notes = data["notes"]
    if "start_date" in data:
        try:
            season.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400
    if "end_date" in data:
        try:
            season.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400
    if "is_active" in data:
        if data["is_active"]:
            Season.query.filter(
                Season.coach_id == user.id,
                Season.id != season.id,
                Season.is_active == True,
            ).update({"is_active": False})
        season.is_active = data["is_active"]

    if season.end_date <= season.start_date:
        return jsonify({"error": "End date must be after start date"}), 400

    db.session.commit()
    return jsonify({"season": season.to_dict()})


@seasons_bp.route("/<int:season_id>", methods=["DELETE"])
@coach_required
def delete_season(user, season_id):
    season = Season.query.filter_by(id=season_id, coach_id=user.id).first()
    if not season:
        return jsonify({"error": "Season not found"}), 404

    # Check if any teams are linked to this season
    linked_teams = Team.query.filter_by(season_id=season.id).count()
    if linked_teams > 0:
        return jsonify({"error": "Cannot delete season with linked teams. Remove team associations first."}), 400

    db.session.delete(season)
    db.session.commit()
    return jsonify({"message": "Season deleted"})


@seasons_bp.route("/<int:season_id>/activate", methods=["POST"])
@coach_required
def activate_season(user, season_id):
    season = Season.query.filter_by(id=season_id, coach_id=user.id).first()
    if not season:
        return jsonify({"error": "Season not found"}), 404

    # Deactivate all other seasons for this coach
    Season.query.filter(
        Season.coach_id == user.id,
        Season.id != season.id,
        Season.is_active == True,
    ).update({"is_active": False})

    season.is_active = True
    db.session.commit()
    return jsonify({"season": season.to_dict()})
