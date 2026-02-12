from datetime import datetime
from app import db


class Injury(db.Model):
    __tablename__ = "injuries"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)

    injury_type = db.Column(db.String(100), nullable=False)  # muscular, ligament, bone, etc.
    body_part = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    date_occurred = db.Column(db.Date, nullable=False)
    date_return = db.Column(db.Date, nullable=True)

    status = db.Column(db.String(30), default="active")  # active, recovery, cleared
    severity = db.Column(db.String(20), nullable=True)  # mild, moderate, severe

    limitations = db.Column(db.Text, nullable=True)  # What the athlete can/can't do
    protocol = db.Column(db.Text, nullable=True)  # Recovery protocol notes

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "injury_type": self.injury_type,
            "body_part": self.body_part,
            "description": self.description,
            "date_occurred": self.date_occurred.isoformat() if self.date_occurred else None,
            "date_return": self.date_return.isoformat() if self.date_return else None,
            "status": self.status,
            "severity": self.severity,
            "limitations": self.limitations,
            "protocol": self.protocol,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
