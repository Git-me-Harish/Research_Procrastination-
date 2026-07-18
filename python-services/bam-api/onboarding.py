"""
Onboarding quiz — determines user's procrastination type.
Based on research by Dr. Linda Sapadin's six procrastination styles.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import User, ProcrastinationType
from schemas import OnboardingSubmit


# The six procrastination types (research-based, Dr. Linda Sapadin framework)
QUIZ_QUESTIONS = [
    {
        "id": "q1",
        "text": "When facing a big task, you usually...",
        "options": [
            {"id": "a", "text": "Spend ages polishing tiny details", "scores": {"perfectionist": 2}},
            {"id": "b", "text": "Daydream about the finished result", "scores": {"dreamer": 2}},
            {"id": "c", "text": "Worry it won't be good enough", "scores": {"worrier": 2}},
            {"id": "d", "text": "Wait until the deadline panic kicks in", "scores": {"crisis_maker": 2}},
            {"id": "e", "text": "Feel resentful you have to do it at all", "scores": {"defier": 2}},
            {"id": "f", "text": "Try to do everything at once", "scores": {"overdoer": 2}},
        ],
    },
    {
        "id": "q2",
        "text": "What's the biggest reason you delay?",
        "options": [
            {"id": "a", "text": "It has to be flawless or it's worthless", "scores": {"perfectionist": 2}},
            {"id": "b", "text": "I prefer thinking about it to doing it", "scores": {"dreamer": 2}},
            {"id": "c", "text": "I'm afraid of failure or judgement", "scores": {"worrier": 2}},
            {"id": "d", "text": "I work best under pressure", "scores": {"crisis_maker": 2}},
            {"id": "e", "text": "I don't like being told what to do", "scores": {"defier": 2}},
            {"id": "f", "text": "There's just too much on my plate", "scores": {"overdoer": 2}},
        ],
    },
    {
        "id": "q3",
        "text": "When you DO start, you usually...",
        "options": [
            {"id": "a", "text": "Redo the same part five times", "scores": {"perfectionist": 2}},
            {"id": "b", "text": "Make a beautiful plan, then drift", "scores": {"dreamer": 2}},
            {"id": "c", "text": "Second-guess every choice", "scores": {"worrier": 2}},
            {"id": "d", "text": "Cram furiously at the last hour", "scores": {"crisis_maker": 2}},
            {"id": "e", "text": "Do it your own way, not as asked", "scores": {"defier": 2}},
            {"id": "f", "text": "Multi-task frantically across everything", "scores": {"overdoer": 2}},
        ],
    },
    {
        "id": "q4",
        "text": "Your friends would say you...",
        "options": [
            {"id": "a", "text": "Have impossibly high standards", "scores": {"perfectionist": 2}},
            {"id": "b", "text": "Live in your head a lot", "scores": {"dreamer": 2}},
            {"id": "c", "text": "Worry about everything", "scores": {"worrier": 2}},
            {"id": "d", "text": "Thrive on chaos and adrenaline", "scores": {"crisis_maker": 2}},
            {"id": "e", "text": "Don't follow rules easily", "scores": {"defier": 2}},
            {"id": "f", "text": "Take on too much, all the time", "scores": {"overdoer": 2}},
        ],
    },
    {
        "id": "q5",
        "text": "After procrastinating, you feel...",
        "options": [
            {"id": "a", "text": "Frustrated it wasn't perfect", "scores": {"perfectionist": 2}},
            {"id": "b", "text": "Disappointed you didn't act", "scores": {"dreamer": 2}},
            {"id": "c", "text": "Relieved but anxious about next time", "scores": {"worrier": 2}},
            {"id": "d", "text": "Proud you pulled it off (again)", "scores": {"crisis_maker": 2}},
            {"id": "e", "text": "Guilty but still resistant", "scores": {"defier": 2}},
            {"id": "f", "text": "Exhausted from doing too much", "scores": {"overdoer": 2}},
        ],
    },
    {
        "id": "q6",
        "text": "What helps you MOST when stuck?",
        "options": [
            {"id": "a", "text": "Permission to make it 'good enough'", "scores": {"perfectionist": 2}},
            {"id": "b", "text": "Tiny concrete next step", "scores": {"dreamer": 2}},
            {"id": "c", "text": "Reassurance and small wins", "scores": {"worrier": 2}},
            {"id": "d", "text": "A clear deadline with accountability", "scores": {"crisis_maker": 2}},
            {"id": "e", "text": "Choosing the task yourself", "scores": {"defier": 2}},
            {"id": "f", "text": "Cutting half the to-do list", "scores": {"overdoer": 2}},
        ],
    },
]


TYPE_DESCRIPTIONS = {
    "perfectionist": {
        "title": "The Perfectionist",
        "tagline": "Done is better than perfect.",
        "description": "You hold yourself to impossible standards, which paradoxically makes starting terrifying. "
                       "Your work is excellent when you DO start — the challenge is lowering the bar enough to begin.",
        "color": "#FFD23F",
        "superpower": "Quality & attention to detail",
        "kryptonite": "All-or-nothing thinking",
    },
    "dreamer": {
        "title": "The Dreamer",
        "tagline": "Dreams need legs.",
        "description": "You're a visionary — you see the big picture vividly. But turning dreams into concrete steps "
                       "feels like a chore. You need to translate 'someday' into 'this hour'.",
        "color": "#4361EE",
        "superpower": "Imagination & vision",
        "kryptonite": "Avoiding the mundane steps",
    },
    "worrier": {
        "title": "The Worrier",
        "tagline": "Action kills anxiety.",
        "description": "You care deeply, which makes fear of failure paralyzing. The good news: action is the antidote. "
                       "Small steps rebuild confidence faster than any pep talk.",
        "color": "#FF6B35",
        "superpower": "Conscientiousness & care",
        "kryptonite": "Catastrophic thinking",
    },
    "crisis_maker": {
        "title": "The Crisis-Maker",
        "tagline": "You don't need a fire to move.",
        "description": "You've trained yourself to need adrenaline to start. It works — until it burns you out. "
                       "The next level is learning to generate motivation without manufacturing emergencies.",
        "color": "#FF4757",
        "superpower": "Energy under pressure",
        "kryptonite": "Manufactured urgency",
    },
    "defier": {
        "title": "The Defier",
        "tagline": "Channel your fire into self-chosen wins.",
        "description": "You resist being told what to do — even by yourself. The trick is to reclaim autonomy: "
                       "choose your tasks, define your own success, and turn defiance into drive.",
        "color": "#06D6A0",
        "superpower": "Independence & courage",
        "kryptonite": "Passive resistance to your own goals",
    },
    "overdoer": {
        "title": "The Overdoer",
        "tagline": "Less, but better.",
        "description": "You take on too much, then procrastinate because there's no breathing room. "
                       "Your path forward is ruthless prioritization and protected rest.",
        "color": "#FF69B4",
        "superpower": "Ambition & drive",
        "kryptonite": "Inability to say no",
    },
    "unknown": {
        "title": "The Mystery",
        "tagline": "Let's figure it out together.",
        "description": "We don't have enough info on your style yet. Complete the onboarding quiz to unlock your profile.",
        "color": "#999999",
        "superpower": "Unknown",
        "kryptonite": "Unknown",
    },
}


def score_quiz(answers: OnboardingSubmit) -> tuple[ProcrastinationType, dict]:
    """Tally scores and return top procrastination type + breakdown."""
    scores = {
        "perfectionist": 0, "dreamer": 0, "worrier": 0,
        "crisis_maker": 0, "defier": 0, "overdoer": 0,
    }
    raw = []
    for ans in answers.answers:
        raw.append({"question_id": ans.question_id, "option_id": ans.option_id})
        for k, v in (ans.score or {}).items():
            if k in scores:
                scores[k] += v

    # Pick winner (ties → first by score, then alphabetical for determinism)
    sorted_scores = sorted(scores.items(), key=lambda x: (-x[1], x[0]))
    winner = sorted_scores[0][0] if sorted_scores[0][1] > 0 else "worrier"
    ptype = ProcrastinationType(winner)
    return ptype, {"scores": scores, "ranking": sorted_scores, "raw_answers": raw}


def get_quiz_questions() -> list[dict]:
    return QUIZ_QUESTIONS


def get_type_info(ptype: str | ProcrastinationType) -> dict:
    if isinstance(ptype, ProcrastinationType):
        ptype = ptype.value
    return TYPE_DESCRIPTIONS.get(ptype, TYPE_DESCRIPTIONS["unknown"])


def apply_onboarding(user: User, answers: OnboardingSubmit, db: Session) -> User:
    ptype, breakdown = score_quiz(answers)
    user.procrastination_type = ptype
    user.onboarding_answers = breakdown["raw_answers"]
    user.onboarding_completed_at = datetime.now(timezone.utc)
    if answers.display_name:
        user.display_name = answers.display_name
    db.commit()
    return user
