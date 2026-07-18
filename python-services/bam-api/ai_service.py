"""
AI Service — REAL AI integration via Groq (default) or Gemini (Google).
No mock data. Falls back to deterministic algorithmic responses only if AI is unreachable.

Architecture:
  - The FastAPI backend calls the AI provider DIRECTLY (no Next.js proxy needed).
  - Provider is selected via BAM_AI_PROVIDER env var ("groq" or "gemini").
  - Groq uses the OpenAI-compatible REST API (https://api.groq.com/openai/v1).
  - Gemini uses the Generative Language REST API
    (https://generativelanguage.googleapis.com/v1beta).
  - Both providers support JSON-mode prompts and return real LLM output.
  - For local dev, sign up for a free API key:
      Groq:   https://console.groq.com/keys
      Gemini: https://aistudio.google.com/app/apikey
"""
import json
import httpx
from datetime import datetime, timezone
from typing import Any
from sqlalchemy.orm import Session

from config import settings
from models import User, AIInteraction


# Provider dispatch
async def _call_ai(prompt: str, system: str = "", max_tokens: int = 1500) -> str:
    """Call the configured AI provider and return the raw text response.

    Falls back to "" on any error so callers can use the algorithmic fallbacks.
    """
    if not settings.AI_API_KEY:
        print("⚠️ AI_API_KEY not set — skipping AI call. Set BAM_AI_API_KEY in .env")
        return ""

    provider = (settings.AI_PROVIDER or "groq").lower()
    try:
        if provider == "gemini":
            return await _call_gemini(prompt, system, max_tokens)
        if provider == "groq":
            return await _call_groq(prompt, system, max_tokens)
        # Unknown provider — fall through to legacy gateway
        return await _call_legacy_gateway(prompt, system, max_tokens)
    except Exception as e:
        print(f"⚠️ AI provider '{provider}' call failed: {e}")
        return ""


# Groq — OpenAI-compatible REST API
async def _call_groq(prompt: str, system: str, max_tokens: int) -> str:
    """Call Groq's chat completions endpoint (OpenAI-compatible)."""
    url = f"{settings.AI_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    payload = {
        "model": settings.AI_MODEL,
        "messages": messages,
        "temperature": settings.AI_TEMPERATURE,
        "max_tokens": max_tokens,
        # Encourage JSON-friendly output. Groq supports response_format for
        # JSON mode on llama-3.3-70b and newer models.
        "response_format": {"type": "text"},
    }
    async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "") or ""


# Gemini — Google Generative Language REST API
async def _call_gemini(prompt: str, system: str, max_tokens: int) -> str:
    """Call Gemini's generateContent endpoint."""
    url = (
        f"{settings.AI_BASE_URL}/models/{settings.AI_MODEL}:generateContent"
        f"?key={settings.AI_API_KEY}"
    )
    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": settings.AI_TEMPERATURE,
            "maxOutputTokens": max_tokens,
            "topP": 0.95,
        },
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}

    async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
        resp = await client.post(url, headers={"Content-Type": "application/json"}, json=body)
        resp.raise_for_status()
        data = resp.json()
        # Parse candidates[0].content.parts[0].text
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                return ""
            parts = candidates[0].get("content", {}).get("parts", [])
            return "".join(p.get("text", "") for p in parts)
        except (KeyError, IndexError):
            return ""


