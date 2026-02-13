from datetime import datetime
from flask import Blueprint, request, jsonify
from app import db
from app.models.goal import Goal
from app.models.athlete import Athlete
from app.models.team import Team
from app.utils.auth import coach_required

goals_bp = Blueprint("goals", __name__)


@goals_bp.route("", methods=["GET"])
@coach_required
def list_goals(user):
    """List goals for an athlete (query param athlete_id required)."""
    athlete_id = request.args.get("athlete_id", type=int)
    if not athlete_id:
        return jsonify({"error": "athlete_id is required"}), 400

    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    goals = Goal.query.filter_by(athlete_id=athlete.id)\
        .order_by(Goal.created_at.desc()).all()
    return jsonify({"goals": [g.to_dict() for g in goals]})


@goals_bp.route("", methods=["POST"])
@coach_required
def create_goal(user):
    """Create a new goal for an athlete."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    athlete = Athlete.query.get(data.get("athlete_id"))
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    if not data.get("title"):
        return jsonify({"error": "title is required"}), 400

    deadline = None
    if data.get("deadline"):
        try:
            deadline = datetime.strptime(data["deadline"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid deadline format, use YYYY-MM-DD"}), 400

    goal = Goal(
        athlete_id=athlete.id,
        title=data["title"].strip(),
        description=data.get("description", "").strip() if data.get("description") else None,
        category=data.get("category"),
        deadline=deadline,
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({"goal": goal.to_dict()}), 201


@goals_bp.route("/<int:goal_id>", methods=["PUT"])
@coach_required
def update_goal(user, goal_id):
    """Update an existing goal."""
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    athlete = Athlete.query.get(goal.athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    if "title" in data:
        goal.title = data["title"].strip()
    if "description" in data:
        goal.description = data["description"].strip() if data["description"] else None
    if "category" in data:
        goal.category = data["category"]
    if "progress" in data:
        progress = data["progress"]
        if isinstance(progress, int) and 0 <= progress <= 100:
            goal.progress = progress
        else:
            return jsonify({"error": "progress must be an integer between 0 and 100"}), 400
    if "status" in data:
        if data["status"] in ("active", "completed", "abandoned"):
            goal.status = data["status"]
        else:
            return jsonify({"error": "status must be active, completed, or abandoned"}), 400
    if "deadline" in data:
        if data["deadline"]:
            try:
                goal.deadline = datetime.strptime(data["deadline"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Invalid deadline format, use YYYY-MM-DD"}), 400
        else:
            goal.deadline = None

    db.session.commit()
    return jsonify({"goal": goal.to_dict()})


@goals_bp.route("/<int:goal_id>", methods=["DELETE"])
@coach_required
def delete_goal(user, goal_id):
    """Delete a goal."""
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    athlete = Athlete.query.get(goal.athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted"})
