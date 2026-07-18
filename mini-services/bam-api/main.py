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
    MoodEntry, Achievement, UserAchievement, AIInteraction
)
from schemas import (
    UserCreate, UserLogin, UserOut, TokenOut, OnboardingSubmit,
    TaskCreate, TaskUpdate, TaskOut, FocusSessionCreate, FocusSessionUpdate,
    FocusSessionOut, MoodEntryCreate, MoodEntryOut, AchievementOut,
    UserAchievementOut, AIBreakdownRequest, AIBreakdownResponse,
    AICoachRequest, AICoachResponse, AIPlanRequest, AIPlanResponse, DashboardOut
)
from security import (
    hash_password, verify_password, create_access_token, get_current_user
)
from gamification import add_xp, update_streak, evaluate_achievements
from ai_service import generate_task_breakdown, generate_personalized_plan, ai_coach_chat
from onboarding import get_quiz_questions, get_type_info, apply_onboarding

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
