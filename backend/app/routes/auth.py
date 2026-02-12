import hashlib
import secrets
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity,
)
from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new coach (individual registration, free)."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    required = ["email", "password", "first_name", "last_name"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Field '{field}' is required"}), 400

    if User.query.filter_by(email=data["email"].lower().strip()).first():
        return jsonify({"error": "Email already registered"}), 409

    if len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    user = User(
        email=data["email"].lower().strip(),
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        phone=data.get("phone", "").strip() or None,
        onboarding_completed=False,
        onboarding_step=0,
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        "message": "Registration successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    })


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    updatable = ["first_name", "last_name", "phone", "avatar_url",
                 "coaching_level", "years_experience", "certifications"]
    for field in updatable:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    if not data or not data.get("email"):
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user:
        # Don't reveal whether the email exists
        return jsonify({"message": "If the email is registered, a reset link has been sent"}), 200

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    user.reset_token = token_hash
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=30)
    db.session.commit()

    # In production, send the token via email instead of returning it
    return jsonify({
        "message": "If the email is registered, a reset link has been sent",
        "reset_token": token,
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    if not data or not data.get("token") or not data.get("new_password"):
        return jsonify({"error": "Token and new_password are required"}), 400

    if len(data["new_password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    token_hash = hashlib.sha256(data["token"].encode("utf-8")).hexdigest()
    user = User.query.filter_by(reset_token=token_hash).first()

    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        return jsonify({"error": "Invalid or expired token"}), 400

    user.set_password(data["new_password"])
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify({"message": "Password aggiornata"}), 200
