"""Dashboard and statistics endpoints."""
import json
from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models.athlete import Athlete
from app.models.team import Team
from app.models.training import TrainingSession
from app.models.match import Match
from app.models.evaluation import Evaluation
from app.models.wellness import WellnessEntry
from app.models.attendance import Attendance
from app.models.note import Note
from app.models.injury import Injury
from app.utils.auth import coach_required

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/athlete/<int:athlete_id>", methods=["GET"])
@coach_required
def athlete_dashboard(user, athlete_id):
    """Full athlete profile dashboard data."""
    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    # Last 7 days wellness
    week_ago = date.today() - timedelta(days=7)
    wellness = [w.to_dict() for w in WellnessEntry.query.filter(
        WellnessEntry.athlete_id == athlete.id,
        WellnessEntry.date >= week_ago
    ).order_by(WellnessEntry.date.desc()).all()]

    # Recent evaluations (last 10)
    evaluations = [e.to_dict() for e in Evaluation.query.filter_by(
        athlete_id=athlete.id
    ).order_by(Evaluation.date.desc()).limit(10).all()]

    # Attendance stats
    total_sessions = TrainingSession.query.filter_by(team_id=team.id).count()
    attended = Attendance.query.filter_by(athlete_id=athlete.id, status="present").count()
    attendance_pct = round((attended / total_sessions * 100) if total_sessions > 0 else 0, 1)

    # Active injuries
    active_injuries = [i.to_dict() for i in Injury.query.filter(
        Injury.athlete_id == athlete.id,
        Injury.status != "cleared"
    ).all()]

    # Recent notes
    notes = [n.to_dict() for n in Note.query.filter_by(
        coach_id=user.id, entity_type="athlete", entity_id=athlete.id
    ).order_by(Note.created_at.desc()).limit(10).all()]

    # Workload last 7 days (sum of RPE * duration from attendances)
    recent_attendances = Attendance.query.join(TrainingSession).filter(
        Attendance.athlete_id == athlete.id,
        TrainingSession.date >= week_ago
    ).all()
    weekly_load = sum(
        (a.rpe or 5) * (a.session.duration_minutes or 60)
        for a in recent_attendances
    )

    return jsonify({
        "athlete": athlete.to_dict(),
        "team": team.to_dict(),
        "wellness": wellness,
        "evaluations": evaluations,
        "attendance_pct": attendance_pct,
        "total_sessions": total_sessions,
        "sessions_attended": attended,
        "active_injuries": active_injuries,
        "notes": notes,
        "weekly_load": weekly_load,
    })


@dashboard_bp.route("/team/<int:team_id>/stats", methods=["GET"])
@coach_required
def team_stats(user, team_id):
    """Team statistics dashboard."""
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    month_ago = date.today() - timedelta(days=30)

    # Training stats
    total_trainings = TrainingSession.query.filter_by(team_id=team.id).count()
    recent_trainings = TrainingSession.query.filter(
        TrainingSession.team_id == team.id,
        TrainingSession.date >= month_ago
    ).count()

    # Match stats
    total_matches = Match.query.filter_by(team_id=team.id).count()
    completed_matches = Match.query.filter_by(team_id=team.id, status="completed").all()
    wins = sum(1 for m in completed_matches if m.result == "win")
    draws = sum(1 for m in completed_matches if m.result == "draw")
    losses = sum(1 for m in completed_matches if m.result == "loss")

    # Athletes stats
    total_athletes = Athlete.query.filter_by(team_id=team.id).count()
    available = Athlete.query.filter_by(team_id=team.id, status="available").count()
    attention = Athlete.query.filter_by(team_id=team.id, status="attention").count()
    unavailable = Athlete.query.filter_by(team_id=team.id, status="unavailable").count()

    # Average attendance
    sessions = TrainingSession.query.filter_by(team_id=team.id).all()
    attendance_rates = []
    for s in sessions:
        present = Attendance.query.filter_by(training_session_id=s.id, status="present").count()
        if total_athletes > 0:
            attendance_rates.append(present / total_athletes * 100)
    avg_attendance = round(sum(attendance_rates) / len(attendance_rates), 1) if attendance_rates else 0

    # Training load per week (last 4 weeks)
    weekly_loads = []
    for w in range(4):
        start = date.today() - timedelta(days=(w + 1) * 7)
        end = date.today() - timedelta(days=w * 7)
        week_sessions = TrainingSession.query.filter(
            TrainingSession.team_id == team.id,
            TrainingSession.date >= start,
            TrainingSession.date < end
        ).all()
        total_minutes = sum(s.duration_minutes or 0 for s in week_sessions)
        weekly_loads.append({
            "week": f"Sett. -{w + 1}",
            "sessions": len(week_sessions),
            "minutes": total_minutes,
        })

    return jsonify({
        "team": team.to_dict(),
        "total_trainings": total_trainings,
        "recent_trainings": recent_trainings,
        "total_matches": total_matches,
        "match_record": {"wins": wins, "draws": draws, "losses": losses},
        "athletes": {
            "total": total_athletes,
            "available": available,
            "attention": attention,
            "unavailable": unavailable,
        },
        "avg_attendance": avg_attendance,
        "weekly_loads": weekly_loads,
    })
