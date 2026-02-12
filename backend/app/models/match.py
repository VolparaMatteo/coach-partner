from datetime import datetime
from app import db


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False, index=True)

    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=True)
    competition = db.Column(db.String(200), nullable=True)
    opponent = db.Column(db.String(200), nullable=False)
    venue = db.Column(db.String(200), nullable=True)
    home_away = db.Column(db.String(10), default="home")  # home, away, neutral

    status = db.Column(db.String(30), default="upcoming")  # upcoming, in_progress, completed

    # Roster
    called_up = db.Column(db.Text, nullable=True)  # JSON list of athlete IDs

    # Game plan (pre-match)
    game_plan = db.Column(db.Text, nullable=True)  # JSON: {attack_principles, defense_principles, individual_focus}
    opponent_analysis = db.Column(db.Text, nullable=True)  # JSON: {strengths, weaknesses, key_players, notes}
    special_situations = db.Column(db.Text, nullable=True)  # JSON: rotations, set plays, etc.
    pre_match_checklist = db.Column(db.Text, nullable=True)  # JSON list of tasks

    # Result (post-match)
    score_home = db.Column(db.Integer, nullable=True)
    score_away = db.Column(db.Integer, nullable=True)
    result = db.Column(db.String(10), nullable=True)  # win, loss, draw

    # Post-match notes
    what_worked = db.Column(db.Text, nullable=True)
    what_didnt_work = db.Column(db.Text, nullable=True)
    key_moments = db.Column(db.Text, nullable=True)
    training_priorities = db.Column(db.Text, nullable=True)  # JSON: top 3 priorities for next training

    # Minutes tracking
    minutes_played = db.Column(db.Text, nullable=True)  # JSON: {athlete_id: minutes}

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "date": self.date.isoformat() if self.date else None,
            "time": self.time.isoformat() if self.time else None,
            "competition": self.competition,
            "opponent": self.opponent,
            "venue": self.venue,
            "home_away": self.home_away,
            "status": self.status,
            "called_up": self.called_up,
            "game_plan": self.game_plan,
            "opponent_analysis": self.opponent_analysis,
            "special_situations": self.special_situations,
            "score_home": self.score_home,
            "score_away": self.score_away,
            "result": self.result,
            "what_worked": self.what_worked,
            "what_didnt_work": self.what_didnt_work,
            "key_moments": self.key_moments,
            "training_priorities": self.training_priorities,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
