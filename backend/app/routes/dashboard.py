"""Dashboard and statistics endpoints."""
import json
from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract, case
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
from app.models.user import User
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


@dashboard_bp.route("/stats/<int:team_id>", methods=["GET"])
@jwt_required()
def advanced_team_stats(team_id):
    """Comprehensive dashboard statistics for the advanced dashboard."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found or not authorized"}), 404

    today = date.today()

    # ── KPIs ──────────────────────────────────────────────────────────────

    total_athletes = Athlete.query.filter_by(team_id=team.id).count()
    total_sessions = TrainingSession.query.filter_by(team_id=team.id).count()
    total_matches = Match.query.filter_by(team_id=team.id).count()

    # Win rate: percentage of completed matches that were won
    completed_matches = Match.query.filter_by(
        team_id=team.id, status="completed"
    ).all()
    wins = sum(1 for m in completed_matches if m.result == "win")
    win_rate = round((wins / len(completed_matches) * 100) if completed_matches else 0, 1)

    # Average session duration (across all sessions that have a duration)
    avg_duration_result = db.session.query(
        func.avg(TrainingSession.duration_minutes)
    ).filter(
        TrainingSession.team_id == team.id,
        TrainingSession.duration_minutes.isnot(None)
    ).scalar()
    avg_session_duration = round(float(avg_duration_result), 1) if avg_duration_result else 0

    # Completed sessions
    completed_sessions = TrainingSession.query.filter_by(
        team_id=team.id, status="completed"
    ).count()

    kpis = {
        "total_athletes": total_athletes,
        "total_sessions": total_sessions,
        "total_matches": total_matches,
        "win_rate": win_rate,
        "avg_session_duration": avg_session_duration,
        "completed_sessions": completed_sessions,
    }

    # ── Weekly trend (last 4 weeks) ───────────────────────────────────────

    weekly_trend = []
    for w in range(4):
        week_end = today - timedelta(days=w * 7)
        week_start = week_end - timedelta(days=6)
        iso_year, iso_week, _ = week_start.isocalendar()
        week_label = f"{iso_year}-W{iso_week:02d}"

        # Sessions in this week window
        week_sessions = TrainingSession.query.filter(
            TrainingSession.team_id == team.id,
            TrainingSession.date >= week_start,
            TrainingSession.date <= week_end
        ).all()

        # Matches in this week window
        week_matches_count = Match.query.filter(
            Match.team_id == team.id,
            Match.date >= week_start,
            Match.date <= week_end
        ).count()

        # Average RPE across sessions in this week (from session-level rpe_avg)
        session_rpes = [s.rpe_avg for s in week_sessions if s.rpe_avg is not None]
        if not session_rpes:
            # Fallback: compute from individual attendance RPE records
            session_ids = [s.id for s in week_sessions]
            if session_ids:
                avg_rpe_result = db.session.query(
                    func.avg(Attendance.rpe)
                ).filter(
                    Attendance.training_session_id.in_(session_ids),
                    Attendance.rpe.isnot(None)
                ).scalar()
                avg_rpe = round(float(avg_rpe_result), 1) if avg_rpe_result else None
            else:
                avg_rpe = None
        else:
            avg_rpe = round(sum(session_rpes) / len(session_rpes), 1)

        weekly_trend.append({
            "week": week_label,
            "sessions": len(week_sessions),
            "matches": week_matches_count,
            "avg_rpe": avg_rpe,
        })

    # Return in chronological order (oldest week first)
    weekly_trend.reverse()

    # ── Attendance summary ────────────────────────────────────────────────

    if total_athletes > 0 and total_sessions > 0:
        all_sessions = TrainingSession.query.filter_by(team_id=team.id).all()
        attendance_rates = []
        for s in all_sessions:
            present = Attendance.query.filter_by(
                training_session_id=s.id, status="present"
            ).count()
            attendance_rates.append(present / total_athletes * 100)
        avg_attendance_rate = round(
            sum(attendance_rates) / len(attendance_rates), 1
        ) if attendance_rates else 0
    else:
        avg_attendance_rate = 0

    # ── Team health ───────────────────────────────────────────────────────

    athletes_available = Athlete.query.filter_by(
        team_id=team.id, status="available"
    ).count()
    athletes_attention = Athlete.query.filter_by(
        team_id=team.id, status="attention"
    ).count()
    athletes_unavailable = Athlete.query.filter_by(
        team_id=team.id, status="unavailable"
    ).count()

    team_health = {
        "athletes_available": athletes_available,
        "athletes_attention": athletes_attention,
        "athletes_unavailable": athletes_unavailable,
    }

    return jsonify({
        "kpis": kpis,
        "weekly_trend": weekly_trend,
        "avg_attendance_rate": avg_attendance_rate,
        "team_health": team_health,
    })
