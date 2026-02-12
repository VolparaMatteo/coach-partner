from datetime import datetime
from app import db


class Athlete(db.Model):
    __tablename__ = "athletes"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False, index=True)

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date, nullable=True)
    photo_url = db.Column(db.String(500), nullable=True)
    jersey_number = db.Column(db.Integer, nullable=True)

    # Sport-specific role/position (stored as string, values depend on sport)
    position = db.Column(db.String(50), nullable=True)
    secondary_position = db.Column(db.String(50), nullable=True)

    # Physical attributes
    dominant_foot = db.Column(db.String(10), nullable=True)  # left, right, both (football)
    dominant_hand = db.Column(db.String(10), nullable=True)  # left, right, both (basketball/volleyball)
    height_cm = db.Column(db.Integer, nullable=True)
    weight_kg = db.Column(db.Float, nullable=True)

    # Status
    status = db.Column(db.String(30), default="available")  # available, attention, unavailable
    notes = db.Column(db.Text, nullable=True)

    # Objectives
    objectives = db.Column(db.Text, nullable=True)  # JSON: {technical: "", tactical: "", physical: "", mental: ""}

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    evaluations = db.relationship("Evaluation", backref="athlete", lazy="dynamic", cascade="all, delete-orphan")
    wellness_entries = db.relationship("WellnessEntry", backref="athlete", lazy="dynamic", cascade="all, delete-orphan")
    injuries = db.relationship("Injury", backref="athlete", lazy="dynamic", cascade="all, delete-orphan")
    attendances = db.relationship("Attendance", backref="athlete", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": f"{self.first_name} {self.last_name}",
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "photo_url": self.photo_url,
            "jersey_number": self.jersey_number,
            "position": self.position,
            "secondary_position": self.secondary_position,
            "dominant_foot": self.dominant_foot,
            "dominant_hand": self.dominant_hand,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "status": self.status,
            "notes": self.notes,
            "objectives": self.objectives,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
