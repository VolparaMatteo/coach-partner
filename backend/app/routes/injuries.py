from flask import Blueprint, request, jsonify
from app import db
from app.models.injury import Injury
from app.models.athlete import Athlete
from app.models.team import Team
from app.utils.auth import coach_required

injuries_bp = Blueprint("injuries", __name__)


@injuries_bp.route("", methods=["GET"])
@coach_required
def list_injuries(user):
    athlete_id = request.args.get("athlete_id", type=int)
    if not athlete_id:
        return jsonify({"error": "athlete_id is required"}), 400

    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    status = request.args.get("status")
    query = Injury.query.filter_by(athlete_id=athlete.id)
    if status:
        query = query.filter_by(status=status)

    injuries = query.order_by(Injury.date_occurred.desc()).all()
    return jsonify({"injuries": [i.to_dict() for i in injuries]})


@injuries_bp.route("", methods=["POST"])
@coach_required
def create_injury(user):
    data = request.get_json()
    athlete = Athlete.query.get(data.get("athlete_id"))
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    injury = Injury(
        athlete_id=athlete.id,
        injury_type=data.get("injury_type", "other"),
        body_part=data.get("body_part"),
        description=data.get("description"),
        date_occurred=data.get("date_occurred"),
        severity=data.get("severity"),
        limitations=data.get("limitations"),
        protocol=data.get("protocol"),
    )
    db.session.add(injury)

    # Update athlete status
    athlete.status = "unavailable"
    db.session.commit()
    return jsonify({"injury": injury.to_dict()}), 201


@injuries_bp.route("/<int:injury_id>", methods=["PATCH"])
@coach_required
def update_injury(user, injury_id):
    injury = Injury.query.get(injury_id)
    if not injury:
        return jsonify({"error": "Injury not found"}), 404

    athlete = Athlete.query.get(injury.athlete_id)
    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    updatable = ["status", "severity", "limitations", "protocol", "date_return", "description"]
    for field in updatable:
        if field in data:
            setattr(injury, field, data[field])

    # If cleared, update athlete status
    if data.get("status") == "cleared":
        athlete.status = "available"

    db.session.commit()
    return jsonify({"injury": injury.to_dict()})
