import json
from flask import Blueprint, request, jsonify
from app import db
from app.models.ai_report import AIReport
from app.models.training import TrainingSession
from app.models.match import Match
from app.models.note import Note
from app.models.evaluation import Evaluation
from app.models.wellness import WellnessEntry
from app.models.athlete import Athlete
from app.models.team import Team
from app.services.ai_service import (
    generate_post_training_report,
    generate_post_match_report,
    generate_athlete_weekly_summary,
    synthesize_coach_notes,
)
from app.utils.auth import coach_required

ai_reports_bp = Blueprint("ai_reports", __name__)


@ai_reports_bp.route("/reports", methods=["GET"])
@coach_required
def list_reports(user):
    reports = AIReport.query.filter_by(coach_id=user.id)\
        .order_by(AIReport.created_at.desc()).limit(20).all()
    return jsonify({"reports": [r.to_dict() for r in reports]})


@ai_reports_bp.route("/reports/<int:report_id>", methods=["GET"])
@coach_required
def get_report(user, report_id):
    report = AIReport.query.filter_by(id=report_id, coach_id=user.id).first()
    if not report:
        return jsonify({"error": "Report not found"}), 404
    return jsonify({"report": report.to_dict()})


@ai_reports_bp.route("/generate/post-training", methods=["POST"])
@coach_required
def gen_post_training(user):
    data = request.get_json()
    session_id = data.get("session_id")
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    notes = [n.to_dict() for n in Note.query.filter_by(
        coach_id=user.id, entity_type="training", entity_id=session.id
    ).all()]
    attendances = [a.to_dict() for a in session.attendances.all()]

    result = generate_post_training_report(session.to_dict(include_blocks=True), notes, attendances)

    if result.get("error"):
        return jsonify({"error": result["error"]}), 503

    report = AIReport(
        coach_id=user.id,
        report_type="post_training",
        title=f"Report: {session.title or session.date}",
        input_refs=json.dumps({"training_ids": [session.id]}),
        content=result["content"],
        confidence=result.get("confidence"),
        prompt_used=result.get("prompt_used"),
        model_used=result.get("model_used"),
    )
    db.session.add(report)
    db.session.commit()

    return jsonify({"report": report.to_dict()}), 201


@ai_reports_bp.route("/generate/post-match", methods=["POST"])
@coach_required
def gen_post_match(user):
    data = request.get_json()
    match_id = data.get("match_id")
    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    team = Team.query.filter_by(id=match.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    evaluations = [e.to_dict() for e in Evaluation.query.filter_by(match_id=match.id).all()]
    notes = [n.to_dict() for n in Note.query.filter_by(
        coach_id=user.id, entity_type="match", entity_id=match.id
    ).all()]

    result = generate_post_match_report(match.to_dict(), evaluations, notes)

    if result.get("error"):
        return jsonify({"error": result["error"]}), 503

    report = AIReport(
        coach_id=user.id,
        report_type="post_match",
        title=f"Report: vs {match.opponent}",
        input_refs=json.dumps({"match_ids": [match.id]}),
        content=result["content"],
        confidence=result.get("confidence"),
        prompt_used=result.get("prompt_used"),
        model_used=result.get("model_used"),
    )
    db.session.add(report)
    db.session.commit()

    return jsonify({"report": report.to_dict()}), 201


@ai_reports_bp.route("/generate/athlete-weekly", methods=["POST"])
@coach_required
def gen_athlete_weekly(user):
    data = request.get_json()
    athlete_id = data.get("athlete_id")
    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    evaluations = [e.to_dict() for e in athlete.evaluations.order_by(
        Evaluation.date.desc()).limit(7).all()]
    wellness = [w.to_dict() for w in athlete.wellness_entries.order_by(
        WellnessEntry.date.desc()).limit(7).all()]
    notes = [n.to_dict() for n in Note.query.filter_by(
        coach_id=user.id, entity_type="athlete", entity_id=athlete.id
    ).order_by(Note.created_at.desc()).limit(10).all()]

    result = generate_athlete_weekly_summary(athlete.to_dict(), evaluations, wellness, notes)

    if result.get("error"):
        return jsonify({"error": result["error"]}), 503

    report = AIReport(
        coach_id=user.id,
        report_type="athlete_weekly",
        title=f"Settimana: {athlete.first_name} {athlete.last_name}",
        input_refs=json.dumps({"athlete_ids": [athlete.id]}),
        content=result["content"],
        confidence=result.get("confidence"),
        prompt_used=result.get("prompt_used"),
        model_used=result.get("model_used"),
    )
    db.session.add(report)
    db.session.commit()

    return jsonify({"report": report.to_dict()}), 201


@ai_reports_bp.route("/reports/<int:report_id>/feedback", methods=["POST"])
@coach_required
def report_feedback(user, report_id):
    report = AIReport.query.filter_by(id=report_id, coach_id=user.id).first()
    if not report:
        return jsonify({"error": "Report not found"}), 404

    data = request.get_json()
    if "feedback" in data:
        report.feedback = data["feedback"]
    if "coach_edits" in data:
        report.coach_edits = data["coach_edits"]
    if "saved" in data:
        report.saved = data["saved"]

    db.session.commit()
    return jsonify({"report": report.to_dict()})
