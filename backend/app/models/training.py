from datetime import datetime
from app import db


class TrainingSession(db.Model):
    __tablename__ = "training_sessions"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False, index=True)

    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)

    title = db.Column(db.String(200), nullable=True)
    objectives = db.Column(db.Text, nullable=True)  # JSON list of objectives
    status = db.Column(db.String(30), default="planned")  # planned, in_progress, completed

    # Post-session
    rpe_avg = db.Column(db.Float, nullable=True)  # Average RPE
    session_rating = db.Column(db.Integer, nullable=True)  # 1-5
    what_worked = db.Column(db.Text, nullable=True)
    what_to_improve = db.Column(db.Text, nullable=True)

    # Template reference
    template_name = db.Column(db.String(100), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    blocks = db.relationship("TrainingBlock", backref="session", lazy="dynamic",
                             cascade="all, delete-orphan", order_by="TrainingBlock.order")
    attendances = db.relationship("Attendance", backref="session", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_blocks=False):
        data = {
            "id": self.id,
            "team_id": self.team_id,
            "date": self.date.isoformat() if self.date else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_minutes": self.duration_minutes,
            "title": self.title,
            "objectives": self.objectives,
            "status": self.status,
            "rpe_avg": self.rpe_avg,
            "session_rating": self.session_rating,
            "what_worked": self.what_worked,
            "what_to_improve": self.what_to_improve,
            "template_name": self.template_name,
            "blocks_count": self.blocks.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_blocks:
            data["blocks"] = [b.to_dict() for b in self.blocks.all()]
        return data


class TrainingBlock(db.Model):
    __tablename__ = "training_blocks"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("training_sessions.id"), nullable=False, index=True)

    order = db.Column(db.Integer, default=0)
    block_type = db.Column(db.String(50), nullable=False)  # warmup, technical, tactical, physical, game, cooldown
    name = db.Column(db.String(200), nullable=False)
    objective = db.Column(db.Text, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    intensity = db.Column(db.String(20), nullable=True)  # low, medium, high, very_high

    # Content
    description = db.Column(db.Text, nullable=True)
    coaching_points = db.Column(db.Text, nullable=True)
    variations = db.Column(db.Text, nullable=True)

    # Constraints
    equipment = db.Column(db.Text, nullable=True)
    space = db.Column(db.String(100), nullable=True)
    num_players = db.Column(db.String(50), nullable=True)
    rules = db.Column(db.Text, nullable=True)

    # Tags
    tags = db.Column(db.Text, nullable=True)  # JSON list

    # Post-execution
    completed = db.Column(db.Boolean, default=False)
    actual_rpe = db.Column(db.Float, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "order": self.order,
            "block_type": self.block_type,
            "name": self.name,
            "objective": self.objective,
            "duration_minutes": self.duration_minutes,
            "intensity": self.intensity,
            "description": self.description,
            "coaching_points": self.coaching_points,
            "variations": self.variations,
            "equipment": self.equipment,
            "space": self.space,
            "num_players": self.num_players,
            "rules": self.rules,
            "tags": self.tags,
            "completed": self.completed,
            "actual_rpe": self.actual_rpe,
            "notes": self.notes,
        }
