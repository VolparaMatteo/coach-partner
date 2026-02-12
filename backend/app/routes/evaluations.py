import json
from flask import Blueprint, request, jsonify
from app import db
from app.models.evaluation import Evaluation
from app.models.athlete import Athlete
from app.models.team import Team
from app.utils.auth import coach_required

evaluations_bp = Blueprint("evaluations", __name__)


@evaluations_bp.route("", methods=["GET"])
@coach_required
def list_evaluations(user):
    athlete_id = request.args.get("athlete_id", type=int)
    if not athlete_id:
        return jsonify({"error": "athlete_id is required"}), 400

    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    evaluations = Evaluation.query.filter_by(athlete_id=athlete.id)\
        .order_by(Evaluation.date.desc()).all()
    return jsonify({"evaluations": [e.to_dict() for e in evaluations]})


@evaluations_bp.route("", methods=["POST"])
@coach_required
def create_evaluation(user):
    data = request.get_json()
    athlete = Athlete.query.get(data.get("athlete_id"))
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    evaluation = Evaluation(
        athlete_id=athlete.id,
        training_session_id=data.get("training_session_id"),
        match_id=data.get("match_id"),
        date=data.get("date"),
        technical=data.get("technical"),
        tactical=data.get("tactical"),
        physical=data.get("physical"),
        mental=data.get("mental"),
        discipline=data.get("discipline"),
        form=data.get("form"),
        overall=data.get("overall"),
        comment=data.get("comment"),
        tags=json.dumps(data.get("tags", [])),
    )
    db.session.add(evaluation)
    db.session.commit()
    return jsonify({"evaluation": evaluation.to_dict()}), 201
