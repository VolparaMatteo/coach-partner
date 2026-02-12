from datetime import datetime
from app import db


class AIReport(db.Model):
    __tablename__ = "ai_reports"

    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    report_type = db.Column(db.String(50), nullable=False)  # post_training, post_match, athlete_weekly, focus_suggestion
    title = db.Column(db.String(300), nullable=True)

    # What data was used to generate
    input_refs = db.Column(db.Text, nullable=True)  # JSON: {training_ids: [], match_ids: [], athlete_ids: []}

    # AI output
    content = db.Column(db.Text, nullable=False)
    confidence = db.Column(db.String(20), nullable=True)  # high, medium, low

    # Coach feedback
    feedback = db.Column(db.String(20), nullable=True)  # useful, partially_useful, not_useful
    coach_edits = db.Column(db.Text, nullable=True)
    saved = db.Column(db.Boolean, default=False)

    # Audit
    prompt_used = db.Column(db.Text, nullable=True)
    model_used = db.Column(db.String(50), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "coach_id": self.coach_id,
            "report_type": self.report_type,
            "title": self.title,
            "input_refs": self.input_refs,
            "content": self.content,
            "confidence": self.confidence,
            "feedback": self.feedback,
            "saved": self.saved,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
