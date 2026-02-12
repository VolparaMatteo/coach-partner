from flask import Blueprint, request, jsonify
from app.models.team import Team
from app.models.athlete import Athlete
from app.models.training import TrainingSession
from app.models.match import Match
from app.models.note import Note
from app.models.ai_report import AIReport
from app.utils.auth import coach_required

search_bp = Blueprint("search", __name__)

RESULTS_PER_CATEGORY = 5


@search_bp.route("", methods=["GET"])
@coach_required
def search(user):
    """Search across multiple entities for the current coach."""
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Search query (q) is required"}), 400

    like_pattern = f"%{q}%"

    # Get IDs of teams owned by this coach (used to scope athletes, sessions, matches)
    coach_team_ids = [t.id for t in Team.query.filter_by(coach_id=user.id).all()]

    # -- Athletes --
    athletes = []
    if coach_team_ids:
        athletes = Athlete.query.filter(
            Athlete.team_id.in_(coach_team_ids),
            (Athlete.first_name.ilike(like_pattern) | Athlete.last_name.ilike(like_pattern))
        ).limit(RESULTS_PER_CATEGORY).all()

    # -- Training Sessions --
    sessions = []
    if coach_team_ids:
        sessions = TrainingSession.query.filter(
            TrainingSession.team_id.in_(coach_team_ids),
            TrainingSession.title.ilike(like_pattern)
        ).order_by(TrainingSession.date.desc())\
         .limit(RESULTS_PER_CATEGORY).all()

    # -- Matches --
    matches = []
    if coach_team_ids:
        matches = Match.query.filter(
            Match.team_id.in_(coach_team_ids),
            (Match.opponent.ilike(like_pattern) | Match.competition.ilike(like_pattern))
        ).order_by(Match.date.desc())\
         .limit(RESULTS_PER_CATEGORY).all()

    # -- Notes --
    notes = Note.query.filter(
        Note.coach_id == user.id,
        Note.text.ilike(like_pattern)
    ).order_by(Note.created_at.desc())\
     .limit(RESULTS_PER_CATEGORY).all()

    # -- AI Reports --
    reports = AIReport.query.filter(
        AIReport.coach_id == user.id,
        (AIReport.title.ilike(like_pattern) | AIReport.content.ilike(like_pattern))
    ).order_by(AIReport.created_at.desc())\
     .limit(RESULTS_PER_CATEGORY).all()

    return jsonify({
        "athletes": [a.to_dict() for a in athletes],
        "sessions": [s.to_dict() for s in sessions],
        "matches": [m.to_dict() for m in matches],
        "notes": [n.to_dict() for n in notes],
        "reports": [r.to_dict() for r in reports],
    })
