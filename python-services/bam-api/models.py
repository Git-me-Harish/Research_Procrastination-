"""
BAM! Database Models — SQLAlchemy ORM
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Float,
    ForeignKey, JSON, Enum as SQLEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, declarative_base
import enum


Base = declarative_base()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


#  User 
class ProcrastinationType(str, enum.Enum):
    PERFECTIONIST = "perfectionist"
    DREAMER = "dreamer"
    WORRIER = "worrier"
    CRISIS_MAKER = "crisis_maker"
    DEFIER = "defier"
    OVERDOER = "overdoer"
    UNKNOWN = "unknown"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(80), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(120), nullable=True)

    # Procrastination profile
    procrastination_type = Column(SQLEnum(ProcrastinationType), default=ProcrastinationType.UNKNOWN)
    onboarding_answers = Column(JSON, default=list)  # raw quiz answers
    onboarding_completed_at = Column(DateTime, nullable=True)

    # Gamification
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(String(10), nullable=True)  # YYYY-MM-DD

    # Personalization (updated by AI)
    personalized_plan = Column(JSON, default=dict)
    plan_updated_at = Column(DateTime, nullable=True)

    # Preferences
    sound_enabled = Column(Boolean, default=True)
    theme = Column(String(40), default="classic-comic")

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    mood_entries = relationship("MoodEntry", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    ai_interactions = relationship("AIInteraction", back_populates="user", cascade="all, delete-orphan")
    power_chains = relationship("PowerChain", back_populates="user", cascade="all, delete-orphan")
    streak_shields = relationship("StreakShield", back_populates="user", cascade="all, delete-orphan")
    breathe_sessions = relationship("BreatheSession", back_populates="user", cascade="all, delete-orphan")
    kpi_snapshots = relationship("KPISnapshot", back_populates="user", cascade="all, delete-orphan")


#  Task 
class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM)
    category = Column(String(60), default="general")  # study, work, personal, health, etc.

    # AI-generated breakdown (sub-steps stored as JSON list)
    breakdown = Column(JSON, default=list)
    estimated_minutes = Column(Integer, default=25)
    actual_minutes = Column(Integer, default=0)

    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Energy required (1-5)
    energy_required = Column(Integer, default=2)
    # Difficulty (1-5)
    difficulty = Column(Integer, default=2)

    # Comic flair
    action_word = Column(String(20), default="POW!")

    user = relationship("User", back_populates="tasks")
    focus_sessions = relationship("FocusSession", back_populates="task")


#  Focus Session 
class SessionType(str, enum.Enum):
    POMODORO = "pomodoro"
    SHORT_BREAK = "short_break"
    LONG_BREAK = "long_break"
    DEEP_WORK = "deep_work"


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    PAUSED = "paused"


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)

    session_type = Column(SQLEnum(SessionType), default=SessionType.POMODORO)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE)

    planned_minutes = Column(Integer, default=25)
    actual_minutes = Column(Integer, default=0)

    started_at = Column(DateTime, default=utc_now)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Distraction count (user clicked "distracted" button)
    distractions = Column(Integer, default=0)
    # User-reported focus quality (1-5)
    focus_quality = Column(Integer, default=3)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="focus_sessions")
    task = relationship("Task", back_populates="focus_sessions")


#  Mood 
class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Mood scale 1-5 (1=drained, 5=energized)
    mood_score = Column(Integer, nullable=False)
    # Energy scale 1-5
    energy_score = Column(Integer, nullable=False)
    # Procrastination trigger tags (JSON array: ["boredom","anxiety","overwhelm",...])
    triggers = Column(JSON, default=list)
    note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="mood_entries")


#  Achievement 
class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(60), unique=True, nullable=False, index=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    # comic-style category (pow, zap, boom, wham)
    flair = Column(String(20), default="pow")
    xp_reward = Column(Integer, default=50)
    # Criteria as JSON (e.g. {"type": "focus_minutes", "threshold": 500})
    criteria = Column(JSON, default=dict)
    icon_emoji = Column(String(20), default="⭐")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False, index=True)
    earned_at = Column(DateTime, default=utc_now)
    progress = Column(Integer, default=100)  # 0-100, 100 = fully earned

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")

    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)


#  AI Interaction Log 
class AIInteraction(Base):
    __tablename__ = "ai_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    interaction_type = Column(String(40), nullable=False)  # plan, breakdown, coach, motivation
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    model_used = Column(String(80), default="z-ai-glm")
    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="ai_interactions")


#  Power Chain (habit stacking) 
class PowerChain(Base):
    __tablename__ = "power_chains"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(120), nullable=False)  # e.g. "Morning Power Routine"
    description = Column(Text, nullable=True)

    # Chain status
    is_active = Column(Boolean, default=True)
    started_at = Column(DateTime, default=utc_now)
    broken_at = Column(DateTime, nullable=True)  # set when chain snaps

    # KPIs
    current_chain_days = Column(Integer, default=0)      # consecutive days intact
    longest_chain_days = Column(Integer, default=0)      # all-time best
    total_completions = Column(Integer, default=0)
    last_completed_date = Column(String(10), nullable=True)  # YYYY-MM-DD

    # Comic flair
    action_word = Column(String(20), default="CHAIN!")
    color = Column(String(20), default="yellow")

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="power_chains")
    links = relationship("ChainLink", back_populates="chain", cascade="all, delete-orphan",
                         order_by="ChainLink.position")


class ChainLink(Base):
    """A single habit node in a power chain."""
    __tablename__ = "chain_links"

    id = Column(Integer, primary_key=True, index=True)
    chain_id = Column(Integer, ForeignKey("power_chains.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(120), nullable=False)
    position = Column(Integer, default=0)  # order in chain
    is_required = Column(Boolean, default=True)  # must complete to keep chain

    # Today's completion state
    completed_today = Column(Boolean, default=False)
    last_completed_date = Column(String(10), nullable=True)

    # Cumulative stats
    total_completions = Column(Integer, default=0)

    # Comic flair
    icon_code = Column(String(40), default="bolt")  # references our SVG icon set
    color = Column(String(20), default="yellow")

    created_at = Column(DateTime, default=utc_now)

    chain = relationship("PowerChain", back_populates="links")


#  Streak Shield (recovery mechanic) 
class StreakShield(Base):
    __tablename__ = "streak_shields"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Shield state
    is_spent = Column(Boolean, default=False)
    earned_at = Column(DateTime, default=utc_now)
    spent_at = Column(DateTime, nullable=True)
    spent_for_date = Column(String(10), nullable=True)  # the date it protected

    # How it was earned
    source = Column(String(60), default="bonus_mission")  # bonus_mission, achievement, daily_streak, deep_work
    source_detail = Column(String(255), nullable=True)

    # Comic flair
    shield_color = Column(String(20), default="blue")  # blue, gold, rainbow
    rarity = Column(String(20), default="common")  # common, rare, epic, legendary

    user = relationship("User", back_populates="streak_shields")


#  Breathe Sessions 
class BreatheSession(Base):
    __tablename__ = "breathe_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Session config
    technique = Column(String(40), default="4_7_8")  # 4_7_8, box, deep_belly
    cycles_completed = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)

    # User feedback
    calmness_before = Column(Integer, default=3)  # 1-5
    calmness_after = Column(Integer, default=3)   # 1-5

    # XP reward
    xp_earned = Column(Integer, default=0)

    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="breathe_sessions")


#  Daily KPI Snapshot (computed at end of day) 
class KPISnapshot(Base):
    __tablename__ = "kpi_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD

    # BAM! unique KPIs (0-100 unless noted)
    momentum_index = Column(Float, default=0)
    avoidance_resistance = Column(Float, default=0)
    power_level = Column(Float, default=0)
    chain_strength = Column(Integer, default=0)
    shield_reserve = Column(Integer, default=0)
    calm_count_week = Column(Integer, default=0)

    # Underlying metrics
    focus_minutes = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    tasks_created = Column(Integer, default=0)
    avg_mood = Column(Float, default=0)
    avg_energy = Column(Float, default=0)
    avg_action_latency_min = Column(Float, default=0)  # avg minutes from task creation to first action

    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (UniqueConstraint("user_id", "snapshot_date", name="uq_user_kpi_day"),)

    user = relationship("User", back_populates="kpi_snapshots")
