from datetime import datetime

from flask import Blueprint, jsonify
from app.models.user import User
from app.models.season import Season
from app.models.team import Team
from app.models.athlete import Athlete
from app.models.training import TrainingSession
from app.models.match import Match
from app.models.evaluation import Evaluation
from app.models.wellness import WellnessEntry
from app.models.injury import Injury
from app.models.note import Note
from app.models.ai_report import AIReport
from app.utils.auth import coach_required

backup_bp = Blueprint("backup", __name__)


@backup_bp.route("/", methods=["GET"])
@coach_required
def export_all(user):
    """Export all coach data as JSON."""

    # Coach info (exclude sensitive fields)
    coach_data = user.to_dict()
    coach_data.pop("email", None)
    coach_data.pop("phone", None)

    # Seasons
    seasons = Season.query.filter_by(coach_id=user.id).all()

    # Teams with nested data
    teams = Team.query.filter_by(coach_id=user.id).all()
    teams_data = []
    for team in teams:
        team_dict = team.to_dict()

        # Athletes with evaluations, wellness, injuries
        athletes_data = []
        for athlete in team.athletes.all():
            athlete_dict = athlete.to_dict()
            athlete_dict["evaluations"] = [e.to_dict() for e in athlete.evaluations.all()]
            athlete_dict["wellness_entries"] = [w.to_dict() for w in athlete.wellness_entries.all()]
            athlete_dict["injuries"] = [i.to_dict() for i in athlete.injuries.all()]
            athletes_data.append(athlete_dict)

        # Training sessions with blocks
        sessions_data = []
        for session in team.training_sessions.all():
            session_dict = session.to_dict(include_blocks=True)
            sessions_data.append(session_dict)

        # Matches
        matches_data = [m.to_dict() for m in team.matches.all()]

        team_dict["athletes"] = athletes_data
        team_dict["training_sessions"] = sessions_data
        team_dict["matches"] = matches_data
        teams_data.append(team_dict)

    # Notes
    notes = Note.query.filter_by(coach_id=user.id).all()

    # AI Reports
    ai_reports = AIReport.query.filter_by(coach_id=user.id).all()

    return jsonify({
        "export_date": datetime.utcnow().isoformat(),
        "coach": coach_data,
        "seasons": [s.to_dict() for s in seasons],
        "teams": teams_data,
        "notes": [n.to_dict() for n in notes],
        "ai_reports": [r.to_dict() for r in ai_reports],
    })