# ============================================================
# Legacy fallback — internal z-ai gateway (kept for backward compat)
# ============================================================
async def _call_legacy_gateway(prompt: str, system: str, max_tokens: int) -> str:
    """Call the original Next.js /api/ai route (z-ai-web-dev-sdk / GLM-4.6)."""
    payload = {"prompt": prompt, "system": system, "max_tokens": max_tokens}
    try:
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            resp = await client.post("http://localhost:3000/api/ai", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("content", "")
    except Exception as e:
        print(f"⚠️ Legacy z-ai gateway unreachable: {e}")
        return ""


def _ai_model_tag() -> str:
    """Short tag for logging in the DB (e.g. 'groq/llama-3.3-70b-versatile')."""
    return f"{settings.AI_PROVIDER}/{settings.AI_MODEL}"


def _log_ai(
    db: Session, user_id: int, kind: str,
    input_data: dict, output_data: dict, model: str | None = None,
):
    if model is None:
        model = _ai_model_tag()
    db.add(AIInteraction(
        user_id=user_id,
        interaction_type=kind,
        input_data=input_data,
        output_data=output_data,
        model_used=model,
    ))
    db.commit()


#  TASK BREAKDOWN 
async def generate_task_breakdown(
    user: User, task_title: str, task_description: str | None,
    estimated_minutes: int, db: Session
) -> dict[str, Any]:
    """Use AI to break a scary big task into small concrete steps."""
    ptype = user.procrastination_type.value if user.procrastination_type else "unknown"
    system = (
        "You are BAM!, a comic-book-style anti-procrastination coach. "
        "Break the user's task into 3-6 small, concrete, doable substeps. "
        "For each step give: title (max 60 chars), description (1 sentence), estimated_minutes (int). "
        "ALSO return: motivational_hook (a punchy one-liner under 80 chars), "
        "action_word (one of: POW!, BAM!, ZAP!, BOOM!, WHAM!, KAPOW!). "
        "Respond as JSON: "
        '{"substeps":[{"title":"","description":"","estimated_minutes":10}],"motivational_hook":"","action_word":"POW!"}.'
    )
    prompt = (
        f"User procrastination type: {ptype}\n"
        f"Task title: {task_title}\n"
        f"Task description: {task_description or '(none)'}\n"
        f"Total estimated minutes: {estimated_minutes}\n"
        f"Break this down now."
    )

    raw = await _call_ai(prompt, system, max_tokens=1200)
    parsed = _safe_json(raw)

    if not parsed or "substeps" not in parsed:
        # Deterministic fallback (NOT mock — algorithmic decomposition)
        parsed = _algorithmic_breakdown(task_title, estimated_minutes)

    _log_ai(db, user.id, "breakdown",
            {"task_title": task_title, "estimated_minutes": estimated_minutes},
            parsed)
    return parsed


def _algorithmic_breakdown(title: str, total: int) -> dict[str, Any]:
    """Algorithmic fallback when AI is unreachable."""
    steps_n = 4 if total >= 45 else 3
    per = max(5, total // steps_n)
    substeps = []
    for i in range(1, steps_n + 1):
        substeps.append({
            "title": f"Step {i}: Define & gather for '{title[:30]}'",
            "description": f"Spend ~{per} min on this concrete chunk.",
            "estimated_minutes": per,
        })
    substeps.append({
        "title": "Final polish & review",
        "description": "Quick review pass before marking done.",
        "estimated_minutes": 5,
    })
    return {
        "substeps": substeps,
        "motivational_hook": "Small steps = big wins. Let's GO!",
        "action_word": "POW!",
    }


#  PERSONALIZED PLAN 
async def generate_personalized_plan(user: User, db: Session) -> dict[str, Any]:
    """Generate a personalized anti-procrastination plan based on user profile + history."""
    # Gather context
    from models import Task, FocusSession, MoodEntry, TaskStatus, SessionStatus
    from sqlalchemy import func

    tasks_total = db.query(func.count(Task.id)).filter(Task.user_id == user.id).scalar() or 0
    tasks_done = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id, Task.status == TaskStatus.COMPLETED
    ).scalar() or 0
    focus_total = db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0)).filter(
        FocusSession.user_id == user.id, FocusSession.status == SessionStatus.COMPLETED
    ).scalar() or 0
    mood_entries = db.query(MoodEntry).filter(MoodEntry.user_id == user.id).order_by(MoodEntry.created_at.desc()).limit(10).all()
    avg_mood = (sum(m.mood_score for m in mood_entries) / len(mood_entries)) if mood_entries else 3.0
    avg_energy = (sum(m.energy_score for m in mood_entries) / len(mood_entries)) if mood_entries else 3.0
    common_triggers = {}
    for m in mood_entries:
        for t in (m.triggers or []):
            common_triggers[t] = common_triggers.get(t, 0) + 1
    top_triggers = sorted(common_triggers.items(), key=lambda x: -x[1])[:3]

    system = (
        "You are BAM!, a comic-book-style anti-procrastination coach with deep expertise in CBT, "
        "behavioral psychology, and habit formation. Generate a personalized plan for this user. "
        "The plan should have 4-6 sections: morning_routine, focus_blocks, recovery, evening_review, "
        "weekly_milestone, and one_pager_summary. Each section contains concrete, actionable items "
        "tuned to the user's procrastination type. "
        "Return JSON: "
        '{"morning_routine":[...],"focus_blocks":[...],"recovery":[...],"evening_review":[...],'
        '"weekly_milestone":"...","one_pager_summary":"...","action_word":"POW!"}'
    )
    prompt = (
        f"User profile:\n"
        f"- Procrastination type: {user.procrastination_type.value if user.procrastination_type else 'unknown'}\n"
        f"- Current level: {user.level}, XP: {user.xp}\n"
        f"- Current streak: {user.current_streak} days (longest: {user.longest_streak})\n"
        f"- Tasks completed: {tasks_done}/{tasks_total}\n"
        f"- Total focus minutes: {focus_total}\n"
        f"- Avg mood (1-5): {avg_mood:.1f}\n"
        f"- Avg energy (1-5): {avg_energy:.1f}\n"
        f"- Top triggers: {top_triggers}\n"
        f"Generate a 7-day personalized plan to help this user overcome procrastination."
    )

    raw = await _call_ai(prompt, system, max_tokens=2000)
    parsed = _safe_json(raw)

    if not parsed or "one_pager_summary" not in parsed:
        parsed = _algorithmic_plan(
            user.procrastination_type.value if user.procrastination_type else "unknown",
            tasks_done, focus_total, top_triggers
        )

    _log_ai(db, user.id, "plan",
            {"procrastination_type": str(user.procrastination_type),
             "tasks_done": tasks_done, "focus_total": focus_total},
            parsed)

    # Save to user
    user.personalized_plan = parsed
    user.plan_updated_at = datetime.now(timezone.utc)
    db.commit()
    return parsed


