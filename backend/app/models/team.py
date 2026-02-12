from datetime import datetime
from app import db


class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    sport = db.Column(db.String(50), nullable=False)  # football, basketball, volleyball

    # Team details
    category = db.Column(db.String(50), nullable=True)  # U12, U14, U16, U18, Senior
    level = db.Column(db.String(50), nullable=True)  # amateur, elite
    gender = db.Column(db.String(20), nullable=True)  # male, female, mixed
    num_athletes = db.Column(db.Integer, nullable=True)

    # Schedule
    training_days = db.Column(db.Text, nullable=True)  # JSON: ["monday", "wednesday", "friday"]
    match_day = db.Column(db.String(20), nullable=True)

    # Season
    season = db.Column(db.String(20), nullable=True)  # "2025-2026"

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    athletes = db.relationship("Athlete", backref="team", lazy="dynamic", cascade="all, delete-orphan")
    training_sessions = db.relationship("TrainingSession", backref="team", lazy="dynamic", cascade="all, delete-orphan")
    matches = db.relationship("Match", backref="team", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "coach_id": self.coach_id,
            "name": self.name,
            "sport": self.sport,
            "category": self.category,
            "level": self.level,
            "gender": self.gender,
            "num_athletes": self.num_athletes,
            "training_days": self.training_days,
            "match_day": self.match_day,
            "season": self.season,
            "athletes_count": self.athletes.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
