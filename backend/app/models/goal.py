from app import db
from datetime import datetime


class Goal(db.Model):
    __tablename__ = 'goals'

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # technical, tactical, physical, mental, other
    deadline = db.Column(db.Date)
    progress = db.Column(db.Integer, default=0)  # 0-100
    status = db.Column(db.String(20), default='active')  # active, completed, abandoned
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'athlete_id': self.athlete_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'progress': self.progress,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