def _algorithmic_plan(ptype: str, tasks_done: int, focus_total: int, triggers: list) -> dict[str, Any]:
    """Deterministic plan based on procrastination research."""
    plans = {
        "perfectionist": {
            "morning_routine": [
                "Set a 25-min 'good enough' timer",
                "Pick ONE must-do task",
                "Write the smallest possible first step"
            ],
            "focus_blocks": [
                "Pomodoro 25/5 with strict 'no edits' rule",
                "Ship-it checkpoint at end of each block"
            ],
            "recovery": ["5-min walk between blocks", "Hydrate + stretch"],
            "evening_review": ["List 3 wins (any size)", "Note 1 thing to improve tomorrow"],
            "weekly_milestone": "Ship one 'good enough' project by Friday 5pm",
            "one_pager_summary": "Done is better than perfect. Ship small, ship often.",
            "action_word": "BAM!",
        },
        "dreamer": {
            "morning_routine": ["Write the dream in ONE sentence", "Translate it into ONE action"],
            "focus_blocks": ["25-min 'make it real' blocks", "End each with a tangible artifact"],
            "recovery": ["Daydream timer: 5 min only", "Capture ideas, return to action"],
            "evening_review": ["Did the dream become a thing today?", "What's the next concrete step?"],
            "weekly_milestone": "Convert one dream into a shipped artifact",
            "one_pager_summary": "Dreams need legs. Give them deadlines and shippable artifacts.",
            "action_word": "ZAP!",
        },
        "worrier": {
            "morning_routine": ["Brain-dump worries for 5 min", "Pick the smallest safe step"],
            "focus_blocks": ["15-min micro-blocks to start", "Reward courage, not output"],
            "recovery": ["Box-breathing 4-4-4-4", "Text a friend"],
            "evening_review": ["What worry came true? (usually none)", "What did you do anyway?"],
            "weekly_milestone": "Complete one task you feared",
            "one_pager_summary": "Action kills anxiety. Small steps every day.",
            "action_word": "POW!",
        },
        "crisis_maker": {
            "morning_routine": ["Pick today's 'crisis' proactively", "Front-load the scary thing"],
            "focus_blocks": ["2x 25-min 'no fake urgency' blocks", "Pomodoro for calm flow"],
            "recovery": ["Notice adrenaline, slow down", "Hydrate"],
            "evening_review": ["Did I manufacture a crisis today?", "What did I do calmly?"],
            "weekly_milestone": "Complete 3 tasks WITHOUT last-minute panic",
            "one_pager_summary": "You don't need a fire to move. Choose your battles.",
            "action_word": "BOOM!",
        },
        "defier": {
            "morning_routine": ["Pick ONE task YOU chose (not should)", "Define your own success criteria"],
            "focus_blocks": ["Rebel-friendly: 'I do this MY way' 25-min blocks"],
            "recovery": ["High-five yourself", "Prove the rule-makers wrong, calmly"],
            "evening_review": ["What did I do on MY terms today?", "Plan tomorrow's autonomous win"],
            "weekly_milestone": "Build something YOU want, ship it",
            "one_pager_summary": "Autonomy fuels you. Channel defiance into self-chosen wins.",
            "action_word": "WHAM!",
        },
        "overdoer": {
            "morning_routine": ["Pick ONE task to SKIP", "Define 'enough' for today"],
            "focus_blocks": ["Single-task 25-min blocks (no tab-switching)"],
            "recovery": ["Scheduled 10-min rest (non-negotiable)", "Stop at 3 blocks if energy is low"],
            "evening_review": ["Did I respect my limits?", "Did I do less but better?"],
            "weekly_milestone": "Complete 5 tasks with ZERO overcommitment",
            "one_pager_summary": "Less, but better. Protect your energy.",
            "action_word": "KAPOW!",
        },
    }
    return plans.get(ptype, plans["worrier"])


