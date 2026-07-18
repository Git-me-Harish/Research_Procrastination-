"""
Database setup & session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config import settings
from models import Base

# SQLite with check_same_thread=False for FastAPI
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables and seed default data."""
    Base.metadata.create_all(bind=engine)
    seed_achievements()


def seed_achievements() -> None:
    """Seed default comic-style achievements."""
    from models import Achievement
    db = SessionLocal()
    try:
        if db.query(Achievement).count() > 0:
            return

        achievements = [
            Achievement(
                code="first_bam",
                title="First BAM!",
                description="Complete your very first task. The journey of a thousand miles starts with one POW!",
                flair="pow",
                xp_reward=50,
                criteria={"type": "tasks_completed", "threshold": 1},
                icon_emoji="💥",
            ),
            Achievement(
                code="streak_3",
                title="Triple Threat",
                description="Maintain a 3-day streak. You're building momentum!",
                flair="zap",
                xp_reward=100,
                criteria={"type": "streak", "threshold": 3},
                icon_emoji="⚡",
            ),
            Achievement(
                code="streak_7",
                title="Week Warrior",
                description="7 days of consistency! That's a real habit forming.",
                flair="boom",
                xp_reward=250,
                criteria={"type": "streak", "threshold": 7},
                icon_emoji="🔥",
            ),
            Achievement(
                code="streak_30",
                title="Unstoppable Force",
                description="30 days. You're not the same person who started.",
                flair="wham",
                xp_reward=1000,
                criteria={"type": "streak", "threshold": 30},
                icon_emoji="🏆",
            ),
            Achievement(
                code="focus_500",
                title="Focus Apprentice",
                description="Accumulate 500 minutes of focused work.",
                flair="zap",
                xp_reward=200,
                criteria={"type": "focus_minutes", "threshold": 500},
                icon_emoji="🎯",
            ),
            Achievement(
                code="focus_2000",
                title="Focus Master",
                description="2000 minutes of pure focus. Your brain is shredded.",
                flair="boom",
                xp_reward=500,
                criteria={"type": "focus_minutes", "threshold": 2000},
                icon_emoji="🧠",
            ),
            Achievement(
                code="task_25",
                title="Task Demolisher",
                description="Demolish 25 tasks. KA-POW!",
                flair="pow",
                xp_reward=300,
                criteria={"type": "tasks_completed", "threshold": 25},
                icon_emoji="🔨",
            ),
            Achievement(
                code="task_100",
                title="Centurion of Done",
                description="100 tasks completed. You're an absolute machine.",
                flair="wham",
                xp_reward=1000,
                criteria={"type": "tasks_completed", "threshold": 100},
                icon_emoji="💯",
            ),
            Achievement(
                code="early_bird",
                title="Early Bird POWer",
                description="Complete a focus session before 8 AM.",
                flair="zap",
                xp_reward=150,
                criteria={"type": "early_session", "threshold": 1},
                icon_emoji="🌅",
            ),
            Achievement(
                code="night_owl",
                title="Night Owl Hoot",
                description="Complete a focus session after 10 PM.",
                flair="boom",
                xp_reward=150,
                criteria={"type": "late_session", "threshold": 1},
                icon_emoji="🦉",
            ),
            Achievement(
                code="level_5",
                title="Level 5 Hero",
                description="Reach level 5. The adventure is just beginning.",
                flair="pow",
                xp_reward=100,
                criteria={"type": "level", "threshold": 5},
                icon_emoji="⭐",
            ),
            Achievement(
                code="level_10",
                title="Level 10 Legend",
                description="Reach level 10. You're becoming unstoppable.",
                flair="wham",
                xp_reward=300,
                criteria={"type": "level", "threshold": 10},
                icon_emoji="🌟",
            ),
        ]
        db.add_all(achievements)
        db.commit()
        print(f"✅ Seeded {len(achievements)} achievements")
    finally:
        db.close()


def get_db():
    """FastAPI dependency to get DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
