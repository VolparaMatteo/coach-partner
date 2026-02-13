import json
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app import db
from app.models.staff import StaffMember
from app.models.user import User
from app.utils.auth import coach_required

staff_bp = Blueprint("staff", __name__)


@staff_bp.route("", methods=["GET"])
@coach_required
def list_staff(user):
    members = StaffMember.query.filter_by(coach_id=user.id).all()
    return jsonify({"staff": [m.to_dict() for m in members]})


@staff_bp.route("", methods=["POST"])
@coach_required
def invite_staff(user):
    data = request.get_json()
    if not data.get("email"):
        return jsonify({"error": "Email is required"}), 400

    role = data.get("role", "viewer")
    if role not in ("viewer", "editor", "admin"):
        return jsonify({"error": "Invalid role"}), 400

    # Check if already invited
    existing = StaffMember.query.filter_by(
        coach_id=user.id, email=data["email"].strip().lower()
    ).first()
    if existing:
        return jsonify({"error": "Staff member already invited"}), 409

    team_ids = data.get("team_ids")
    member = StaffMember(
        coach_id=user.id,
        email=data["email"].strip().lower(),
        name=data.get("name"),
        role=role,
        status="pending",
        invite_token=str(uuid.uuid4()),
        team_ids=json.dumps(team_ids) if team_ids is not None else None,
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({"staff": member.to_dict()}), 201


@staff_bp.route("/<int:staff_id>", methods=["PUT"])
@coach_required
def update_staff(user, staff_id):
    member = StaffMember.query.filter_by(id=staff_id, coach_id=user.id).first()
    if not member:
        return jsonify({"error": "Staff member not found"}), 404

    data = request.get_json()
    if "role" in data:
        if data["role"] not in ("viewer", "editor", "admin"):
            return jsonify({"error": "Invalid role"}), 400
        member.role = data["role"]
    if "team_ids" in data:
        member.team_ids = json.dumps(data["team_ids"]) if data["team_ids"] is not None else None

    db.session.commit()
    return jsonify({"staff": member.to_dict()})


@staff_bp.route("/<int:staff_id>", methods=["DELETE"])
@coach_required
def delete_staff(user, staff_id):
    member = StaffMember.query.filter_by(id=staff_id, coach_id=user.id).first()
    if not member:
        return jsonify({"error": "Staff member not found"}), 404

    member.status = "revoked"
    db.session.commit()
    return jsonify({"message": "Staff member revoked"})


@staff_bp.route("/accept-invite", methods=["POST"])
@jwt_required()
def accept_invite():
    data = request.get_json()
    token = data.get("invite_token")
    if not token:
        return jsonify({"error": "Invite token is required"}), 400

    member = StaffMember.query.filter_by(invite_token=token, status="pending").first()
    if not member:
        return jsonify({"error": "Invalid or expired invite"}), 404

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    member.user_id = user.id
    member.status = "active"
    db.session.commit()
    return jsonify({"staff": member.to_dict()})
