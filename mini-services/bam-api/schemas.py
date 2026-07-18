"""
Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, Any, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=6, max_length=120)
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    username: str
    display_name: Optional[str]
    procrastination_type: str
    xp: int
    level: int
    current_streak: int
    longest_streak: int
    sound_enabled: bool
    theme: str
    onboarding_completed_at: Optional[datetime]
    plan_updated_at: Optional[datetime]
    personalized_plan: dict
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Onboarding ----------
class OnboardingAnswer(BaseModel):
    question_id: str
    option_id: str
    score: dict[str, int] = Field(default_factory=dict)  # {perfectionist: 2, ...}


class OnboardingSubmit(BaseModel):
    answers: list[OnboardingAnswer]
    display_name: Optional[str] = None


# ---------- Tasks ----------
class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    category: str = "general"
    estimated_minutes: int = 25
    due_date: Optional[datetime] = None
    energy_required: int = Field(default=2, ge=1, le=5)
    difficulty: int = Field(default=2, ge=1, le=5)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["pending", "in_progress", "completed", "skipped"]] = None
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = None
    category: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    due_date: Optional[datetime] = None
    breakdown: Optional[list[dict[str, Any]]] = None
    energy_required: Optional[int] = Field(default=None, ge=1, le=5)
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    breakdown: list[dict[str, Any]]
    actual_minutes: int
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    action_word: str


# ---------- Focus Session ----------
class FocusSessionCreate(BaseModel):
    task_id: Optional[int] = None
    session_type: Literal["pomodoro", "short_break", "long_break", "deep_work"] = "pomodoro"
    planned_minutes: int = 25


class FocusSessionUpdate(BaseModel):
    status: Optional[Literal["active", "completed", "abandoned", "paused"]] = None
    actual_minutes: Optional[int] = None
    distractions: Optional[int] = None
    focus_quality: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None


class FocusSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    task_id: Optional[int]
    session_type: str
    status: str
    planned_minutes: int
    actual_minutes: int
    started_at: datetime
    ended_at: Optional[datetime]
    distractions: int
    focus_quality: int
    notes: Optional[str]


# ---------- Mood ----------
class MoodEntryCreate(BaseModel):
    mood_score: int = Field(ge=1, le=5)
    energy_score: int = Field(ge=1, le=5)
    triggers: list[str] = Field(default_factory=list)
    note: Optional[str] = None


class MoodEntryOut(MoodEntryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Achievements ----------
class AchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    title: str
    description: str
    flair: str
    xp_reward: int
    icon_emoji: str
    criteria: dict


class UserAchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    earned_at: datetime
    progress: int
    achievement: AchievementOut


# ---------- AI ----------
class AIBreakdownRequest(BaseModel):
    task_title: str
    task_description: Optional[str] = None
    estimated_minutes: int = 25
    user_procrastination_type: Optional[str] = None


class AIBreakdownResponse(BaseModel):
    substeps: list[dict[str, Any]]
    estimated_minutes_per_step: list[int] = Field(default_factory=list)
    motivational_hook: str
    action_word: str


class AICoachRequest(BaseModel):
    message: str
    context: Optional[dict[str, Any]] = None


class AICoachResponse(BaseModel):
    reply: str
    suggested_actions: list[dict[str, Any]]
    action_word: str


class AIPlanRequest(BaseModel):
    """Trigger generation of a personalized anti-procrastination plan."""


class AIPlanResponse(BaseModel):
    plan: dict[str, Any]
    generated_at: datetime


# ---------- Dashboard ----------
class DashboardOut(BaseModel):
    user: UserOut
    today_tasks: list[TaskOut]
    today_focus_minutes: int
    total_focus_minutes: int
    weekly_focus_minutes: list[dict[str, Any]]  # [{date: 'YYYY-MM-DD', minutes: 0}]
    recent_achievements: list[UserAchievementOut]
    pending_achievements: list[AchievementOut]
    current_mood: Optional[MoodEntryOut]
    streak_data: dict[str, Any]
    motivational_quote: str
