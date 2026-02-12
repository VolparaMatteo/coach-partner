import json
from flask import Blueprint, request, jsonify
from app import db
from app.models.training import TrainingSession, TrainingBlock
from app.models.team import Team
from app.utils.auth import coach_required

trainings_bp = Blueprint("trainings", __name__)


@trainings_bp.route("", methods=["GET"])
@coach_required
def list_trainings(user):
    team_id = request.args.get("team_id", type=int)
    if not team_id:
        return jsonify({"error": "team_id is required"}), 400

    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    sessions = TrainingSession.query.filter_by(team_id=team.id)\
        .order_by(TrainingSession.date.desc()).all()
    return jsonify({"sessions": [s.to_dict() for s in sessions]})


@trainings_bp.route("/<int:session_id>", methods=["GET"])
@coach_required
def get_training(user, session_id):
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    return jsonify({"session": session.to_dict(include_blocks=True)})


@trainings_bp.route("", methods=["POST"])
@coach_required
def create_training(user):
    data = request.get_json()
    team_id = data.get("team_id")
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    if not data.get("date"):
        return jsonify({"error": "date is required"}), 400

    session = TrainingSession(
        team_id=team.id,
        date=data["date"],
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
        duration_minutes=data.get("duration_minutes"),
        title=data.get("title"),
        objectives=json.dumps(data.get("objectives", [])),
        template_name=data.get("template_name"),
    )
    db.session.add(session)
    db.session.flush()

    # Create blocks if provided
    for i, block_data in enumerate(data.get("blocks", [])):
        block = TrainingBlock(
            session_id=session.id,
            order=i,
            block_type=block_data.get("block_type", "technical"),
            name=block_data.get("name", f"Block {i+1}"),
            objective=block_data.get("objective"),
            duration_minutes=block_data.get("duration_minutes"),
            intensity=block_data.get("intensity"),
            description=block_data.get("description"),
            coaching_points=block_data.get("coaching_points"),
            variations=block_data.get("variations"),
            equipment=block_data.get("equipment"),
            space=block_data.get("space"),
            num_players=block_data.get("num_players"),
            rules=block_data.get("rules"),
            tags=json.dumps(block_data.get("tags", [])),
        )
        db.session.add(block)

    db.session.commit()
    return jsonify({"session": session.to_dict(include_blocks=True)}), 201


@trainings_bp.route("/<int:session_id>", methods=["PATCH"])
@coach_required
def update_training(user, session_id):
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    updatable = ["date", "start_time", "end_time", "duration_minutes", "title",
                 "status", "rpe_avg", "session_rating", "what_worked", "what_to_improve"]
    for field in updatable:
        if field in data:
            setattr(session, field, data[field])
    if "objectives" in data:
        session.objectives = json.dumps(data["objectives"])

    db.session.commit()
    return jsonify({"session": session.to_dict(include_blocks=True)})


@trainings_bp.route("/<int:session_id>", methods=["DELETE"])
@coach_required
def delete_training(user, session_id):
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted"})


# --- Training Blocks ---

@trainings_bp.route("/<int:session_id>/blocks", methods=["POST"])
@coach_required
def add_block(user, session_id):
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    max_order = db.session.query(db.func.max(TrainingBlock.order))\
        .filter_by(session_id=session.id).scalar() or 0

    block = TrainingBlock(
        session_id=session.id,
        order=max_order + 1,
        block_type=data.get("block_type", "technical"),
        name=data.get("name", "New Block"),
        objective=data.get("objective"),
        duration_minutes=data.get("duration_minutes"),
        intensity=data.get("intensity"),
        description=data.get("description"),
        coaching_points=data.get("coaching_points"),
        variations=data.get("variations"),
        equipment=data.get("equipment"),
        space=data.get("space"),
        num_players=data.get("num_players"),
        rules=data.get("rules"),
        tags=json.dumps(data.get("tags", [])),
    )
    db.session.add(block)
    db.session.commit()
    return jsonify({"block": block.to_dict()}), 201


@trainings_bp.route("/<int:session_id>/blocks/<int:block_id>", methods=["PATCH"])
@coach_required
def update_block(user, session_id, block_id):
    block = TrainingBlock.query.filter_by(id=block_id, session_id=session_id).first()
    if not block:
        return jsonify({"error": "Block not found"}), 404

    session = TrainingSession.query.get(session_id)
    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    updatable = ["order", "block_type", "name", "objective", "duration_minutes",
                 "intensity", "description", "coaching_points", "variations",
                 "equipment", "space", "num_players", "rules",
                 "completed", "actual_rpe", "notes"]
    for field in updatable:
        if field in data:
            setattr(block, field, data[field])
    if "tags" in data:
        block.tags = json.dumps(data["tags"])

    db.session.commit()
    return jsonify({"block": block.to_dict()})
