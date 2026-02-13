"""Private chat routes: requests and messages."""
from flask import Blueprint, request, jsonify
from sqlalchemy import or_, and_
from app import db
from app.models.community import ChatRequest, ChatMessage
from app.models.user import User
from app.utils.auth import coach_required

chat_bp = Blueprint("chat", __name__)


# ── Chat Requests ─────────────────────────────────────────────────────

@chat_bp.route("/requests", methods=["GET"])
@coach_required
def list_requests(user):
    """List pending chat requests (received)."""
    received = ChatRequest.query.filter_by(to_user_id=user.id, status="pending").order_by(ChatRequest.created_at.desc()).all()
    sent = ChatRequest.query.filter_by(from_user_id=user.id, status="pending").order_by(ChatRequest.created_at.desc()).all()
    return jsonify({
        "received": [r.to_dict() for r in received],
        "sent": [r.to_dict() for r in sent],
    })


@chat_bp.route("/requests", methods=["POST"])
@coach_required
def send_request(user):
    """Send a chat request to another coach."""
    data = request.get_json()
    to_user_id = data.get("to_user_id")

    if to_user_id == user.id:
        return jsonify({"error": "Cannot chat with yourself"}), 400

    target = User.query.get(to_user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    # Check if already exists (either direction)
    existing = ChatRequest.query.filter(
        or_(
            and_(ChatRequest.from_user_id == user.id, ChatRequest.to_user_id == to_user_id),
            and_(ChatRequest.from_user_id == to_user_id, ChatRequest.to_user_id == user.id),
        )
    ).first()

    if existing:
        if existing.status == "accepted":
            return jsonify({"error": "Chat already active", "chat_request": existing.to_dict()}), 400
        if existing.status == "pending":
            return jsonify({"error": "Request already pending", "chat_request": existing.to_dict()}), 400
        # If rejected, allow re-request
        if existing.status == "rejected":
            existing.status = "pending"
            existing.from_user_id = user.id
            existing.to_user_id = to_user_id
            db.session.commit()
            return jsonify({"chat_request": existing.to_dict()}), 201

    cr = ChatRequest(from_user_id=user.id, to_user_id=to_user_id, status="pending")
    db.session.add(cr)
    db.session.commit()
    return jsonify({"chat_request": cr.to_dict()}), 201


@chat_bp.route("/requests/<int:request_id>/accept", methods=["POST"])
@coach_required
def accept_request(user, request_id):
    """Accept a chat request."""
    cr = ChatRequest.query.get(request_id)
    if not cr or cr.to_user_id != user.id:
        return jsonify({"error": "Not found"}), 404
    if cr.status != "pending":
        return jsonify({"error": "Request already handled"}), 400

    cr.status = "accepted"
    db.session.commit()
    return jsonify({"chat_request": cr.to_dict()})


@chat_bp.route("/requests/<int:request_id>/reject", methods=["POST"])
@coach_required
def reject_request(user, request_id):
    """Reject a chat request."""
    cr = ChatRequest.query.get(request_id)
    if not cr or cr.to_user_id != user.id:
        return jsonify({"error": "Not found"}), 404

    cr.status = "rejected"
    db.session.commit()
    return jsonify({"chat_request": cr.to_dict()})


# ── Conversations ─────────────────────────────────────────────────────

@chat_bp.route("/conversations", methods=["GET"])
@coach_required
def list_conversations(user):
    """List all active chat conversations (accepted requests)."""
    accepted = ChatRequest.query.filter(
        ChatRequest.status == "accepted",
        or_(ChatRequest.from_user_id == user.id, ChatRequest.to_user_id == user.id),
    ).all()

    conversations = []
    for cr in accepted:
        other_id = cr.to_user_id if cr.from_user_id == user.id else cr.from_user_id
        other = User.query.get(other_id)
        if not other:
            continue

        # Last message
        last_msg = ChatMessage.query.filter(
            or_(
                and_(ChatMessage.sender_id == user.id, ChatMessage.receiver_id == other_id),
                and_(ChatMessage.sender_id == other_id, ChatMessage.receiver_id == user.id),
            )
        ).order_by(ChatMessage.created_at.desc()).first()

        # Unread count
        unread = ChatMessage.query.filter_by(
            sender_id=other_id, receiver_id=user.id, read=False
        ).count()

        conversations.append({
            "user_id": other.id,
            "name": f"{other.first_name} {other.last_name}",
            "avatar_url": other.avatar_url,
            "sport": other.sport,
            "last_message": last_msg.to_dict() if last_msg else None,
            "unread_count": unread,
        })

    # Sort by last message date
    conversations.sort(
        key=lambda c: c["last_message"]["created_at"] if c["last_message"] else "",
        reverse=True,
    )

    return jsonify({"conversations": conversations})


# ── Messages ──────────────────────────────────────────────────────────

@chat_bp.route("/messages/<int:other_id>", methods=["GET"])
@coach_required
def get_messages(user, other_id):
    """Get messages with another user."""
    # Verify chat is accepted
    accepted = ChatRequest.query.filter(
        ChatRequest.status == "accepted",
        or_(
            and_(ChatRequest.from_user_id == user.id, ChatRequest.to_user_id == other_id),
            and_(ChatRequest.from_user_id == other_id, ChatRequest.to_user_id == user.id),
        )
    ).first()

    if not accepted:
        return jsonify({"error": "Chat not authorized"}), 403

    page = request.args.get("page", 1, type=int)
    per_page = 50

    messages = ChatMessage.query.filter(
        or_(
            and_(ChatMessage.sender_id == user.id, ChatMessage.receiver_id == other_id),
            and_(ChatMessage.sender_id == other_id, ChatMessage.receiver_id == user.id),
        )
    ).order_by(ChatMessage.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Mark received messages as read
    ChatMessage.query.filter_by(
        sender_id=other_id, receiver_id=user.id, read=False
    ).update({"read": True})
    db.session.commit()

    return jsonify({"messages": [m.to_dict() for m in reversed(messages)]})


@chat_bp.route("/messages/<int:other_id>", methods=["POST"])
@coach_required
def send_message(user, other_id):
    """Send a message to another user."""
    # Verify chat is accepted
    accepted = ChatRequest.query.filter(
        ChatRequest.status == "accepted",
        or_(
            and_(ChatRequest.from_user_id == user.id, ChatRequest.to_user_id == other_id),
            and_(ChatRequest.from_user_id == other_id, ChatRequest.to_user_id == user.id),
        )
    ).first()

    if not accepted:
        return jsonify({"error": "Chat not authorized"}), 403

    data = request.get_json()
    msg = ChatMessage(
        sender_id=user.id,
        receiver_id=other_id,
        text=data["text"],
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": msg.to_dict()}), 201


@chat_bp.route("/unread-count", methods=["GET"])
@coach_required
def unread_count(user):
    """Total unread message count."""
    count = ChatMessage.query.filter_by(receiver_id=user.id, read=False).count()
    pending_requests = ChatRequest.query.filter_by(to_user_id=user.id, status="pending").count()
    return jsonify({"unread_messages": count, "pending_requests": pending_requests})
