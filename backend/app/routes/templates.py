import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from app import db
from app.models.training import TrainingSession, TrainingBlock
from app.models.team import Team
from app.utils.auth import coach_required

templates_bp = Blueprint("templates", __name__)


# ---------------------------------------------------------------------------
# Template Model (defined here to keep templates self-contained)
# ---------------------------------------------------------------------------

class SessionTemplate(db.Model):
    __tablename__ = "session_templates"

    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    sport = db.Column(db.String(50), nullable=True)

    blocks_json = db.Column(db.Text, nullable=True)  # JSON-serialised list of block dicts
    duration_minutes = db.Column(db.Integer, nullable=True)
    objectives = db.Column(db.Text, nullable=True)  # JSON-serialised list

    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "coach_id": self.coach_id,
            "name": self.name,
            "description": self.description,
            "sport": self.sport,
            "blocks_json": self.blocks_json,
            "duration_minutes": self.duration_minutes,
            "objectives": self.objectives,
            "usage_count": self.usage_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@templates_bp.route("", methods=["GET"])
@coach_required
def list_templates(user):
    """List all templates for the current coach, ordered by usage then recency."""
    templates = SessionTemplate.query.filter_by(coach_id=user.id)\
        .order_by(SessionTemplate.usage_count.desc(), SessionTemplate.created_at.desc())\
        .all()
    return jsonify({"templates": [t.to_dict() for t in templates]})


@templates_bp.route("", methods=["POST"])
@coach_required
def create_template(user):
    """Create a template from an existing training session."""
    data = request.get_json()

    session_id = data.get("session_id")
    name = data.get("name")
    if not session_id or not name:
        return jsonify({"error": "session_id and name are required"}), 400

    # Verify the session belongs to a team owned by this coach
    session = TrainingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    team = Team.query.filter_by(id=session.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    # Serialize the session's blocks into a JSON list
    blocks = [b.to_dict() for b in session.blocks.all()]
    # Remove runtime-only fields from each block snapshot
    for block in blocks:
        block.pop("id", None)
        block.pop("session_id", None)
        block.pop("completed", None)
        block.pop("actual_rpe", None)
        block.pop("notes", None)

    template = SessionTemplate(
        coach_id=user.id,
        name=name.strip(),
        description=data.get("description"),
        sport=team.sport,
        blocks_json=json.dumps(blocks),
        duration_minutes=session.duration_minutes,
        objectives=session.objectives,
    )
    db.session.add(template)
    db.session.commit()

    return jsonify({"template": template.to_dict()}), 201


@templates_bp.route("/<int:template_id>/use", methods=["POST"])
@coach_required
def use_template(user, template_id):
    """Create a new training session from a template."""
    template = SessionTemplate.query.filter_by(id=template_id, coach_id=user.id).first()
    if not template:
        return jsonify({"error": "Template not found"}), 404

    data = request.get_json()
    team_id = data.get("team_id")
    date = data.get("date")
    if not team_id or not date:
        return jsonify({"error": "team_id and date are required"}), 400

    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    # Create the training session
    session = TrainingSession(
        team_id=team.id,
        date=date,
        duration_minutes=template.duration_minutes,
        title=template.name,
        objectives=template.objectives,
        template_name=template.name,
    )
    db.session.add(session)
    db.session.flush()  # get session.id for blocks

    # Recreate blocks from the template snapshot
    blocks_data = json.loads(template.blocks_json) if template.blocks_json else []
    for i, block_data in enumerate(blocks_data):
        block = TrainingBlock(
            session_id=session.id,
            order=block_data.get("order", i),
            block_type=block_data.get("block_type", "technical"),
            name=block_data.get("name", f"Block {i + 1}"),
            objective=block_data.get("objective"),
            duration_minutes=block_data.get("duration_minutes"),
            intensity=block_data.get("intensity"),
            description=block_data.get("description"),
            coaching_points=block_data.get("coaching_points"),
            variations=block_data.get("variations"),
            equipment=block_data.get("equipment"),
            space=block_data.get("space"),
            num_players=block_data.get("num_players"),
            rules=block_data.get("rules"),
            tags=block_data.get("tags") if isinstance(block_data.get("tags"), str)
                 else json.dumps(block_data.get("tags", [])),
        )
        db.session.add(block)

    # Increment usage counter
    template.usage_count = (template.usage_count or 0) + 1

    db.session.commit()
    return jsonify({"session": session.to_dict(include_blocks=True)}), 201


@templates_bp.route("/<int:template_id>", methods=["DELETE"])
@coach_required
def delete_template(user, template_id):
    """Delete a template owned by the current coach."""
    template = SessionTemplate.query.filter_by(id=template_id, coach_id=user.id).first()
    if not template:
        return jsonify({"error": "Template not found"}), 404

    db.session.delete(template)
    db.session.commit()
    return jsonify({"message": "Template deleted"})
