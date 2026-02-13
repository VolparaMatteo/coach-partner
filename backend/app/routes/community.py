"""Community social routes: posts, comments, likes, follows, saved."""
import json
from flask import Blueprint, request, jsonify
from app import db
from app.models.community import Post, Comment, PostLike, Follow, SavedPost
from app.models.user import User
from app.utils.auth import coach_required

community_bp = Blueprint("community", __name__)


# ── Feed ──────────────────────────────────────────────────────────────

@community_bp.route("/feed", methods=["GET"])
@coach_required
def feed(user):
    """Feed: posts from followed coaches + own posts, filtered by sport."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    # Get followed user IDs
    following_ids = [f.following_id for f in Follow.query.filter_by(follower_id=user.id).all()]
    following_ids.append(user.id)

    posts = Post.query.filter(
        Post.author_id.in_(following_ids),
        Post.sport == user.sport,
    ).order_by(Post.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "posts": [p.to_dict(current_user_id=user.id) for p in posts],
        "page": page,
    })


@community_bp.route("/discover", methods=["GET"])
@coach_required
def discover(user):
    """Discover: popular posts from same sport, excluding already followed."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    posts = Post.query.filter(
        Post.sport == user.sport,
        Post.author_id != user.id,
    ).order_by(Post.likes_count.desc(), Post.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "posts": [p.to_dict(current_user_id=user.id) for p in posts],
        "page": page,
    })


# ── Posts CRUD ────────────────────────────────────────────────────────

@community_bp.route("/posts", methods=["POST"])
@coach_required
def create_post(user):
    """Create a new post."""
    data = request.get_json()
    post = Post(
        author_id=user.id,
        sport=user.sport or "football",
        post_type=data.get("post_type", "text"),
        content=data.get("content"),
        image_url=data.get("image_url"),
        shared_exercise=json.dumps(data["shared_exercise"]) if data.get("shared_exercise") else None,
        shared_training_data=json.dumps(data["shared_training_data"]) if data.get("shared_training_data") else None,
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({"post": post.to_dict(current_user_id=user.id)}), 201


@community_bp.route("/posts/<int:post_id>", methods=["DELETE"])
@coach_required
def delete_post(user, post_id):
    """Delete own post."""
    post = Post.query.get(post_id)
    if not post or post.author_id != user.id:
        return jsonify({"error": "Not found or not authorized"}), 404
    db.session.delete(post)
    db.session.commit()
    return jsonify({"deleted": True})


# ── Likes ─────────────────────────────────────────────────────────────

@community_bp.route("/posts/<int:post_id>/like", methods=["POST"])
@coach_required
def toggle_like(user, post_id):
    """Toggle like on a post."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    existing = PostLike.query.filter_by(post_id=post_id, user_id=user.id).first()
    if existing:
        db.session.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        like = PostLike(post_id=post_id, user_id=user.id)
        db.session.add(like)
        post.likes_count += 1
        liked = True

    db.session.commit()
    return jsonify({"liked": liked, "likes_count": post.likes_count})


# ── Comments ──────────────────────────────────────────────────────────

@community_bp.route("/posts/<int:post_id>/comments", methods=["GET"])
@coach_required
def get_comments(user, post_id):
    """Get comments for a post."""
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()
    return jsonify({"comments": [c.to_dict() for c in comments]})


@community_bp.route("/posts/<int:post_id>/comments", methods=["POST"])
@coach_required
def add_comment(user, post_id):
    """Add a comment to a post."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    data = request.get_json()
    comment = Comment(post_id=post_id, author_id=user.id, text=data["text"])
    db.session.add(comment)
    post.comments_count += 1
    db.session.commit()
    return jsonify({"comment": comment.to_dict()}), 201


@community_bp.route("/comments/<int:comment_id>", methods=["DELETE"])
@coach_required
def delete_comment(user, comment_id):
    """Delete own comment."""
    comment = Comment.query.get(comment_id)
    if not comment or comment.author_id != user.id:
        return jsonify({"error": "Not found"}), 404
    post = Post.query.get(comment.post_id)
    if post:
        post.comments_count = max(0, post.comments_count - 1)
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"deleted": True})


# ── Save/Bookmark ─────────────────────────────────────────────────────

