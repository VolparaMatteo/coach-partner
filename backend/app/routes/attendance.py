from flask import Blueprint, request, jsonify
from app import db
from app.models.attendance import Attendance
from app.models.training import TrainingSession
from app.models.team import Team
from app.utils.auth import coach_required

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/<int:session_id>", methods=["GET"])
@coach_required
def get_attendance(user, session_id):
    """Get attendance records for a training session."""
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    # Verify session belongs to a team owned by this coach
    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    records = Attendance.query.filter_by(training_session_id=session_id).all()
    return jsonify({
        "attendance": [
            {
                "athlete_id": r.athlete_id,
                "status": r.status,
                "minutes_trained": r.minutes_trained,
                "note": r.notes or "",
            }
            for r in records
        ]
    })


@attendance_bp.route("/<int:session_id>", methods=["POST"])
@coach_required
def save_attendance(user, session_id):
    """Bulk save/update attendance for a training session (upsert)."""
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    # Verify session belongs to a team owned by this coach
    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    attendance_list = data.get("attendance", [])
    if not attendance_list:
        return jsonify({"error": "attendance list is required"}), 400

    VALID_STATUSES = {"present", "absent", "excused", "injured"}
    saved = []

    for entry in attendance_list:
        athlete_id = entry.get("athlete_id")
        if not athlete_id:
            continue

        status = entry.get("status", "present")
        if status not in VALID_STATUSES:
            status = "present"

        # Upsert: update existing record or create new one
        record = Attendance.query.filter_by(
            training_session_id=session_id,
            athlete_id=athlete_id,
        ).first()

        if record:
            record.status = status
            record.minutes_trained = entry.get("minutes_trained")
            record.notes = entry.get("note")
        else:
            record = Attendance(
                training_session_id=session_id,
                athlete_id=athlete_id,
                status=status,
                minutes_trained=entry.get("minutes_trained"),
                notes=entry.get("note"),
            )
            db.session.add(record)

        saved.append(record)

    db.session.commit()

    return jsonify({
        "attendance": [
            {
                "athlete_id": r.athlete_id,
                "status": r.status,
                "minutes_trained": r.minutes_trained,
                "note": r.notes or "",
            }
            for r in saved
        ]
    }), 200
