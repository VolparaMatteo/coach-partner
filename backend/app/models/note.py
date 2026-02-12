from datetime import datetime
from app import db


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    # Polymorphic reference: can be attached to athlete, session, match, or standalone
    entity_type = db.Column(db.String(50), nullable=True)  # athlete, training, match, general
    entity_id = db.Column(db.Integer, nullable=True)

    text = db.Column(db.Text, nullable=False)
    tags = db.Column(db.Text, nullable=True)  # JSON list: ["pressing", "set piece", "attitude"]

    # Quick note flag (taken during field mode)
    is_quick_note = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "coach_id": self.coach_id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "text": self.text,
            "tags": self.tags,
            "is_quick_note": self.is_quick_note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
