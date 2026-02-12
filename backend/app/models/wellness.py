from datetime import datetime
from app import db


class WellnessEntry(db.Model):
    __tablename__ = "wellness_entries"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)

    # Wellness sliders (1-10)
    energy = db.Column(db.Integer, nullable=True)
    sleep_quality = db.Column(db.Integer, nullable=True)
    stress = db.Column(db.Integer, nullable=True)
    doms = db.Column(db.Integer, nullable=True)  # Delayed Onset Muscle Soreness
    pain = db.Column(db.Integer, nullable=True)

    # Mood
    mood = db.Column(db.String(30), nullable=True)  # great, good, neutral, low, bad

    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "date": self.date.isoformat() if self.date else None,
            "energy": self.energy,
            "sleep_quality": self.sleep_quality,
            "stress": self.stress,
            "doms": self.doms,
            "pain": self.pain,
            "mood": self.mood,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
