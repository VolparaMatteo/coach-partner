import os

from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.auth import auth_bp
    from app.routes.onboarding import onboarding_bp
    from app.routes.teams import teams_bp
    from app.routes.athletes import athletes_bp
    from app.routes.trainings import trainings_bp
    from app.routes.matches import matches_bp
    from app.routes.evaluations import evaluations_bp
    from app.routes.wellness import wellness_bp
    from app.routes.injuries import injuries_bp
    from app.routes.notes import notes_bp
    from app.routes.ai_reports import ai_reports_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.templates import templates_bp
    from app.routes.search import search_bp
    from app.routes.attendance import attendance_bp
    from app.routes.staff import staff_bp
    from app.routes.seasons import seasons_bp
    from app.routes.backup import backup_bp
    from app.routes.goals import goals_bp
    from app.routes.periodization import periodization_bp
    from app.routes.community import community_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(onboarding_bp, url_prefix="/api/onboarding")
    app.register_blueprint(teams_bp, url_prefix="/api/teams")
    app.register_blueprint(athletes_bp, url_prefix="/api/athletes")
    app.register_blueprint(trainings_bp, url_prefix="/api/trainings")
    app.register_blueprint(matches_bp, url_prefix="/api/matches")
    app.register_blueprint(evaluations_bp, url_prefix="/api/evaluations")
    app.register_blueprint(wellness_bp, url_prefix="/api/wellness")
    app.register_blueprint(injuries_bp, url_prefix="/api/injuries")
    app.register_blueprint(notes_bp, url_prefix="/api/notes")
    app.register_blueprint(ai_reports_bp, url_prefix="/api/ai")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(templates_bp, url_prefix="/api/templates")
    app.register_blueprint(search_bp, url_prefix="/api/search")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(seasons_bp, url_prefix="/api/seasons")
    app.register_blueprint(backup_bp, url_prefix="/api/backup")
    app.register_blueprint(goals_bp, url_prefix="/api/goals")
    app.register_blueprint(periodization_bp, url_prefix="/api/periodization")
    app.register_blueprint(community_bp, url_prefix="/api/community")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "Coach Partner"}

    @app.route("/api/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(
            os.path.join(app.root_path, "..", "uploads"), filename
        )

    return app
