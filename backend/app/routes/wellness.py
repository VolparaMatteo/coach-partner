from flask import Blueprint, request, jsonify
from app import db
from app.models.wellness import WellnessEntry
from app.models.athlete import Athlete
from app.models.team import Team
from app.utils.auth import coach_required

wellness_bp = Blueprint("wellness", __name__)


@wellness_bp.route("", methods=["GET"])
@coach_required
def list_wellness(user):
    athlete_id = request.args.get("athlete_id", type=int)
    if not athlete_id:
        return jsonify({"error": "athlete_id is required"}), 400

    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    entries = WellnessEntry.query.filter_by(athlete_id=athlete.id)\
        .order_by(WellnessEntry.date.desc()).limit(30).all()
    return jsonify({"entries": [e.to_dict() for e in entries]})


@wellness_bp.route("", methods=["POST"])
@coach_required
def create_wellness(user):
    data = request.get_json()
    athlete = Athlete.query.get(data.get("athlete_id"))
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    entry = WellnessEntry(
        athlete_id=athlete.id,
        date=data.get("date"),
        energy=data.get("energy"),
        sleep_quality=data.get("sleep_quality"),
        stress=data.get("stress"),
        doms=data.get("doms"),
        pain=data.get("pain"),
        mood=data.get("mood"),
        notes=data.get("notes"),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"entry": entry.to_dict()}), 201
