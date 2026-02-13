from datetime import datetime
from app import db


class PeriodizationCycle(db.Model):
    __tablename__ = "periodization_cycles"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("periodization_cycles.id"), nullable=True)

    name = db.Column(db.String(200), nullable=False)
    cycle_type = db.Column(db.String(20), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    objectives = db.Column(db.Text, nullable=True)
    planned_load = db.Column(db.String(20), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(7), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    children = db.relationship("PeriodizationCycle", backref=db.backref("parent", remote_side=[id]), lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "cycle_type": self.cycle_type,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "objectives": self.objectives,
            "planned_load": self.planned_load,
            "notes": self.notes,
            "color": self.color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
