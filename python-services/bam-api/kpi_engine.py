"""
BAM! KPI Engine — computes unique anti-procrastination KPIs in real time.

Unique BAM! KPIs (not found in generic to-do apps):
  - Momentum Index (MI): streak × focus × completion ratio (0-100)
  - Avoidance Resistance Score (ARS): how fast user acts on tasks (0-100, higher = faster)
  - Power Level (PL): energy × completion ratio (0-100)
  - Chain Strength: longest active power chain (days)
  - Shield Reserve: unspent shield tokens
  - Calm Count Week: breathing sessions this week
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import (
    User, Task, TaskStatus, FocusSession, SessionStatus, MoodEntry,
    PowerChain, ChainLink, StreakShield, BreatheSession, KPISnapshot,
)


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _week_ago() -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=7)


def compute_momentum_index(user: User, db: Session) -> float:
    """MI = 0.4*streak_factor + 0.3*focus_factor + 0.3*completion_factor

    - streak_factor: min(streak / 7, 1.0) * 100
    - focus_factor: min(today_focus / 120, 1.0) * 100  (2 hours = 100)
    - completion_factor: tasks_completed_today / max(tasks_created_today, 3) * 100
    """
    today = datetime.now(timezone.utc).date()

    # Today's focus minutes
    today_focus = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED,
        func.date(FocusSession.started_at) == today
    ).scalar() or 0

    # Today's tasks completed
    today_completed = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id,
        Task.status == TaskStatus.COMPLETED,
        func.date(Task.completed_at) == today
    ).scalar() or 0

    today_created = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id,
        func.date(Task.created_at) == today
    ).scalar() or 0

    streak_factor = min((user.current_streak or 0) / 7.0, 1.0) * 100
    focus_factor = min(today_focus / 120.0, 1.0) * 100
    completion_factor = min(today_completed / max(today_created, 3), 1.0) * 100

    mi = 0.4 * streak_factor + 0.3 * focus_factor + 0.3 * completion_factor
    return round(mi, 1)


def compute_avoidance_resistance(user: User, db: Session) -> float:
    """ARS measures how quickly user acts on tasks after creating them.

    For each task created in last 7 days:
      - If completed or in_progress: latency = time from create to first status change
      - If still pending: latency = age of task (penalty)
    ARS = 100 - normalized_latency_score (higher latency = lower ARS)
    """
    week_ago = _week_ago()
    recent_tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.created_at >= week_ago
    ).all()

    if not recent_tasks:
        return 50.0  # neutral score when no tasks

    latencies_min = []
    now = datetime.now(timezone.utc)
    for t in recent_tasks:
        if t.status in (TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS) and t.updated_at:
            latency = (t.updated_at - t.created_at).total_seconds() / 60.0
            latencies_min.append(max(latency, 0))
        else:
            # Pending — penalty based on age
            age = (now - t.created_at).total_seconds() / 60.0
            latencies_min.append(max(age, 0))

    avg_latency = sum(latencies_min) / len(latencies_min)
    # 0 min = ARS 100, 1440 min (24h) = ARS 0
    ars = max(0, 100 - (avg_latency / 1440.0) * 100)
    return round(ars, 1)


def compute_power_level(user: User, db: Session) -> float:
    """PL = 0.5*energy_factor + 0.5*completion_ratio

    - energy_factor: avg energy this week × 20 (energy 1-5 → 20-100)
    - completion_ratio: completed / (completed + abandoned) × 100
    """
    week_ago = _week_ago()

    # Avg energy this week
    avg_energy = db.query(func.avg(MoodEntry.energy_score)).filter(
        MoodEntry.user_id == user.id,
        MoodEntry.created_at >= week_ago
    ).scalar()
    avg_energy = float(avg_energy) if avg_energy else 3.0
    energy_factor = min(avg_energy * 20, 100)

    # Completion ratio (tasks completed vs created)
    completed = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id,
        Task.status == TaskStatus.COMPLETED,
        Task.created_at >= week_ago
    ).scalar() or 0
    created = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id,
        Task.created_at >= week_ago
    ).scalar() or 0
    completion_ratio = (completed / max(created, 1)) * 100

    pl = 0.5 * energy_factor + 0.5 * completion_ratio
    return round(pl, 1)


def compute_chain_strength(user: User, db: Session) -> int:
    """Longest current_chain_days across all active chains."""
    chains = db.query(PowerChain).filter(
        PowerChain.user_id == user.id,
        PowerChain.is_active == True
    ).all()
    if not chains:
        return 0
    return max(c.current_chain_days or 0 for c in chains)


def compute_shield_reserve(user: User, db: Session) -> int:
    """Count of unspent shields."""
    return db.query(func.count(StreakShield.id)).filter(
        StreakShield.user_id == user.id,
        StreakShield.is_spent == False
    ).scalar() or 0


def compute_calm_count_week(user: User, db: Session) -> int:
    """Breathing sessions in last 7 days."""
    week_ago = _week_ago()
    return db.query(func.count(BreatheSession.id)).filter(
        BreatheSession.user_id == user.id,
        BreatheSession.created_at >= week_ago
    ).scalar() or 0


def compute_all_kpis(user: User, db: Session) -> dict:
    """Compute all BAM! KPIs for a user, in real time."""
    today = datetime.now(timezone.utc).date()
    week_ago_dt = _week_ago()

    # Underlying metrics
    focus_today = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED,
        func.date(FocusSession.started_at) == today
    ).scalar() or 0

    tasks_completed_today = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id,
        Task.status == TaskStatus.COMPLETED,
        func.date(Task.completed_at) == today
    ).scalar() or 0

    tasks_created_today = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id,
        func.date(Task.created_at) == today
    ).scalar() or 0

    avg_mood_week = db.query(func.avg(MoodEntry.mood_score)).filter(
        MoodEntry.user_id == user.id,
        MoodEntry.created_at >= week_ago_dt
    ).scalar()
    avg_mood_week = round(float(avg_mood_week), 1) if avg_mood_week else 0.0

    avg_energy_week = db.query(func.avg(MoodEntry.energy_score)).filter(
        MoodEntry.user_id == user.id,
        MoodEntry.created_at >= week_ago_dt
    ).scalar()
    avg_energy_week = round(float(avg_energy_week), 1) if avg_energy_week else 0.0

    # Action latency
    recent_tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.created_at >= week_ago_dt
    ).all()
    latencies = []
    now = datetime.now(timezone.utc)
    for t in recent_tasks:
        if t.status in (TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS) and t.updated_at:
            lat = (t.updated_at - t.created_at).total_seconds() / 60.0
            latencies.append(max(lat, 0))
        else:
            lat = (now - t.created_at).total_seconds() / 60.0
            latencies.append(max(lat, 0))
    avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else 0.0

    return {
        "momentum_index": compute_momentum_index(user, db),
        "avoidance_resistance": compute_avoidance_resistance(user, db),
        "power_level": compute_power_level(user, db),
        "chain_strength": compute_chain_strength(user, db),
        "shield_reserve": compute_shield_reserve(user, db),
        "calm_count_week": compute_calm_count_week(user, db),
        "focus_minutes_today": focus_today,
        "tasks_completed_today": tasks_completed_today,
        "tasks_created_today": tasks_created_today,
        "avg_mood_week": avg_mood_week,
        "avg_energy_week": avg_energy_week,
        "avg_action_latency_min": avg_latency,
        "streak_days": user.current_streak or 0,
        "level": user.level or 1,
        "xp": user.xp or 0,
    }


def award_shield(user: User, source: str, source_detail: str, db: Session,
                 color: str = "blue", rarity: str = "common") -> StreakShield:
    """Award a streak shield to the user."""
    shield = StreakShield(
        user_id=user.id,
        source=source,
        source_detail=source_detail,
        shield_color=color,
        rarity=rarity,
    )
    db.add(shield)
    db.flush()
    return shield
