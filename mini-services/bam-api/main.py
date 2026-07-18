"""
BAM! Anti-Procrastination Platform — FastAPI Application
"""
import random
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer

from config import settings
from database import get_db, init_db
from models import (
    User, Task, TaskStatus, TaskPriority, FocusSession, SessionStatus, SessionType,
    MoodEntry, Achievement, UserAchievement, AIInteraction,
    PowerChain, ChainLink, StreakShield, BreatheSession, KPISnapshot,
)
from schemas import (
    UserCreate, UserLogin, UserOut, TokenOut, OnboardingSubmit,
    UserUpdate, ProfileSummary, ProfileActivityItem,
    TaskCreate, TaskUpdate, TaskOut, FocusSessionCreate, FocusSessionUpdate,
    FocusSessionOut, MoodEntryCreate, MoodEntryOut, AchievementOut,
    UserAchievementOut, AIBreakdownRequest, AIBreakdownResponse,
    AICoachRequest, AICoachResponse, AIPlanRequest, AIPlanResponse,
    AIInteractionOut, DashboardOut,
    ChainCreate, ChainOut, ChainLinkToggleOut,
    ShieldOut, ShieldSpendRequest, ShieldSpendResponse,
    BreatheSessionCreate, BreatheSessionOut,
    KPIOut,
)
from security import (
    hash_password, verify_password, create_access_token, get_current_user
)
from gamification import add_xp, update_streak, evaluate_achievements, xp_for_level
from ai_service import generate_task_breakdown, generate_personalized_plan, ai_coach_chat
from onboarding import get_quiz_questions, get_type_info, apply_onboarding
from kpi_engine import compute_all_kpis, award_shield

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="BAM! — Beat Avoidance Mode. Comic-style anti-procrastination platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def health():
    return {"app": settings.APP_NAME, "status": "running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "bam-api"}


# ============================================================
# AUTH
# ============================================================
@app.post(f"{settings.API_V1_PREFIX}/auth/register", response_model=TokenOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first():
        raise HTTPException(status_code=400, detail="Email or username already registered")
    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name or payload.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@app.post(f"{settings.API_V1_PREFIX}/auth/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@app.get(f"{settings.API_V1_PREFIX}/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@app.patch(f"{settings.API_V1_PREFIX}/auth/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile (display name, sound, theme)."""
    if payload.display_name is not None:
        user.display_name = payload.display_name.strip()
    if payload.sound_enabled is not None:
        user.sound_enabled = payload.sound_enabled
    if payload.theme is not None:
        user.theme = payload.theme
    db.commit()
    db.refresh(user)
    return user


@app.post(f"{settings.API_V1_PREFIX}/onboarding/retake", response_model=UserOut)
def retake_onboarding(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reset onboarding so the user can re-take the procrastination-type quiz.

    The existing personalized_plan and procrastination_type are kept until the
    user submits the new quiz answers via /onboarding/submit.
    """
    user.onboarding_completed_at = None
    db.commit()
    db.refresh(user)
    return user


@app.get(f"{settings.API_V1_PREFIX}/profile/summary", response_model=ProfileSummary)
def profile_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregated profile data — lifetime totals, level progress, recent activity."""
    # ---- Level progress ----
    cur_level_xp = xp_for_level(user.level)
    next_level = user.level + 1
    next_level_xp = xp_for_level(next_level)
    xp_into_level = user.xp - cur_level_xp
    xp_for_next_level = next_level_xp - cur_level_xp
    xp_to_next_level = max(0, next_level_xp - user.xp)
    progress_pct = (xp_into_level / xp_for_next_level * 100) if xp_for_next_level > 0 else 100
    progress_pct = max(0, min(100, progress_pct))

    # ---- Task totals ----
    total_tasks = db.query(func.count(Task.id)).filter(Task.user_id == user.id).scalar() or 0
    tasks_completed = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id, Task.status == TaskStatus.COMPLETED
    ).scalar() or 0
    tasks_pending = total_tasks - tasks_completed

    # ---- Focus totals ----
    focus_agg = db.query(
        func.coalesce(func.sum(FocusSession.actual_minutes), 0),
        func.count(FocusSession.id),
    ).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED
    ).one()
    total_focus_minutes = int(focus_agg[0] or 0)
    total_focus_sessions = int(focus_agg[1] or 0)

    # ---- Breathe totals ----
    breathe_agg = db.query(
        func.count(BreatheSession.id),
        func.coalesce(func.sum(BreatheSession.duration_seconds), 0),
    ).filter(BreatheSession.user_id == user.id).one()
    total_breathe_sessions = int(breathe_agg[0] or 0)
    total_breathe_minutes = int((breathe_agg[1] or 0) // 60)

    # ---- Chain totals ----
    chain_agg = db.query(
        func.count(PowerChain.id),
        func.coalesce(func.sum(PowerChain.total_completions), 0),
        func.coalesce(func.max(PowerChain.longest_chain_days), 0),
    ).filter(PowerChain.user_id == user.id).one()
    total_chains = int(chain_agg[0] or 0)
    total_chain_completions = int(chain_agg[1] or 0)
    longest_chain = int(chain_agg[2] or 0)

    # ---- Shield totals ----
    shield_agg = db.query(
        func.count(StreakShield.id),
        func.coalesce(func.sum(StreakShield.is_spent.cast(Integer)), 0),
    ).filter(StreakShield.user_id == user.id).one()
    total_shields_earned = int(shield_agg[0] or 0)
    total_shields_spent = int(shield_agg[1] or 0)

    # ---- Achievements ----
    achievements_earned = db.query(func.count(UserAchievement.id)).filter(
        UserAchievement.user_id == user.id
    ).scalar() or 0
    achievements_total = db.query(func.count(Achievement.id)).scalar() or 0

    # ---- Mood + AI ----
    mood_entries = db.query(func.count(MoodEntry.id)).filter(
        MoodEntry.user_id == user.id
    ).scalar() or 0
    ai_interactions = db.query(func.count(AIInteraction.id)).filter(
        AIInteraction.user_id == user.id
    ).scalar() or 0

    # ---- Days active (distinct dates from all activity tables) ----
    task_dates = db.query(func.distinct(func.date(Task.created_at))).filter(
        Task.user_id == user.id
    ).all()
    focus_dates = db.query(func.distinct(func.date(FocusSession.started_at))).filter(
        FocusSession.user_id == user.id
    ).all()
    mood_dates = db.query(func.distinct(func.date(MoodEntry.created_at))).filter(
        MoodEntry.user_id == user.id
    ).all()
    breathe_dates = db.query(func.distinct(func.date(BreatheSession.created_at))).filter(
        BreatheSession.user_id == user.id
    ).all()
    all_dates = set()
    for rows in (task_dates, focus_dates, mood_dates, breathe_dates):
        for (d,) in rows:
            if d:
                all_dates.add(str(d))
    days_active = len(all_dates)

    # ---- Recent activity feed (merge last 15 across sources) ----
    activity: list[ProfileActivityItem] = []

    # Tasks completed
    for t in db.query(Task).filter(
        Task.user_id == user.id, Task.status == TaskStatus.COMPLETED, Task.completed_at.isnot(None)
    ).order_by(Task.completed_at.desc()).limit(10).all():
        activity.append(ProfileActivityItem(
            kind="task_completed",
            title=f"Completed: {t.title}",
            detail=f"{t.actual_minutes or 0}m actual / {t.estimated_minutes or 0}m est",
            timestamp=t.completed_at,
            xp=25 + (t.difficulty or 2) * 10 + (t.estimated_minutes or 25),
        ))

    # Focus sessions completed
    for s in db.query(FocusSession).filter(
        FocusSession.user_id == user.id, FocusSession.status == SessionStatus.COMPLETED
    ).order_by(FocusSession.ended_at.desc()).limit(10).all():
        activity.append(ProfileActivityItem(
            kind="focus_session",
            title=f"{s.session_type.replace('_',' ').title()} — {s.actual_minutes}m",
            detail=f"Quality {s.focus_quality}/5 · Distractions {s.distractions}",
            timestamp=s.ended_at or s.started_at,
            xp=(s.actual_minutes or 0) * (3 if s.session_type == SessionType.DEEP_WORK else 2),
        ))

    # Mood logs
    for m in db.query(MoodEntry).filter(MoodEntry.user_id == user.id).order_by(
        MoodEntry.created_at.desc()
    ).limit(10).all():
        activity.append(ProfileActivityItem(
            kind="mood_logged",
            title=f"Mood {m.mood_score}/5 · Energy {m.energy_score}/5",
            detail=", ".join(m.triggers) if m.triggers else None,
            timestamp=m.created_at,
            xp=5,
        ))

    # Breathe sessions
    for b in db.query(BreatheSession).filter(BreatheSession.user_id == user.id).order_by(
        BreatheSession.created_at.desc()
    ).limit(10).all():
        activity.append(ProfileActivityItem(
            kind="breathe_session",
            title=f"Breathe: {b.technique.replace('_','-')} · {b.cycles_completed} cycles",
            detail=f"Calm {b.calmness_before}→{b.calmness_after} · {b.duration_seconds}s",
            timestamp=b.created_at,
            xp=b.xp_earned or 0,
        ))

    # Chain completions (use last_completed_date on chains)
    # NOTE: keep the timestamp naive (no tzinfo) so it is comparable with the
    # naive datetimes returned by SQLAlchemy for the other activity sources.
    # Mixing tz-aware and tz-naive datetimes raises TypeError when sorting.
    for c in db.query(PowerChain).filter(
        PowerChain.user_id == user.id, PowerChain.last_completed_date.isnot(None)
    ).order_by(PowerChain.last_completed_date.desc()).limit(10).all():
        ts = datetime.strptime(c.last_completed_date, "%Y-%m-%d")
        activity.append(ProfileActivityItem(
            kind="chain_completed",
            title=f"Chain day: {c.title}",
            detail=f"Day {c.current_chain_days} (best: {c.longest_chain_days})",
            timestamp=ts,
            xp=50,
        ))

    # Shield earned
    for sh in db.query(StreakShield).filter(StreakShield.user_id == user.id).order_by(
        StreakShield.earned_at.desc()
    ).limit(10).all():
        activity.append(ProfileActivityItem(
            kind="shield_earned",
            title=f"{sh.rarity.title()} {sh.shield_color.title()} shield",
            detail=sh.source_detail or sh.source,
            timestamp=sh.earned_at,
            xp=0,
        ))

    # Achievement earned
    for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).order_by(
        UserAchievement.earned_at.desc()
    ).limit(10).all():
        activity.append(ProfileActivityItem(
            kind="achievement_earned",
            title=f"Trophy: {ua.achievement.title}",
            detail=ua.achievement.description,
            timestamp=ua.earned_at,
            xp=ua.achievement.xp_reward or 0,
        ))

    # AI interactions
    for ai in db.query(AIInteraction).filter(AIInteraction.user_id == user.id).order_by(
        AIInteraction.created_at.desc()
    ).limit(10).all():
        activity.append(ProfileActivityItem(
            kind="ai_interaction",
            title=f"AI {ai.interaction_type}",
            detail=ai.model_used,
            timestamp=ai.created_at,
            xp=0,
        ))

    # Sort by timestamp desc and trim to 15.
    # Use a sentinel (datetime.min) for any None timestamps so the sort never crashes.
    _EPOCH = datetime.min
    activity.sort(key=lambda a: a.timestamp or _EPOCH, reverse=True)
    activity = activity[:15]

    return ProfileSummary(
        user=user,
        level=user.level,
        xp=user.xp,
        xp_into_level=xp_into_level,
        xp_for_next_level=xp_for_next_level,
        xp_to_next_level=xp_to_next_level,
        next_level=next_level,
        progress_pct=progress_pct,
        total_tasks=total_tasks,
        tasks_completed=tasks_completed,
        tasks_pending=tasks_pending,
        total_focus_minutes=total_focus_minutes,
        total_focus_sessions=total_focus_sessions,
        total_breathe_sessions=total_breathe_sessions,
        total_breathe_minutes=total_breathe_minutes,
        total_chains=total_chains,
        total_chain_completions=total_chain_completions,
        longest_chain=longest_chain,
        total_shields_earned=total_shields_earned,
        total_shields_spent=total_shields_spent,
        achievements_earned=achievements_earned,
        achievements_total=achievements_total,
        mood_entries=mood_entries,
        ai_interactions=ai_interactions,
        member_since=user.created_at,
        days_active=days_active,
        procrastination_type=user.procrastination_type.value if user.procrastination_type else "unknown",
        onboarding_completed_at=user.onboarding_completed_at,
        recent_activity=activity,
    )


# ============================================================
# ONBOARDING
# ============================================================
@app.get(f"{settings.API_V1_PREFIX}/onboarding/quiz")
def quiz():
    return {"questions": get_quiz_questions()}


@app.post(f"{settings.API_V1_PREFIX}/onboarding/submit", response_model=UserOut)
def submit_onboarding(
    payload: OnboardingSubmit,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = apply_onboarding(user, payload, db)
    db.refresh(user)
    return user


@app.get(f"{settings.API_V1_PREFIX}/onboarding/type-info")
def type_info(ptype: str = Query(...)):
    return get_type_info(ptype)


@app.get(f"{settings.API_V1_PREFIX}/onboarding/my-type")
def my_type(user: User = Depends(get_current_user)):
    return {
        "type": user.procrastination_type.value if user.procrastination_type else "unknown",
        "info": get_type_info(user.procrastination_type),
        "onboarded": user.onboarding_completed_at is not None,
    }


# ============================================================
# TASKS
# ============================================================
@app.post(f"{settings.API_V1_PREFIX}/tasks", response_model=TaskOut, status_code=201)
def create_task(
    payload: TaskCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    action_words = ["POW!", "BAM!", "ZAP!", "BOOM!", "WHAM!", "KAPOW!"]
    task = Task(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        priority=TaskPriority(payload.priority),
        category=payload.category,
        estimated_minutes=payload.estimated_minutes,
        due_date=payload.due_date,
        energy_required=payload.energy_required,
        difficulty=payload.difficulty,
        action_word=random.choice(action_words),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.get(f"{settings.API_V1_PREFIX}/tasks", response_model=list[TaskOut])
def list_tasks(
    status_filter: str | None = Query(None, alias="status"),
    category: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Task).filter(Task.user_id == user.id)
    if status_filter:
        q = q.filter(Task.status == TaskStatus(status_filter))
    if category:
        q = q.filter(Task.category == category)
    return q.order_by(Task.created_at.desc()).limit(limit).all()


@app.get(f"{settings.API_V1_PREFIX}/tasks/{{task_id}}", response_model=TaskOut)
def get_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.patch(f"{settings.API_V1_PREFIX}/tasks/{{task_id}}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    was_completed = task.status == TaskStatus.COMPLETED
    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data:
        new_status = TaskStatus(update_data["status"])
        task.status = new_status
        if new_status == TaskStatus.COMPLETED and not was_completed:
            task.completed_at = datetime.now(timezone.utc)
            # Award XP based on difficulty
            xp = 25 + (task.difficulty or 2) * 10 + (task.estimated_minutes or 25)
            xp_summary = add_xp(user, xp, db)
            update_streak(user, db)
            new_ach = evaluate_achievements(user, db)
            update_data["_xp_awarded"] = xp
            update_data["_new_achievements"] = new_ach
        elif was_completed and new_status != TaskStatus.COMPLETED:
            task.completed_at = None

    for k in ("title", "description", "priority", "category",
              "estimated_minutes", "actual_minutes", "due_date",
              "breakdown", "energy_required", "difficulty"):
        if k in update_data:
            setattr(task, k, update_data[k])

    db.commit()
    db.refresh(task)
    return task


@app.delete(f"{settings.API_V1_PREFIX}/tasks/{{task_id}}", status_code=204)
def delete_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


# ============================================================
# FOCUS SESSIONS
# ============================================================
@app.post(f"{settings.API_V1_PREFIX}/focus-sessions", response_model=FocusSessionOut, status_code=201)
def create_session(
    payload: FocusSessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.task_id:
        task = db.query(Task).filter(Task.id == payload.task_id, Task.user_id == user.id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        task.status = TaskStatus.IN_PROGRESS
        db.commit()

    session = FocusSession(
        user_id=user.id,
        task_id=payload.task_id,
        session_type=SessionType(payload.session_type),
        planned_minutes=payload.planned_minutes,
        status=SessionStatus.ACTIVE,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@app.get(f"{settings.API_V1_PREFIX}/focus-sessions", response_model=list[FocusSessionOut])
def list_sessions(
    limit: int = Query(50, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(FocusSession).filter(FocusSession.user_id == user.id).order_by(
        FocusSession.started_at.desc()
    ).limit(limit).all()


@app.patch(f"{settings.API_V1_PREFIX}/focus-sessions/{{session_id}}", response_model=FocusSessionOut)
def update_session(
    session_id: int,
    payload: FocusSessionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id, FocusSession.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_data = payload.model_dump(exclude_unset=True)
    was_completed = session.status == SessionStatus.COMPLETED

    for k, v in update_data.items():
        setattr(session, k, v)

    if "status" in update_data and update_data["status"] == "completed" and not was_completed:
        session.ended_at = datetime.now(timezone.utc)
        if session.actual_minutes == 0:
            session.actual_minutes = session.planned_minutes
        # Award XP
        xp = session.actual_minutes * 2
        if session.session_type == SessionType.DEEP_WORK:
            xp = session.actual_minutes * 3
        add_xp(user, xp, db)
        update_streak(user, db)
        new_ach = evaluate_achievements(user, db)
        # Update task actual minutes if linked
        if session.task_id:
            task = db.query(Task).filter(Task.id == session.task_id).first()
            if task:
                task.actual_minutes = (task.actual_minutes or 0) + session.actual_minutes

    db.commit()
    db.refresh(session)
    return session


# ============================================================
# MOOD
# ============================================================
@app.post(f"{settings.API_V1_PREFIX}/mood", response_model=MoodEntryOut, status_code=201)
def create_mood(
    payload: MoodEntryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = MoodEntry(
        user_id=user.id,
        mood_score=payload.mood_score,
        energy_score=payload.energy_score,
        triggers=payload.triggers,
        note=payload.note,
    )
    db.add(entry)
    # Small XP for tracking mood
    add_xp(user, 5, db)
    db.commit()
    db.refresh(entry)
    return entry


@app.get(f"{settings.API_V1_PREFIX}/mood", response_model=list[MoodEntryOut])
def list_mood(
    limit: int = Query(30, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(MoodEntry).filter(MoodEntry.user_id == user.id).order_by(
        MoodEntry.created_at.desc()
    ).limit(limit).all()


# ============================================================
# ACHIEVEMENTS
# ============================================================
@app.get(f"{settings.API_V1_PREFIX}/achievements", response_model=list[AchievementOut])
def list_achievements(db: Session = Depends(get_db)):
    return db.query(Achievement).all()


@app.get(f"{settings.API_V1_PREFIX}/achievements/mine", response_model=list[UserAchievementOut])
def my_achievements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()


@app.post(f"{settings.API_V1_PREFIX}/achievements/evaluate")
def evaluate_now(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_ach = evaluate_achievements(user, db)
    return {"newly_earned": new_ach}


# ============================================================
# AI
# ============================================================
@app.post(f"{settings.API_V1_PREFIX}/ai/breakdown", response_model=AIBreakdownResponse)
async def ai_breakdown(
    payload: AIBreakdownRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await generate_task_breakdown(
        user, payload.task_title, payload.task_description,
        payload.estimated_minutes, db
    )
    return result


@app.post(f"{settings.API_V1_PREFIX}/ai/coach", response_model=AICoachResponse)
async def ai_coach(
    payload: AICoachRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await ai_coach_chat(user, payload.message, payload.context, db)


@app.post(f"{settings.API_V1_PREFIX}/ai/plan", response_model=AIPlanResponse)
async def ai_plan(
    payload: AIPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = await generate_personalized_plan(user, db)
    return AIPlanResponse(plan=plan, generated_at=datetime.now(timezone.utc))


@app.get(
    f"{settings.API_V1_PREFIX}/ai/interactions",
    response_model=list[AIInteractionOut],
)
def list_ai_interactions(
    limit: int = Query(50, ge=1, le=500),
    interaction_type: str | None = Query(
        None,
        description="Filter by type: coach, breakdown, plan, motivation",
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's AI interaction history.

    Optional `interaction_type` filter lets the frontend fetch only coach chats
    (e.g. `?interaction_type=coach`) for the coach history panel.
    """
    q = db.query(AIInteraction).filter(AIInteraction.user_id == user.id)
    if interaction_type:
        q = q.filter(AIInteraction.interaction_type == interaction_type)
    return q.order_by(AIInteraction.created_at.desc()).limit(limit).all()


# ============================================================
# DASHBOARD
# ============================================================
MOTIVATIONAL_QUOTES = [
    "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
    "The secret of getting ahead is getting started. — Mark Twain",
    "Action is the foundational key to all success. — Pablo Picasso",
    "Procrastination is the thief of time. — Edward Young",
    "You may delay, but time will not. — Benjamin Franklin",
    "A year from now you may wish you had started today. — Karen Lamb",
    "The best way to predict the future is to create it. — Peter Drucker",
    "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
    "It always seems impossible until it's done. — Nelson Mandela",
    "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
]


@app.get(f"{settings.API_V1_PREFIX}/dashboard", response_model=DashboardOut)
def dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Today's tasks
    today = datetime.now(timezone.utc).date()
    today_tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status != TaskStatus.COMPLETED
    ).order_by(Task.priority.desc(), Task.created_at.asc()).limit(5).all()

    # Today's focus minutes
    today_focus = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED,
        func.date(FocusSession.started_at) == today
    ).scalar() or 0

    # Total focus minutes
    total_focus = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
        FocusSession.user_id == user.id,
        FocusSession.status == SessionStatus.COMPLETED
    ).scalar() or 0

    # Weekly focus minutes (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        mins = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
            FocusSession.user_id == user.id,
            FocusSession.status == SessionStatus.COMPLETED,
            func.date(FocusSession.started_at) == d
        ).scalar() or 0
        weekly.append({"date": d.isoformat(), "minutes": mins})

    # Achievements
    earned_ids = {ua.achievement_id for ua in
                  db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()}
    earned = db.query(UserAchievement).filter(UserAchievement.user_id == user.id).order_by(
        UserAchievement.earned_at.desc()
    ).limit(5).all()
    pending = db.query(Achievement).filter(~Achievement.id.in_(earned_ids)).limit(5).all() if earned_ids else db.query(Achievement).limit(5).all()

    # Current mood
    current_mood = db.query(MoodEntry).filter(MoodEntry.user_id == user.id).order_by(
        MoodEntry.created_at.desc()
    ).first()

    return DashboardOut(
        user=user,
        today_tasks=today_tasks,
        today_focus_minutes=today_focus,
        total_focus_minutes=total_focus,
        weekly_focus_minutes=weekly,
        recent_achievements=earned,
        pending_achievements=pending,
        current_mood=current_mood,
        streak_data={
            "current": user.current_streak,
            "longest": user.longest_streak,
            "last_active": user.last_active_date,
        },
        motivational_quote=random.choice(MOTIVATIONAL_QUOTES),
    )


# ============================================================
# STATS (extra endpoint for charts)
# ============================================================
@app.get(f"{settings.API_V1_PREFIX}/stats/weekly")
def weekly_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.now(timezone.utc).date()
    days = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        focus_mins = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
            FocusSession.user_id == user.id,
            FocusSession.status == SessionStatus.COMPLETED,
            func.date(FocusSession.started_at) == d
        ).scalar() or 0
        tasks_done = db.query(func.count(Task.id)).filter(
            Task.user_id == user.id,
            Task.status == TaskStatus.COMPLETED,
            func.date(Task.completed_at) == d
        ).scalar() or 0
        mood = db.query(MoodEntry).filter(
            MoodEntry.user_id == user.id,
            func.date(MoodEntry.created_at) == d
        ).order_by(MoodEntry.created_at.desc()).first()
        days.append({
            "date": d.isoformat(),
            "weekday": d.strftime("%a"),
            "focus_minutes": focus_mins,
            "tasks_completed": tasks_done,
            "mood": mood.mood_score if mood else None,
            "energy": mood.energy_score if mood else None,
        })
    return {"days": days, "user_xp": user.xp, "user_level": user.level}


# ============================================================
# UNIQUE BAM! FEATURE — POWER CHAIN (habit stacking)
# ============================================================
@app.post(f"{settings.API_V1_PREFIX}/chains", response_model=ChainOut, status_code=201)
def create_chain(
    payload: ChainCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new power chain with linked habits."""
    if not payload.links or len(payload.links) < 2:
        raise HTTPException(400, "A power chain needs at least 2 links (habits).")
    if len(payload.links) > 10:
        raise HTTPException(400, "Maximum 10 links per chain.")

    chain = PowerChain(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        color=payload.color,
        action_word=random.choice(["CHAIN!", "LINK!", "POWER!", "CONNECT!"]),
    )
    db.add(chain)
    db.flush()

    for i, link_data in enumerate(payload.links):
        link = ChainLink(
            chain_id=chain.id,
            user_id=user.id,
            title=link_data.title,
            position=i,
            is_required=link_data.is_required,
            icon_code=link_data.icon_code,
            color=link_data.color,
        )
        db.add(link)

    db.commit()
    db.refresh(chain)
    return chain


@app.get(f"{settings.API_V1_PREFIX}/chains", response_model=list[ChainOut])
def list_chains(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(PowerChain).filter(PowerChain.user_id == user.id).order_by(
        PowerChain.created_at.desc()
    ).all()


@app.get(f"{settings.API_V1_PREFIX}/chains/{{chain_id}}", response_model=ChainOut)
def get_chain(
    chain_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chain = db.query(PowerChain).filter(
        PowerChain.id == chain_id, PowerChain.user_id == user.id
    ).first()
    if not chain:
        raise HTTPException(404, "Chain not found")
    return chain


@app.delete(f"{settings.API_V1_PREFIX}/chains/{{chain_id}}", status_code=204)
def delete_chain(
    chain_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chain = db.query(PowerChain).filter(
        PowerChain.id == chain_id, PowerChain.user_id == user.id
    ).first()
    if not chain:
        raise HTTPException(404, "Chain not found")
    db.delete(chain)
    db.commit()


@app.post(f"{settings.API_V1_PREFIX}/chains/{{chain_id}}/links/{{link_id}}/toggle",
          response_model=ChainLinkToggleOut)
def toggle_link(
    chain_id: int,
    link_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle a chain link's completion for today.

    If all required links become completed, the chain day is incremented and the user
    earns XP + a chance for a shield. If a previously-completed link is un-toggled
    after the day was marked complete, the chain breaks (with SNAP!).
    """
    chain = db.query(PowerChain).filter(
        PowerChain.id == chain_id, PowerChain.user_id == user.id
    ).first()
    if not chain:
        raise HTTPException(404, "Chain not found")

    link = db.query(ChainLink).filter(
        ChainLink.id == link_id, ChainLink.chain_id == chain_id
    ).first()
    if not link:
        raise HTTPException(404, "Link not found")

    today = datetime.now(timezone.utc).date().isoformat()
    was_chain_complete_today = chain.last_completed_date == today
    new_state = not link.completed_today
    link.completed_today = new_state

    xp_earned = 0
    new_shield = None
    chain_broken = False

    if new_state:
        # Marking complete
        link.last_completed_date = today
        link.total_completions = (link.total_completions or 0) + 1
        xp_earned = 15
        # Check if all required links are now complete
        required_links = [l for l in chain.links if l.is_required]
        all_complete = all(l.completed_today for l in required_links)
        if all_complete and not was_chain_complete_today:
            # Chain day complete!
            chain.current_chain_days = (chain.current_chain_days or 0) + 1
            chain.total_completions = (chain.total_completions or 0) + 1
            chain.last_completed_date = today
            if chain.current_chain_days > (chain.longest_chain_days or 0):
                chain.longest_chain_days = chain.current_chain_days
            xp_earned += 50
            # Bonus: every 3-day chain = award a shield
            if chain.current_chain_days % 3 == 0:
                shield_color = "gold" if chain.current_chain_days >= 9 else "blue"
                rarity = "rare" if chain.current_chain_days >= 9 else "common"
                new_shield = award_shield(
                    user, "power_chain",
                    f"Chain '{chain.title}' reached {chain.current_chain_days} days",
                    db, color=shield_color, rarity=rarity
                )
                new_shield = {
                    "id": new_shield.id,
                    "shield_color": new_shield.shield_color,
                    "rarity": new_shield.rarity,
                    "source": "power_chain",
                }
    else:
        # Un-toggling — if chain was complete today, break it
        link.last_completed_date = None
        if was_chain_complete_today:
            chain_broken = True
            chain.current_chain_days = 0
            chain.broken_at = datetime.now(timezone.utc)
            chain.is_active = False

    add_xp(user, xp_earned, db)
    db.commit()
    db.refresh(link)
    db.refresh(chain)

    return ChainLinkToggleOut(
        link=link,
        chain_completed_today=chain.last_completed_date == today,
        chain_broken=chain_broken,
        xp_earned=xp_earned,
        new_shield_earned=new_shield,
    )


@app.post(f"{settings.API_V1_PREFIX}/chains/{{chain_id}}/restart", response_model=ChainOut)
def restart_chain(
    chain_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Restart a broken chain — resets to active, clears links for today."""
    chain = db.query(PowerChain).filter(
        PowerChain.id == chain_id, PowerChain.user_id == user.id
    ).first()
    if not chain:
        raise HTTPException(404, "Chain not found")

    chain.is_active = True
    chain.broken_at = None
    chain.current_chain_days = 0
    for link in chain.links:
        link.completed_today = False
        link.last_completed_date = None
    db.commit()
    db.refresh(chain)
    return chain


# ============================================================
# UNIQUE BAM! FEATURE — STREAK SHIELD (recovery mechanic)
# ============================================================
@app.get(f"{settings.API_V1_PREFIX}/shields", response_model=list[ShieldOut])
def list_shields(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(StreakShield).filter(
        StreakShield.user_id == user.id
    ).order_by(StreakShield.earned_at.desc()).all()


@app.get(f"{settings.API_V1_PREFIX}/shields/reserve")
def shield_reserve(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(func.count(StreakShield.id)).filter(
        StreakShield.user_id == user.id,
        StreakShield.is_spent == False
    ).scalar() or 0
    return {"reserve": count}


@app.post(f"{settings.API_V1_PREFIX}/shields/spend", response_model=ShieldSpendResponse)
def spend_shield(
    payload: ShieldSpendRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Spend a shield to protect a missed day (target_date must be yesterday or older)."""
    try:
        target = datetime.strptime(payload.target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "target_date must be YYYY-MM-DD")

    today = datetime.now(timezone.utc).date()
    if target >= today:
        raise HTTPException(400, "Can only protect past days (yesterday or earlier).")

    # Check if user already has a shield spent for this date
    existing = db.query(StreakShield).filter(
        StreakShield.user_id == user.id,
        StreakShield.spent_for_date == payload.target_date
    ).first()
    if existing:
        return ShieldSpendResponse(
            success=False, message="This date is already protected.",
            streak_protected=True
        )

    # Find an unspent shield
    shield = db.query(StreakShield).filter(
        StreakShield.user_id == user.id,
        StreakShield.is_spent == False
    ).order_by(StreakShield.earned_at.asc()).first()
    if not shield:
        raise HTTPException(400, "No shields in reserve! Earn more by completing power chains or deep work sessions.")

    shield.is_spent = True
    shield.spent_at = datetime.now(timezone.utc)
    shield.spent_for_date = payload.target_date

    # Update streak — pretend last_active_date is today so streak doesn't break
    user.last_active_date = today.isoformat()
    if user.current_streak == 0:
        user.current_streak = 1

    db.commit()
    db.refresh(shield)
    return ShieldSpendResponse(
        success=True, shield=shield,
        message=f"Shield spent! {payload.target_date} is now protected. Your streak is safe.",
        streak_protected=True
    )


# ============================================================
# UNIQUE BAM! FEATURE — BREATHE! sessions
# ============================================================
@app.post(f"{settings.API_V1_PREFIX}/breathe", response_model=BreatheSessionOut, status_code=201)
def create_breathe_session(
    payload: BreatheSessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a breathing exercise session. Awards XP based on cycles + duration."""
    # XP formula: 5 base + 3 per cycle + 1 per 30s
    xp = 5 + (payload.cycles_completed * 3) + (payload.duration_seconds // 30)
    session = BreatheSession(
        user_id=user.id,
        technique=payload.technique,
        cycles_completed=payload.cycles_completed,
        duration_seconds=payload.duration_seconds,
        calmness_before=payload.calmness_before,
        calmness_after=payload.calmness_after,
        xp_earned=xp,
    )
    db.add(session)
    add_xp(user, xp, db)

    # Bonus: 5th breathe session of the week = award a shield
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    week_count = db.query(func.count(BreatheSession.id)).filter(
        BreatheSession.user_id == user.id,
        BreatheSession.created_at >= week_ago
    ).scalar() or 0
    if (week_count + 1) % 5 == 0:
        award_shield(user, "breathe_milestone",
                     f"{week_count + 1} breathing sessions this week",
                     db, color="green", rarity="rare")

    db.commit()
    db.refresh(session)
    return session


@app.get(f"{settings.API_V1_PREFIX}/breathe", response_model=list[BreatheSessionOut])
def list_breathe_sessions(
    limit: int = Query(30, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(BreatheSession).filter(
        BreatheSession.user_id == user.id
    ).order_by(BreatheSession.created_at.desc()).limit(limit).all()


# ============================================================
# UNIQUE BAM! KPIs — real-time computed
# ============================================================
@app.get(f"{settings.API_V1_PREFIX}/kpis", response_model=KPIOut)
def get_kpis(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get real-time computed KPIs for the current user.

    Returns BAM!'s unique metrics:
    - Momentum Index (MI): streak × focus × completion
    - Avoidance Resistance Score (ARS): how fast you act on tasks
    - Power Level (PL): energy × completion ratio
    - Chain Strength, Shield Reserve, Calm Count Week
    """
    kpis = compute_all_kpis(user, db)
    return KPIOut(**kpis)


@app.get(f"{settings.API_V1_PREFIX}/kpis/history")
def kpi_history(
    days: int = Query(14, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get historical KPI snapshots for trend visualization."""
    cutoff = datetime.now(timezone.utc).date() - timedelta(days=days)
    snapshots = db.query(KPISnapshot).filter(
        KPISnapshot.user_id == user.id,
        KPISnapshot.snapshot_date >= cutoff.isoformat()
    ).order_by(KPISnapshot.snapshot_date.asc()).all()
    return {
        "days": [
            {
                "date": s.snapshot_date,
                "momentum_index": s.momentum_index,
                "avoidance_resistance": s.avoidance_resistance,
                "power_level": s.power_level,
                "chain_strength": s.chain_strength,
                "shield_reserve": s.shield_reserve,
                "calm_count_week": s.calm_count_week,
                "focus_minutes": s.focus_minutes,
                "tasks_completed": s.tasks_completed,
            }
            for s in snapshots
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
