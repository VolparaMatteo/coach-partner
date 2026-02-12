import os
import time

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app import db
from app.models.athlete import Athlete
from app.models.team import Team
from app.utils.auth import coach_required

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

athletes_bp = Blueprint("athletes", __name__)


@athletes_bp.route("", methods=["GET"])
@coach_required
def list_athletes(user):
    team_id = request.args.get("team_id", type=int)
    if not team_id:
        return jsonify({"error": "team_id is required"}), 400

    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    # Optional filters
    status = request.args.get("status")
    position = request.args.get("position")

    query = Athlete.query.filter_by(team_id=team.id)
    if status:
        query = query.filter_by(status=status)
    if position:
        query = query.filter_by(position=position)

    athletes = query.order_by(Athlete.jersey_number, Athlete.last_name).all()
    return jsonify({"athletes": [a.to_dict() for a in athletes]})


@athletes_bp.route("/<int:athlete_id>", methods=["GET"])
@coach_required
def get_athlete(user, athlete_id):
    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    return jsonify({"athlete": athlete.to_dict()})


@athletes_bp.route("", methods=["POST"])
@coach_required
def create_athlete(user):
    data = request.get_json()
    team_id = data.get("team_id")
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    if not data.get("first_name") or not data.get("last_name"):
        return jsonify({"error": "first_name and last_name are required"}), 400

    athlete = Athlete(
        team_id=team.id,
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        birth_date=data.get("birth_date"),
        jersey_number=data.get("jersey_number"),
        position=data.get("position"),
        secondary_position=data.get("secondary_position"),
        dominant_foot=data.get("dominant_foot"),
        dominant_hand=data.get("dominant_hand"),
        height_cm=data.get("height_cm"),
        weight_kg=data.get("weight_kg"),
        notes=data.get("notes"),
    )
    db.session.add(athlete)
    db.session.commit()
    return jsonify({"athlete": athlete.to_dict()}), 201


@athletes_bp.route("/<int:athlete_id>", methods=["PATCH"])
@coach_required
def update_athlete(user, athlete_id):
    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    updatable = [
        "first_name", "last_name", "birth_date", "jersey_number",
        "position", "secondary_position", "dominant_foot", "dominant_hand",
        "height_cm", "weight_kg", "status", "notes", "objectives", "photo_url",
    ]
    for field in updatable:
        if field in data:
            setattr(athlete, field, data[field])

    db.session.commit()
    return jsonify({"athlete": athlete.to_dict()})


@athletes_bp.route("/<int:athlete_id>", methods=["DELETE"])
@coach_required
def delete_athlete(user, athlete_id):
    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    db.session.delete(athlete)
    db.session.commit()
    return jsonify({"message": "Athlete deleted"})


@athletes_bp.route("/<int:athlete_id>/photo", methods=["POST"])
@coach_required
def upload_photo(user, athlete_id):
    athlete = Athlete.query.get(athlete_id)
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404

    team = Team.query.filter_by(id=athlete.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    if "photo" not in request.files:
        return jsonify({"error": "No photo file provided"}), 400

    file = request.files["photo"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Use jpg, jpeg, png, or webp"}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_CONTENT_LENGTH:
        return jsonify({"error": "File too large. Maximum size is 5 MB"}), 413

    # Build safe filename: {athlete_id}_{timestamp}.{ext}
    ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
    timestamp = int(time.time())
    filename = f"{athlete_id}_{timestamp}.{ext}"

    upload_dir = os.path.join(current_app.root_path, "..", "uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    # Update athlete record with the URL path served by the app
    photo_url = f"/api/uploads/avatars/{filename}"
    athlete.photo_url = photo_url
    db.session.commit()

    return jsonify({
        "message": "Photo uploaded successfully",
        "photo_url": photo_url,
        "athlete": athlete.to_dict(),
    })
