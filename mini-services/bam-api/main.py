"""
BAM! Anti-Procrastination Platform — FastAPI Application
"""
import random
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from config import settings
from database import get_db, init_db
from models import (
    User, Task, TaskStatus, TaskPriority, FocusSession, SessionStatus, SessionType,
    MoodEntry, Achievement, UserAchievement, AIInteraction,
    PowerChain, ChainLink, StreakShield, BreatheSession, KPISnapshot,
)
from schemas import (
    UserCreate, UserLogin, UserOut, TokenOut, OnboardingSubmit,
    TaskCreate, TaskUpdate, TaskOut, FocusSessionCreate, FocusSessionUpdate,
    FocusSessionOut, MoodEntryCreate, MoodEntryOut, AchievementOut,
    UserAchievementOut, AIBreakdownRequest, AIBreakdownResponse,
    AICoachRequest, AICoachResponse, AIPlanRequest, AIPlanResponse, DashboardOut,
    ChainCreate, ChainOut, ChainLinkToggleOut,
    ShieldOut, ShieldSpendRequest, ShieldSpendResponse,
    BreatheSessionCreate, BreatheSessionOut,
    KPIOut,
)
from security import (
    hash_password, verify_password, create_access_token, get_current_user
)
from gamification import add_xp, update_streak, evaluate_achievements
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


@app.get(f"{settings.API_V1_PREFIX}/ai/interactions")
def list_ai_interactions(
    limit: int = Query(50, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(AIInteraction).filter(AIInteraction.user_id == user.id).order_by(
        AIInteraction.created_at.desc()
    ).limit(limit).all()


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
