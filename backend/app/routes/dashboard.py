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


@dashboard_bp.route("/suggestions/<int:team_id>", methods=["GET"])
@coach_required
def training_suggestions(user, team_id):
    """AI-driven training suggestions based on team wellness, workload and injuries."""
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    today = date.today()
    week_ago = today - timedelta(days=7)

    # 1. Get all athletes for the team
    athletes = Athlete.query.filter_by(team_id=team.id).all()
    athlete_ids = [a.id for a in athletes]

    if not athlete_ids:
        return jsonify({"error": "No athletes in this team"}), 404

    # 2. Last 7 days of wellness entries for all athletes
    wellness_entries = WellnessEntry.query.filter(
        WellnessEntry.athlete_id.in_(athlete_ids),
        WellnessEntry.date >= week_ago
    ).all()

    # 3. Last 7 days of training sessions (with attendance)
    recent_sessions = TrainingSession.query.filter(
        TrainingSession.team_id == team.id,
        TrainingSession.date >= week_ago
    ).all()

    session_ids = [s.id for s in recent_sessions]
    recent_attendances = []
    if session_ids:
        recent_attendances = Attendance.query.filter(
            Attendance.training_session_id.in_(session_ids)
        ).all()

    # 4. Active injuries for the team
    active_injuries = Injury.query.filter(
        Injury.athlete_id.in_(athlete_ids),
        Injury.status != "cleared"
    ).all()

    # 5. Calculate metrics
    energy_values = [w.energy for w in wellness_entries if w.energy is not None]
    stress_values = [w.stress for w in wellness_entries if w.stress is not None]
    sleep_values = [w.sleep_quality for w in wellness_entries if w.sleep_quality is not None]
    doms_values = [w.doms for w in wellness_entries if w.doms is not None]

    avg_energy = round(sum(energy_values) / len(energy_values), 1) if energy_values else 5.0
    avg_stress = round(sum(stress_values) / len(stress_values), 1) if stress_values else 5.0
    avg_sleep = round(sum(sleep_values) / len(sleep_values), 1) if sleep_values else 5.0
    avg_doms = round(sum(doms_values) / len(doms_values), 1) if doms_values else 5.0

    injury_count = len(active_injuries)
    sessions_this_week = len(recent_sessions)

    # Average RPE from recent sessions (session-level first, fallback to attendance)
    session_rpes = [s.rpe_avg for s in recent_sessions if s.rpe_avg is not None]
    if not session_rpes:
        attendance_rpes = [a.rpe for a in recent_attendances if a.rpe is not None]
        avg_rpe = round(sum(attendance_rpes) / len(attendance_rpes), 1) if attendance_rpes else None
    else:
        avg_rpe = round(sum(session_rpes) / len(session_rpes), 1)

    # 6. Generate suggestions
    intensity = "medium"
    intensity_reason = ""
    focus_areas = []
    warnings = []

    # Low energy or high stress -> low intensity
    if avg_energy < 4 or avg_stress > 7:
        intensity = "low"
        intensity_reason = "Low energy or high stress levels detected across the team"
        focus_areas.append("technical/tactical (low intensity)")
        focus_areas.append("recovery work")

    # High injury count -> reduce intensity, add warning
    if injury_count > 2:
        warnings.append(f"{injury_count} active injuries in the squad — consider adapted exercises")
        if intensity != "low":
            intensity = "low"
            intensity_reason = "Multiple active injuries require reduced training load"
        focus_areas.append("injury prevention")

    # Heavy week -> suggest rest or low intensity
    if sessions_this_week >= 4:
        warnings.append(f"{sessions_this_week} sessions this week — consider a recovery day")
        if intensity == "medium":
            intensity = "low"
            intensity_reason = "High weekly session count suggests need for recovery"
        focus_areas.append("active recovery")

    # High RPE -> lower intensity
    if avg_rpe is not None and avg_rpe > 7:
        warnings.append(f"Average RPE is {avg_rpe} — athletes are reporting high exertion")
        if intensity != "low":
            intensity = "low"
            intensity_reason = "Recent high RPE values indicate accumulated fatigue"
        focus_areas.append("technical/tactical (low intensity)")

    # If no special conditions triggered, set based on energy/stress balance
    if not intensity_reason:
        if avg_energy >= 7 and avg_stress <= 4:
            intensity = "high"
            intensity_reason = "Team shows high energy and low stress — good conditions for intense work"
            focus_areas.append("physical conditioning")
            focus_areas.append("high-intensity tactical drills")
        elif avg_energy >= 5:
            intensity = "medium"
            intensity_reason = "Team wellness is balanced — standard training intensity appropriate"
            focus_areas.append("technical development")
            focus_areas.append("tactical work")
        else:
            intensity = "low"
            intensity_reason = "Below-average energy levels suggest a lighter session"
            focus_areas.append("technical/tactical (low intensity)")

    # Additional focus area suggestions based on specific metrics
    if avg_energy < 5 and "physical conditioning" not in focus_areas:
        focus_areas.append("technical/tactical (low intensity)")
    if avg_doms > 6:
        warnings.append(f"Average muscle soreness (DOMS) is {avg_doms}/10 — consider lighter physical load")
        if "recovery work" not in focus_areas:
            focus_areas.append("recovery work")
    if avg_sleep < 5:
        warnings.append(f"Average sleep quality is {avg_sleep}/10 — monitor athlete wellbeing")

    # Deduplicate focus areas while preserving order
    seen = set()
    unique_focus = []
    for fa in focus_areas:
        if fa not in seen:
            seen.add(fa)
            unique_focus.append(fa)
    focus_areas = unique_focus

    # Suggested duration based on intensity
    if intensity == "low":
        suggested_duration = 60
    elif intensity == "high":
        suggested_duration = 90
    else:
        suggested_duration = 75

    # Recovery score (1-10): based on energy, sleep quality, and inverted stress
    inverted_stress = 11 - avg_stress  # high stress = low recovery
    recovery_score = round((avg_energy + avg_sleep + inverted_stress) / 3)
    recovery_score = max(1, min(10, recovery_score))

    # Readiness score (1-10): combination of all factors
    rpe_penalty = 0
    if avg_rpe is not None:
        rpe_penalty = max(0, avg_rpe - 5) * 0.5  # penalise high RPE

    session_penalty = max(0, sessions_this_week - 3) * 0.5  # penalise heavy weeks
    injury_penalty = min(injury_count * 0.5, 3)  # cap injury penalty at 3
    inverted_doms = 11 - avg_doms

    readiness_raw = (
        avg_energy + avg_sleep + inverted_stress + inverted_doms
    ) / 4 - rpe_penalty - session_penalty - injury_penalty

    readiness_score = round(max(1, min(10, readiness_raw)))

    suggestions = {
        "intensity": intensity,
        "intensity_reason": intensity_reason,
        "suggested_duration": suggested_duration,
        "focus_areas": focus_areas,
        "warnings": warnings,
        "recovery_score": recovery_score,
        "readiness_score": readiness_score,
        "metrics": {
            "avg_energy": avg_energy,
            "avg_stress": avg_stress,
            "injury_count": injury_count,
            "sessions_this_week": sessions_this_week,
            "avg_rpe": avg_rpe,
        },
    }

    return jsonify(suggestions), 200
