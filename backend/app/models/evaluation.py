from datetime import datetime
from app import db


class Evaluation(db.Model):
    __tablename__ = "evaluations"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)

    # Context: linked to a session or match
    training_session_id = db.Column(db.Integer, db.ForeignKey("training_sessions.id"), nullable=True)
    match_id = db.Column(db.Integer, db.ForeignKey("matches.id"), nullable=True)

    date = db.Column(db.Date, nullable=False)

    # Ratings (1-10 scale)
    technical = db.Column(db.Integer, nullable=True)
    tactical = db.Column(db.Integer, nullable=True)
    physical = db.Column(db.Integer, nullable=True)
    mental = db.Column(db.Integer, nullable=True)
    discipline = db.Column(db.Integer, nullable=True)
    form = db.Column(db.Integer, nullable=True)

    # Overall
    overall = db.Column(db.Integer, nullable=True)

    # Notes
    comment = db.Column(db.Text, nullable=True)
    tags = db.Column(db.Text, nullable=True)  # JSON: ["decision making", "pressing", "serve receive"]

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "training_session_id": self.training_session_id,
            "match_id": self.match_id,
            "date": self.date.isoformat() if self.date else None,
            "technical": self.technical,
            "tactical": self.tactical,
            "physical": self.physical,
            "mental": self.mental,
            "discipline": self.discipline,
            "form": self.form,
            "overall": self.overall,
            "comment": self.comment,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
