import json
from flask import Blueprint, request, jsonify
from app import db
from app.models.note import Note
from app.utils.auth import coach_required

notes_bp = Blueprint("notes", __name__)


@notes_bp.route("", methods=["GET"])
@coach_required
def list_notes(user):
    entity_type = request.args.get("entity_type")
    entity_id = request.args.get("entity_id", type=int)

    query = Note.query.filter_by(coach_id=user.id)
    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    if entity_id:
        query = query.filter_by(entity_id=entity_id)

    notes = query.order_by(Note.created_at.desc()).limit(50).all()
    return jsonify({"notes": [n.to_dict() for n in notes]})


@notes_bp.route("", methods=["POST"])
@coach_required
def create_note(user):
    data = request.get_json()
    if not data.get("text"):
        return jsonify({"error": "text is required"}), 400

    note = Note(
        coach_id=user.id,
        entity_type=data.get("entity_type"),
        entity_id=data.get("entity_id"),
        text=data["text"].strip(),
        tags=json.dumps(data.get("tags", [])),
        is_quick_note=data.get("is_quick_note", False),
    )
    db.session.add(note)
    db.session.commit()
    return jsonify({"note": note.to_dict()}), 201


@notes_bp.route("/<int:note_id>", methods=["PATCH"])
@coach_required
def update_note(user, note_id):
    note = Note.query.filter_by(id=note_id, coach_id=user.id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404

    data = request.get_json()
    if "text" in data:
        note.text = data["text"].strip()
    if "tags" in data:
        note.tags = json.dumps(data["tags"])

    db.session.commit()
    return jsonify({"note": note.to_dict()})


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@coach_required
def delete_note(user, note_id):
    note = Note.query.filter_by(id=note_id, coach_id=user.id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404

    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note deleted"})
