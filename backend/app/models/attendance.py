from datetime import datetime
from app import db


class Attendance(db.Model):
    __tablename__ = "attendances"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    training_session_id = db.Column(db.Integer, db.ForeignKey("training_sessions.id"), nullable=False, index=True)

    status = db.Column(db.String(20), default="present")  # present, absent, injured, excused
    rpe = db.Column(db.Float, nullable=True)  # Individual RPE for this session
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "training_session_id": self.training_session_id,
            "status": self.status,
            "rpe": self.rpe,
            "notes": self.notes,
        }
