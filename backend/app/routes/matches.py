import json
from flask import Blueprint, request, jsonify
from app import db
from app.models.match import Match
from app.models.team import Team
from app.utils.auth import coach_required

matches_bp = Blueprint("matches", __name__)


@matches_bp.route("", methods=["GET"])
@coach_required
def list_matches(user):
    team_id = request.args.get("team_id", type=int)
    if not team_id:
        return jsonify({"error": "team_id is required"}), 400

    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    matches = Match.query.filter_by(team_id=team.id)\
        .order_by(Match.date.desc()).all()
    return jsonify({"matches": [m.to_dict() for m in matches]})


@matches_bp.route("/<int:match_id>", methods=["GET"])
@coach_required
def get_match(user, match_id):
    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    team = Team.query.filter_by(id=match.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    return jsonify({"match": match.to_dict()})


@matches_bp.route("", methods=["POST"])
@coach_required
def create_match(user):
    data = request.get_json()
    team_id = data.get("team_id")
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    if not data.get("date") or not data.get("opponent"):
        return jsonify({"error": "date and opponent are required"}), 400

    match = Match(
        team_id=team.id,
        date=data["date"],
        time=data.get("time"),
        competition=data.get("competition"),
        opponent=data["opponent"].strip(),
        venue=data.get("venue"),
        home_away=data.get("home_away", "home"),
        called_up=json.dumps(data.get("called_up", [])),
        game_plan=json.dumps(data.get("game_plan", {})),
        opponent_analysis=json.dumps(data.get("opponent_analysis", {})),
        special_situations=json.dumps(data.get("special_situations", {})),
    )
    db.session.add(match)
    db.session.commit()
    return jsonify({"match": match.to_dict()}), 201


@matches_bp.route("/<int:match_id>", methods=["PATCH"])
@coach_required
def update_match(user, match_id):
    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    team = Team.query.filter_by(id=match.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    simple_fields = ["date", "time", "competition", "opponent", "venue",
                     "home_away", "status", "score_home", "score_away", "result",
                     "what_worked", "what_didnt_work", "key_moments"]
    for field in simple_fields:
        if field in data:
            setattr(match, field, data[field])

    json_fields = ["called_up", "game_plan", "opponent_analysis",
                   "special_situations", "training_priorities", "minutes_played",
                   "pre_match_checklist"]
    for field in json_fields:
        if field in data:
            setattr(match, field, json.dumps(data[field]))

    db.session.commit()
    return jsonify({"match": match.to_dict()})


@matches_bp.route("/<int:match_id>", methods=["DELETE"])
@coach_required
def delete_match(user, match_id):
    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    team = Team.query.filter_by(id=match.team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Not authorized"}), 403

    db.session.delete(match)
    db.session.commit()
    return jsonify({"message": "Match deleted"})
