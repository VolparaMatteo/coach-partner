"""Periodization cycle CRUD and calendar view."""
from datetime import date
from flask import Blueprint, request, jsonify
from app import db
from app.models.periodization import PeriodizationCycle
from app.models.training import TrainingSession
from app.models.match import Match
from app.models.team import Team
from app.utils.auth import coach_required

periodization_bp = Blueprint("periodization", __name__)


@periodization_bp.route("/", methods=["GET"])
@coach_required
def list_cycles(user):
    team_id = request.args.get("team_id", type=int)
    cycle_type = request.args.get("cycle_type")
    if not team_id:
        return jsonify({"error": "team_id required"}), 400
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404
    q = PeriodizationCycle.query.filter_by(team_id=team_id)
    if cycle_type:
        q = q.filter_by(cycle_type=cycle_type)
    cycles = q.order_by(PeriodizationCycle.start_date).all()
    return jsonify({"cycles": [c.to_dict() for c in cycles]})


@periodization_bp.route("/", methods=["POST"])
@coach_required
def create_cycle(user):
    data = request.get_json()
    team_id = data.get("team_id")
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404
    cycle = PeriodizationCycle(
        team_id=team_id,
        parent_id=data.get("parent_id"),
        name=data["name"],
        cycle_type=data["cycle_type"],
        start_date=date.fromisoformat(data["start_date"]),
        end_date=date.fromisoformat(data["end_date"]),
        objectives=data.get("objectives"),
        planned_load=data.get("planned_load"),
        notes=data.get("notes"),
        color=data.get("color"),
    )
    db.session.add(cycle)
    db.session.commit()
    return jsonify({"cycle": cycle.to_dict()}), 201


@periodization_bp.route("/<int:cycle_id>", methods=["PUT"])
@coach_required
def update_cycle(user, cycle_id):
    cycle = PeriodizationCycle.query.get(cycle_id)
    if not cycle:
        return jsonify({"error": "Cycle not found"}), 404
    team = Team.query.filter_by(id=cycle.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403
    data = request.get_json()
    for field in ["name", "cycle_type", "objectives", "planned_load", "notes", "color", "parent_id"]:
        if field in data:
            setattr(cycle, field, data[field])
    if "start_date" in data:
        cycle.start_date = date.fromisoformat(data["start_date"])
    if "end_date" in data:
        cycle.end_date = date.fromisoformat(data["end_date"])
    db.session.commit()
    return jsonify({"cycle": cycle.to_dict()})


@periodization_bp.route("/<int:cycle_id>", methods=["DELETE"])
@coach_required
def delete_cycle(user, cycle_id):
    cycle = PeriodizationCycle.query.get(cycle_id)
    if not cycle:
        return jsonify({"error": "Cycle not found"}), 404
    team = Team.query.filter_by(id=cycle.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403
    db.session.delete(cycle)
    db.session.commit()
    return jsonify({"deleted": True})


@periodization_bp.route("/calendar", methods=["GET"])
@coach_required
def calendar_view(user):
    team_id = request.args.get("team_id", type=int)
    start = request.args.get("start")
    end = request.args.get("end")
    if not team_id or not start or not end:
        return jsonify({"error": "team_id, start and end required"}), 400
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404
    start_date = date.fromisoformat(start)
    end_date = date.fromisoformat(end)
    cycles = PeriodizationCycle.query.filter(
        PeriodizationCycle.team_id == team_id,
        PeriodizationCycle.start_date <= end_date,
        PeriodizationCycle.end_date >= start_date,
    ).order_by(PeriodizationCycle.start_date).all()
    sessions = TrainingSession.query.filter(
        TrainingSession.team_id == team_id,
        TrainingSession.date >= start_date,
        TrainingSession.date <= end_date,
    ).order_by(TrainingSession.date).all()
    matches = Match.query.filter(
        Match.team_id == team_id,
        Match.date >= start_date,
        Match.date <= end_date,
    ).order_by(Match.date).all()
    weekly_loads = {}
    for s in sessions:
        iso_year, iso_week, _ = s.date.isocalendar()
        week_key = f"{iso_year}-W{iso_week:02d}"
        if week_key not in weekly_loads:
            weekly_loads[week_key] = {"sessions": 0, "total_minutes": 0, "rpe_list": [], "total_load": 0}
        weekly_loads[week_key]["sessions"] += 1
        weekly_loads[week_key]["total_minutes"] += s.duration_minutes or 0
        if s.rpe_avg:
            weekly_loads[week_key]["rpe_list"].append(s.rpe_avg)
            weekly_loads[week_key]["total_load"] += (s.rpe_avg * (s.duration_minutes or 0))
    for wk in weekly_loads.values():
        rpes = wk.pop("rpe_list")
        wk["avg_rpe"] = round(sum(rpes) / len(rpes), 1) if rpes else None
    return jsonify({
        "cycles": [c.to_dict() for c in cycles],
        "sessions": [s.to_dict() for s in sessions],
        "matches": [m.to_dict() for m in matches],
        "weekly_loads": weekly_loads,
    })
