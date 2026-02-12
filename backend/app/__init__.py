from flask import Flask
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

    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "Coach Partner"}

    return app
