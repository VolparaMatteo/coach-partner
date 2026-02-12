from datetime import datetime
from app import db
import bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    # Coach-specific profile
    sport = db.Column(db.String(50), nullable=True)  # football, basketball, volleyball
    coaching_level = db.Column(db.String(50), nullable=True)  # youth, amateur, semi-pro, pro
    years_experience = db.Column(db.Integer, nullable=True)
    certifications = db.Column(db.Text, nullable=True)  # JSON list

    # Onboarding state
    onboarding_completed = db.Column(db.Boolean, default=False)
    onboarding_step = db.Column(db.Integer, default=0)

    # Philosophy & focus (set during onboarding)
    philosophy_focus = db.Column(db.Text, nullable=True)  # JSON: tactical, technical, physical, mental, prevention

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    teams = db.relationship("Team", backref="coach", lazy="dynamic")

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "sport": self.sport,
            "coaching_level": self.coaching_level,
            "years_experience": self.years_experience,
            "onboarding_completed": self.onboarding_completed,
            "onboarding_step": self.onboarding_step,
            "philosophy_focus": self.philosophy_focus,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
