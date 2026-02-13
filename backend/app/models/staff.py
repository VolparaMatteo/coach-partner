from datetime import datetime
from app import db


class StaffMember(db.Model):
    __tablename__ = "staff_members"

    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    email = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100))
    role = db.Column(db.String(50), nullable=False, default="viewer")
    status = db.Column(db.String(20), default="pending")
    invite_token = db.Column(db.String(100), unique=True)
    team_ids = db.Column(db.Text)  # JSON array of team IDs they can access, null = all

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "coach_id": self.coach_id,
            "user_id": self.user_id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "status": self.status,
            "team_ids": json.loads(self.team_ids) if self.team_ids else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
