from datetime import datetime
from app import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    sport = db.Column(db.String(50), nullable=False, index=True)

    post_type = db.Column(db.String(20), nullable=False, default="text")  # text, photo, exercise, training
    content = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)

    # Shared exercise data (JSON for standalone exercise)
    shared_exercise = db.Column(db.Text, nullable=True)  # JSON

    # Shared training session reference
    shared_training_data = db.Column(db.Text, nullable=True)  # JSON snapshot of training + blocks

    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    saves_count = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    author = db.relationship("User", backref="posts", lazy="joined")
    comments = db.relationship("Comment", backref="post", lazy="dynamic", cascade="all, delete-orphan")
    likes = db.relationship("PostLike", backref="post", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, current_user_id=None):
        import json
        data = {
            "id": self.id,
            "author_id": self.author_id,
            "author_name": f"{self.author.first_name} {self.author.last_name}" if self.author else None,
            "author_sport": self.author.sport if self.author else None,
            "author_avatar": self.author.avatar_url if self.author else None,
            "sport": self.sport,
            "post_type": self.post_type,
            "content": self.content,
            "image_url": self.image_url,
            "shared_exercise": json.loads(self.shared_exercise) if self.shared_exercise else None,
            "shared_training_data": json.loads(self.shared_training_data) if self.shared_training_data else None,
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "saves_count": self.saves_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if current_user_id:
            data["liked"] = PostLike.query.filter_by(post_id=self.id, user_id=current_user_id).first() is not None
            data["saved"] = SavedPost.query.filter_by(post_id=self.id, user_id=current_user_id).first() is not None
        return data


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "author_id": self.author_id,
            "author_name": f"{self.author.first_name} {self.author.last_name}" if self.author else None,
            "author_avatar": self.author.avatar_url if self.author else None,
            "text": self.text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PostLike(db.Model):
    __tablename__ = "post_likes"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("post_id", "user_id", name="uq_post_like"),)


class Follow(db.Model):
    __tablename__ = "follows"

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    following_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("follower_id", "following_id", name="uq_follow"),)


class SavedPost(db.Model):
    __tablename__ = "saved_posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "post_id", name="uq_saved_post"),)
    
    post = db.relationship("Post", lazy="joined")


class ChatRequest(db.Model):
    __tablename__ = "chat_requests"

    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.String(20), default="pending")  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    from_user = db.relationship("User", foreign_keys=[from_user_id], lazy="joined")
    to_user = db.relationship("User", foreign_keys=[to_user_id], lazy="joined")

    __table_args__ = (db.UniqueConstraint("from_user_id", "to_user_id", name="uq_chat_request"),)

    def to_dict(self):
        return {
            "id": self.id,
            "from_user_id": self.from_user_id,
            "from_user_name": f"{self.from_user.first_name} {self.from_user.last_name}" if self.from_user else None,
            "from_user_avatar": self.from_user.avatar_url if self.from_user else None,
            "from_user_sport": self.from_user.sport if self.from_user else None,
            "to_user_id": self.to_user_id,
            "to_user_name": f"{self.to_user.first_name} {self.to_user.last_name}" if self.to_user else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    text = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    sender = db.relationship("User", foreign_keys=[sender_id], lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "sender_name": f"{self.sender.first_name} {self.sender.last_name}" if self.sender else None,
            "text": self.text,
            "read": self.read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