@community_bp.route("/posts/<int:post_id>/save", methods=["POST"])
@coach_required
def toggle_save(user, post_id):
    """Toggle save/bookmark on a post."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    existing = SavedPost.query.filter_by(user_id=user.id, post_id=post_id).first()
    if existing:
        db.session.delete(existing)
        post.saves_count = max(0, post.saves_count - 1)
        saved = False
    else:
        sp = SavedPost(user_id=user.id, post_id=post_id)
        db.session.add(sp)
        post.saves_count += 1
        saved = True

    db.session.commit()
    return jsonify({"saved": saved, "saves_count": post.saves_count})


@community_bp.route("/saved", methods=["GET"])
@coach_required
def get_saved(user):
    """Get saved posts."""
    saved = SavedPost.query.filter_by(user_id=user.id).order_by(SavedPost.created_at.desc()).all()
    return jsonify({"posts": [s.post.to_dict(current_user_id=user.id) for s in saved if s.post]})


# ── Follow ────────────────────────────────────────────────────────────

@community_bp.route("/follow/<int:target_id>", methods=["POST"])
@coach_required
def toggle_follow(user, target_id):
    """Toggle follow/unfollow a coach."""
    if target_id == user.id:
        return jsonify({"error": "Cannot follow yourself"}), 400

    target = User.query.get(target_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    existing = Follow.query.filter_by(follower_id=user.id, following_id=target_id).first()
    if existing:
        db.session.delete(existing)
        following = False
    else:
        follow = Follow(follower_id=user.id, following_id=target_id)
        db.session.add(follow)
        following = True

    db.session.commit()
    return jsonify({"following": following})


# ── Profiles ──────────────────────────────────────────────────────────

@community_bp.route("/profile/<int:user_id>", methods=["GET"])
@coach_required
def get_profile(user, user_id):
    """Get public coach profile."""
    target = User.query.get(user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    followers_count = Follow.query.filter_by(following_id=user_id).count()
    following_count = Follow.query.filter_by(follower_id=user_id).count()
    posts_count = Post.query.filter_by(author_id=user_id).count()
    is_following = Follow.query.filter_by(follower_id=user.id, following_id=user_id).first() is not None

    posts = Post.query.filter_by(author_id=user_id).order_by(Post.created_at.desc()).limit(20).all()

    return jsonify({
        "profile": {
            "id": target.id,
            "name": f"{target.first_name} {target.last_name}",
            "avatar_url": target.avatar_url,
            "sport": target.sport,
            "coaching_level": target.coaching_level,
            "years_experience": target.years_experience,
            "followers_count": followers_count,
            "following_count": following_count,
            "posts_count": posts_count,
            "is_following": is_following,
            "is_self": user.id == user_id,
        },
        "posts": [p.to_dict(current_user_id=user.id) for p in posts],
    })


@community_bp.route("/coaches", methods=["GET"])
@coach_required
def search_coaches(user):
    """Search coaches by name, filtered by sport."""
    q = request.args.get("q", "")
    sport = request.args.get("sport", user.sport)

    query = User.query.filter(User.id != user.id, User.onboarding_completed == True)
    if sport:
        query = query.filter(User.sport == sport)
    if q:
        query = query.filter(
            db.or_(
                User.first_name.ilike(f"%{q}%"),
                User.last_name.ilike(f"%{q}%"),
            )
        )

    coaches = query.limit(30).all()

    results = []
    for c in coaches:
        is_following = Follow.query.filter_by(follower_id=user.id, following_id=c.id).first() is not None
        results.append({
            "id": c.id,
            "name": f"{c.first_name} {c.last_name}",
            "avatar_url": c.avatar_url,
            "sport": c.sport,
            "coaching_level": c.coaching_level,
            "is_following": is_following,
        })

    return jsonify({"coaches": results})


# ── Import shared content ────────────────────────────────────────────

@community_bp.route("/posts/<int:post_id>/import-training", methods=["POST"])
@coach_required
def import_training(user, post_id):
    """Import a shared training into the user's own team."""
    from app.models.training import TrainingSession, TrainingBlock
    from app.models.team import Team
    from datetime import date as dt_date

    post = Post.query.get(post_id)
    if not post or not post.shared_training_data:
        return jsonify({"error": "No training data to import"}), 404

    data = request.get_json()
    team_id = data.get("team_id")
    team = Team.query.filter_by(id=team_id, coach_id=user.id).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    training_data = json.loads(post.shared_training_data)

    session = TrainingSession(
        team_id=team_id,
        date=dt_date.today(),
        title=f"[Importato] {training_data.get('title', 'Allenamento')}",
        duration_minutes=training_data.get("duration_minutes"),
        objectives=training_data.get("objectives"),
        status="planned",
    )
    db.session.add(session)
    db.session.flush()

    for i, block_data in enumerate(training_data.get("blocks", [])):
        block = TrainingBlock(
            session_id=session.id,
            order=i,
            block_type=block_data.get("block_type", "technical"),
            name=block_data.get("name", ""),
            objective=block_data.get("objective"),
            duration_minutes=block_data.get("duration_minutes"),
            intensity=block_data.get("intensity"),
            description=block_data.get("description"),
            coaching_points=block_data.get("coaching_points"),
            variations=block_data.get("variations"),
            equipment=block_data.get("equipment"),
            space=block_data.get("space"),
            num_players=block_data.get("num_players"),
            video_url=block_data.get("video_url"),
        )
        db.session.add(block)

    db.session.commit()
    return jsonify({"session": session.to_dict(include_blocks=True)}), 201