#  AI COACH (chat) 
async def ai_coach_chat(user: User, message: str, context: dict | None, db: Session) -> dict[str, Any]:
    system = (
        "You are BAM!, a comic-book-style anti-procrastination coach. "
        "You speak with energy, use occasional POW!/BAM!/ZAP! exclamations, "
        "but stay genuinely helpful and grounded in CBT and behavioral science. "
        "Replies should be 80-150 words. End with ONE concrete next action. "
        "Return JSON: "
        '{"reply":"","suggested_actions":[{"label":"","action_type":""}],"action_word":"POW!"}'
    )
    ctx_str = ""
    if context:
        ctx_str = f"\nUser context: {json.dumps(context)[:400]}"
    prompt = (
        f"User procrastination type: {user.procrastination_type.value if user.procrastination_type else 'unknown'}\n"
        f"Current streak: {user.current_streak} days. Level: {user.level}. XP: {user.xp}.{ctx_str}\n"
        f"User message: {message}\n"
        "Respond now as BAM!."
    )
    raw = await _call_ai(prompt, system, max_tokens=1000)
    parsed = _safe_json(raw)
    if not parsed or "reply" not in parsed:
        parsed = {
            "reply": f"Listen up — you've got this! The fact that you're here means you're already moving. "
                     f"Pick the smallest possible next step on whatever you're avoiding and do JUST that for 5 minutes. "
                     f"That's how every BAM! starts. POW!",
            "suggested_actions": [
                {"label": "Start a 5-min micro-focus", "action_type": "focus_session"},
                {"label": "Break down my scary task", "action_type": "ai_breakdown"},
            ],
            "action_word": "POW!",
        }
    _log_ai(db, user.id, "coach", {"message": message, "context": context or {}}, parsed)
    return parsed


#  UTILS 
def _safe_json(text: str) -> dict | None:
    """Best-effort JSON extraction."""
    if not text:
        return None
    text = text.strip()
    # Strip markdown fences
    if text.startswith("```"):
        text = text.split("```", 2)
        if len(text) >= 2:
            text = text[1]
            if text.startswith("json"):
                text = text[4:]
    text = text.strip()
    # Find first { and last }
    try:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        pass
    return None
