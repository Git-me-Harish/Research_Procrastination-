"""
Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, Any, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict


#  Auth 
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


#  Profile update + summary 
class UserUpdate(BaseModel):
    """Partial update for the current user's profile."""
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    sound_enabled: Optional[bool] = None
    theme: Optional[str] = Field(default=None, min_length=1, max_length=40)


class ProfileActivityItem(BaseModel):
    """A single entry in the user's recent activity feed."""
    kind: str               # task_completed | focus_session | mood_logged | breathe_session | chain_completed | shield_earned | achievement_earned | ai_interaction
    title: str
    detail: Optional[str] = None
    timestamp: datetime
    xp: int = 0


class ProfileSummary(BaseModel):
    """Aggregated profile data for the Profile view."""
    user: UserOut
    # Level progress
    level: int
    xp: int
    xp_into_level: int          # XP earned since reaching current level
    xp_for_next_level: int      # total XP needed to advance from current level to next
    xp_to_next_level: int       # remaining XP to next level
    next_level: int
    progress_pct: float         # 0-100 progress within current level

    # Lifetime totals
    total_tasks: int
    tasks_completed: int
    tasks_pending: int
    total_focus_minutes: int
    total_focus_sessions: int
    total_breathe_sessions: int
    total_breathe_minutes: int
    total_chains: int
    total_chain_completions: int
    longest_chain: int
    total_shields_earned: int
    total_shields_spent: int
    achievements_earned: int
    achievements_total: int
    mood_entries: int
    ai_interactions: int
    member_since: datetime
    days_active: int             # distinct dates with any activity

    # Procrastination profile
    procrastination_type: str
    onboarding_completed_at: Optional[datetime]

    # Recent activity (last 15 across all sources)
    recent_activity: list[ProfileActivityItem]


#  Onboarding 
class OnboardingAnswer(BaseModel):
    question_id: str
    option_id: str
    score: dict[str, int] = Field(default_factory=dict)  # {perfectionist: 2, ...}


class OnboardingSubmit(BaseModel):
    answers: list[OnboardingAnswer]
    display_name: Optional[str] = None


#  Tasks 
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


#  Focus Session 
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


#  Mood 
class MoodEntryCreate(BaseModel):
    mood_score: int = Field(ge=1, le=5)
    energy_score: int = Field(ge=1, le=5)
    triggers: list[str] = Field(default_factory=list)
    note: Optional[str] = None


class MoodEntryOut(MoodEntryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


#  Achievements 
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


#  AI 
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


class AIInteractionOut(BaseModel):
    """Serialized AIInteraction row — used for the coach history feed."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    interaction_type: str
    input_data: dict[str, Any]
    output_data: dict[str, Any]
    model_used: str
    created_at: datetime


#  Dashboard 
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

#  Power Chain 
class ChainLinkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    is_required: bool = True
    icon_code: str = "bolt"
    color: str = "yellow"


class ChainLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    position: int
    is_required: bool
    completed_today: bool
    last_completed_date: Optional[str]
    total_completions: int
    icon_code: str
    color: str


class ChainCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None
    color: str = "yellow"
    links: list[ChainLinkCreate] = Field(default_factory=list, max_length=10)


class ChainOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: Optional[str]
    is_active: bool
    started_at: datetime
    broken_at: Optional[datetime]
    current_chain_days: int
    longest_chain_days: int
    total_completions: int
    last_completed_date: Optional[str]
    action_word: str
    color: str
    links: list[ChainLinkOut]


class ChainLinkToggleOut(BaseModel):
    link: ChainLinkOut
    chain_completed_today: bool
    chain_broken: bool
    xp_earned: int
    new_shield_earned: Optional[dict[str, Any]] = None


#  Streak Shield 
class ShieldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_spent: bool
    earned_at: datetime
    spent_at: Optional[datetime]
    spent_for_date: Optional[str]
    source: str
    source_detail: Optional[str]
    shield_color: str
    rarity: str


class ShieldSpendRequest(BaseModel):
    target_date: str  # YYYY-MM-DD to protect


class ShieldSpendResponse(BaseModel):
    success: bool
    shield: Optional[ShieldOut] = None
    message: str
    streak_protected: bool


#  Breathe Sessions 
class BreatheSessionCreate(BaseModel):
    technique: Literal["4_7_8", "box", "deep_belly"] = "4_7_8"
    cycles_completed: int = Field(default=1, ge=1, le=20)
    duration_seconds: int = Field(default=60, ge=10, le=3600)
    calmness_before: int = Field(default=3, ge=1, le=5)
    calmness_after: int = Field(default=3, ge=1, le=5)


class BreatheSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    technique: str
    cycles_completed: int
    duration_seconds: int
    calmness_before: int
    calmness_after: int
    xp_earned: int
    created_at: datetime


#  KPIs 
class KPIOut(BaseModel):
    """Real-time computed KPIs for the current user."""
    momentum_index: float          # 0-100 (streak × focus × completion)
    avoidance_resistance: float    # 0-100 (lower latency = higher)
    power_level: float             # 0-100 (energy × completion ratio)
    chain_strength: int            # longest active chain
    shield_reserve: int            # unspent shields
    calm_count_week: int           # breathing sessions this week
    # Underlying
    focus_minutes_today: int
    tasks_completed_today: int
    tasks_created_today: int
    avg_mood_week: float
    avg_energy_week: float
    avg_action_latency_min: float
    streak_days: int
    level: int
    xp: int
