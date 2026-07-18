"""
Gamification engine — XP, levels, streaks, achievement evaluation
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import (
    User, Task, TaskStatus, FocusSession, SessionStatus,
    Achievement, UserAchievement, MoodEntry
)


# XP needed for level N = 100 * N^1.5 (rough curve)
def xp_for_level(level: int) -> int:
    return int(100 * (level ** 1.5))


def level_from_xp(xp: int) -> tuple[int, int]:
    """Return (current_level, xp_into_next_level)."""
    level = 1
    while xp >= xp_for_level(level + 1):
        level += 1
    xp_into_next = xp - xp_for_level(level)
    return level, xp_into_next


def add_xp(user: User, amount: int, db: Session) -> dict:
    """Add XP, recompute level, return summary."""
    user.xp = (user.xp or 0) + amount
    new_level, _ = level_from_xp(user.xp)
    leveled_up = new_level > (user.level or 1)
    user.level = new_level
    db.commit()
    return {"xp_awarded": amount, "new_total_xp": user.xp, "new_level": user.level, "leveled_up": leveled_up}


def update_streak(user: User, db: Session) -> dict:
    """Update streak based on today's activity."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    if user.last_active_date == today:
        # already counted today
        return {"streak": user.current_streak, "updated": False}

    if user.last_active_date == yesterday:
        user.current_streak = (user.current_streak or 0) + 1
    else:
        # streak broken
        user.current_streak = 1

    user.last_active_date = today
    if user.current_streak > (user.longest_streak or 0):
        user.longest_streak = user.current_streak
    db.commit()
    return {"streak": user.current_streak, "updated": True}


def evaluate_achievements(user: User, db: Session) -> list[dict]:
    """Check all achievements and award any newly earned ones."""
    # Compute stats
    tasks_completed = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id,
        Task.status == TaskStatus.COMPLETED
    ).scalar() or 0

    focus_minutes = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED
    ).scalar() or 0

    streak = user.current_streak or 0
    level = user.level or 1

    # Check early bird / night owl
    early_sessions = db.query(func.count(FocusSession.id)).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED,
        func.extract("hour", FocusSession.started_at) < 8
    ).scalar() or 0

    late_sessions = db.query(func.count(FocusSession.id)).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED,
        func.extract("hour", FocusSession.started_at) >= 22
    ).scalar() or 0

    stats_map = {
        "tasks_completed": tasks_completed,
        "focus_minutes": focus_minutes,
        "streak": streak,
        "level": level,
        "early_session": early_sessions,
        "late_session": late_sessions,
    }

    # Get all achievements
    all_achievements = db.query(Achievement).all()
    earned_codes = {
        ua.achievement.code for ua in
        db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }

    newly_earned = []
    for ach in all_achievements:
        if ach.code in earned_codes:
            continue
        crit = ach.criteria or {}
        crit_type = crit.get("type")
        threshold = crit.get("threshold", 0)
        actual = stats_map.get(crit_type, 0)
        if actual >= threshold:
            ua = UserAchievement(
                user_id=user.id,
                achievement_id=ach.id,
                earned_at=datetime.now(timezone.utc),
                progress=100,
            )
            db.add(ua)
            user.xp = (user.xp or 0) + ach.xp_reward
            newly_earned.append({
                "code": ach.code,
                "title": ach.title,
                "description": ach.description,
                "xp_reward": ach.xp_reward,
                "icon_emoji": ach.icon_emoji,
                "flair": ach.flair,
            })
    if newly_earned:
        # Recompute level
        new_level, _ = level_from_xp(user.xp)
        user.level = new_level
    db.commit()
    return newly_earned
