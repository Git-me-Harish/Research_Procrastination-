/**
 * BAM! API client — talks to the Python FastAPI backend via the Caddy gateway.
 * Uses XTransformPort=8001 query param to route to the FastAPI service.
 */

const API_PORT = 8001;
const API_BASE = `/api/v1`;

function apiUrl(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${API_BASE}${path}${sep}XTransformPort=${API_PORT}`;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bam_token");
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("bam_token", token);
  else localStorage.removeItem("bam_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (resp.status === 204) return undefined as T;
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const err = await resp.json();
      detail = err.detail || err.error || detail;
    } catch {}
    throw new Error(detail);
  }
  return resp.json() as Promise<T>;
}

// ---------- Types ----------
export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  procrastination_type: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  sound_enabled: boolean;
  theme: string;
  onboarding_completed_at: string | null;
  plan_updated_at: string | null;
  personalized_plan: Record<string, any>;
  created_at: string;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  estimated_minutes: number;
  actual_minutes: number;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  breakdown: Array<Record<string, any>>;
  energy_required: number;
  difficulty: number;
  action_word: string;
}

export interface FocusSession {
  id: number;
  user_id: number;
  task_id: number | null;
  session_type: "pomodoro" | "short_break" | "long_break" | "deep_work";
  status: "active" | "completed" | "abandoned" | "paused";
  planned_minutes: number;
  actual_minutes: number;
  started_at: string;
  ended_at: string | null;
  distractions: number;
  focus_quality: number;
  notes: string | null;
}

export interface MoodEntry {
  id: number;
  mood_score: number;
  energy_score: number;
  triggers: string[];
  note: string | null;
  created_at: string;
}

export interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  flair: string;
  xp_reward: number;
  icon_emoji: string;
  criteria: Record<string, any>;
}

export interface UserAchievement {
  id: number;
  earned_at: string;
  progress: number;
  achievement: Achievement;
}

export interface Dashboard {
  user: User;
  today_tasks: Task[];
  today_focus_minutes: number;
  total_focus_minutes: number;
  weekly_focus_minutes: Array<{ date: string; minutes: number }>;
  recent_achievements: UserAchievement[];
  pending_achievements: Achievement[];
  current_mood: MoodEntry | null;
  streak_data: { current: number; longest: number; last_active: string | null };
  motivational_quote: string;
}

export interface AIBreakdownResponse {
  substeps: Array<{ title: string; description: string; estimated_minutes: number }>;
  motivational_hook: string;
  action_word: string;
}

export interface AICoachResponse {
  reply: string;
  suggested_actions: Array<{ label: string; action_type: string }>;
  action_word: string;
}

export interface AIPlanResponse {
  plan: Record<string, any>;
  generated_at: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: Array<{ id: string; text: string; scores: Record<string, number> }>;
}

// ---------- Power Chain types ----------
export interface ChainLink {
  id: number;
  title: string;
  position: number;
  is_required: boolean;
  completed_today: boolean;
  last_completed_date: string | null;
  total_completions: number;
  icon_code: string;
  color: string;
}

export interface PowerChain {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  started_at: string;
  broken_at: string | null;
  current_chain_days: number;
  longest_chain_days: number;
  total_completions: number;
  last_completed_date: string | null;
  action_word: string;
  color: string;
  links: ChainLink[];
}

export interface ChainLinkToggleResult {
  link: ChainLink;
  chain_completed_today: boolean;
  chain_broken: boolean;
  xp_earned: number;
  new_shield_earned: { id: number; shield_color: string; rarity: string; source: string } | null;
}

// ---------- Shield types ----------
export interface Shield {
  id: number;
  is_spent: boolean;
  earned_at: string;
  spent_at: string | null;
  spent_for_date: string | null;
  source: string;
  source_detail: string | null;
  shield_color: string;
  rarity: string;
}

// ---------- Breathe types ----------
export interface BreatheSession {
  id: number;
  technique: string;
  cycles_completed: number;
  duration_seconds: number;
  calmness_before: number;
  calmness_after: number;
  xp_earned: number;
  created_at: string;
}

// ---------- KPI types ----------
export interface KPIs {
  momentum_index: number;
  avoidance_resistance: number;
  power_level: number;
  chain_strength: number;
  shield_reserve: number;
  calm_count_week: number;
  focus_minutes_today: number;
  tasks_completed_today: number;
  tasks_created_today: number;
  avg_mood_week: number;
  avg_energy_week: number;
  avg_action_latency_min: number;
  streak_days: number;
  level: number;
  xp: number;
}

// ---------- API ----------
export const api = {
  // Auth
  register: (data: { email: string; username: string; password: string; display_name?: string }) =>
    apiFetch<TokenOut>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiFetch<TokenOut>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => apiFetch<User>("/auth/me"),

  // Onboarding
  getQuiz: () => apiFetch<{ questions: QuizQuestion[] }>("/onboarding/quiz"),
  submitOnboarding: (data: {
    answers: Array<{ question_id: string; option_id: string; score: Record<string, number> }>;
    display_name?: string;
  }) => apiFetch<User>("/onboarding/submit", { method: "POST", body: JSON.stringify(data) }),
  myType: () => apiFetch<{ type: string; info: any; onboarded: boolean }>("/onboarding/my-type"),

  // Tasks
  listTasks: (status?: string, category?: string) =>
    apiFetch<Task[]>(`/tasks${status ? `?status=${status}` : ""}${category ? `${status ? "&" : "?"}category=${category}` : ""}`),
  createTask: (data: any) => apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  getTask: (id: number) => apiFetch<Task>(`/tasks/${id}`),
  updateTask: (id: number, data: any) => apiFetch<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: number) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),

  // Focus sessions
  listSessions: () => apiFetch<FocusSession[]>("/focus-sessions"),
  createSession: (data: any) => apiFetch<FocusSession>("/focus-sessions", { method: "POST", body: JSON.stringify(data) }),
  updateSession: (id: number, data: any) => apiFetch<FocusSession>(`/focus-sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Mood
  listMood: () => apiFetch<MoodEntry[]>("/mood"),
  createMood: (data: any) => apiFetch<MoodEntry>("/mood", { method: "POST", body: JSON.stringify(data) }),

  // Achievements
  listAchievements: () => apiFetch<Achievement[]>("/achievements"),
  myAchievements: () => apiFetch<UserAchievement[]>("/achievements/mine"),
  evaluateAchievements: () => apiFetch<{ newly_earned: any[] }>("/achievements/evaluate", { method: "POST" }),

  // AI
  aiBreakdown: (data: { task_title: string; task_description?: string; estimated_minutes: number; user_procrastination_type?: string }) =>
    apiFetch<AIBreakdownResponse>("/ai/breakdown", { method: "POST", body: JSON.stringify(data) }),
  aiCoach: (data: { message: string; context?: any }) =>
    apiFetch<AICoachResponse>("/ai/coach", { method: "POST", body: JSON.stringify(data) }),
  aiPlan: () => apiFetch<AIPlanResponse>("/ai/plan", { method: "POST", body: JSON.stringify({}) }),
  listAIInteractions: () => apiFetch<any[]>("/ai/interactions"),

  // Dashboard
  dashboard: () => apiFetch<Dashboard>("/dashboard"),

  // Stats
  weeklyStats: () => apiFetch<{ days: any[]; user_xp: number; user_level: number }>("/stats/weekly"),

  // Power Chains
  listChains: () => apiFetch<PowerChain[]>("/chains"),
  createChain: (data: {
    title: string;
    description?: string;
    color: string;
    links: Array<{ title: string; is_required: boolean; icon_code: string; color: string }>;
  }) => apiFetch<PowerChain>("/chains", { method: "POST", body: JSON.stringify(data) }),
  getChain: (id: number) => apiFetch<PowerChain>(`/chains/${id}`),
  deleteChain: (id: number) => apiFetch<void>(`/chains/${id}`, { method: "DELETE" }),
  toggleChainLink: (chainId: number, linkId: number) =>
    apiFetch<ChainLinkToggleResult>(`/chains/${chainId}/links/${linkId}/toggle`, { method: "POST" }),
  restartChain: (id: number) => apiFetch<PowerChain>(`/chains/${id}/restart`, { method: "POST" }),

  // Streak Shields
  listShields: () => apiFetch<Shield[]>("/shields"),
  shieldReserve: () => apiFetch<{ reserve: number }>("/shields/reserve"),
  spendShield: (targetDate: string) =>
    apiFetch<{ success: boolean; shield: Shield | null; message: string; streak_protected: boolean }>(
      "/shields/spend", { method: "POST", body: JSON.stringify({ target_date: targetDate }) }
    ),

  // Breathe sessions
  listBreatheSessions: () => apiFetch<BreatheSession[]>("/breathe"),
  createBreatheSession: (data: {
    technique: "4_7_8" | "box" | "deep_belly";
    cycles_completed: number;
    duration_seconds: number;
    calmness_before: number;
    calmness_after: number;
  }) => apiFetch<BreatheSession>("/breathe", { method: "POST", body: JSON.stringify(data) }),

  // KPIs
  getKPIs: () => apiFetch<KPIs>("/kpis"),
  kpiHistory: (days = 14) => apiFetch<{ days: any[] }>(`/kpis/history?days=${days}`),
};
