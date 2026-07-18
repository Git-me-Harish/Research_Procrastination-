# BAM! — Beat Avoidance Mode

> A comic-book-style anti-procrastination platform that helps students and professionals
> beat avoidance, build focus habits, and track real progress over time. POW! BAM! ZAP!

![BAM! Logo](public/bam-logo.svg)

## What is BAM!?

BAM! is a full-stack web application built to help people who struggle with procrastination.
Instead of just another to-do list, BAM! uses a comic-book aesthetic with bold colors,
speech bubbles, action words (POW! BAM! ZAP!), sound effects, and gamification to make
overcoming procrastination feel like a hero's journey.

### Core Features

- **Procrastination Type Quiz** — Research-based (Dr. Linda Sapadin's 6 styles) onboarding
  that identifies whether you're a Perfectionist, Dreamer, Worrier, Crisis-Maker, Defier,
  or Overdoer. Your type drives everything else.
- **AI-Powered Personalized Plan** — Real LLM (GLM-4.6) generates a 7-day plan tailored
  to your procrastination type, your activity history, your mood patterns, and your triggers.
  No two plans are the same.
- **AI Task Breakdown** — Got a scary big task? BAM!'s AI breaks it into 3-6 small,
  concrete, doable substeps with time estimates and a motivational hook.
- **AI Coach Chat** — A real chatbot that responds to "I'm avoiding my homework" with
  CBT-grounded, comic-book-flavored coaching.
- **Comic-Style Focus Timer** — Pomodoro, short break, long break, and deep work modes.
  Each mode has its own color, emoji, and sound effects. Distraction tracking built in.
- **Gamification** — XP, levels, streaks, and 12 comic-style achievements (First BAM!,
  Triple Threat, Week Warrior, Focus Master, etc.) with real rewards.
- **Mood & Energy Tracking** — Log your mood, energy, and procrastination triggers.
  Patterns emerge over time to reveal your personal pitfalls.
- **Dashboard** — One-glance view of today's missions, weekly focus chart, recent trophies,
  current mood, motivational quote, and your procrastination type.
- **Sound Effects** — Procedurally generated comic-book sounds (POW!, BAM!, ZAP!, BOOM!,
  WHAM!) for every interaction. No audio files needed — pure Web Audio API.
- **Comic UI** — Bold black outlines, halftone dot patterns, vibrant primary colors,
  speech bubbles, starbursts, burst rays, action words, and playful typography (Bangers,
  Bungee, Comic Neue fonts).

## Tech Stack

### Frontend
- **Next.js 16** with App Router + TypeScript 5
- **Tailwind CSS 4** with custom comic-style design system
- **shadcn/ui** component library (heavily customized for comic style)
- **Zustand** for state management
- **Web Audio API** for procedural sound effects
- **Google Fonts**: Bangers, Bungee, Comic Neue, Inter

### Backend (Python — strict requirement)
- **FastAPI** — High-performance async web framework
- **SQLAlchemy 2.0** — ORM with declarative models
- **SQLite** — File-based database (Windows-friendly, no server needed)
- **Pydantic v2** — Type-safe request/response validation
- **python-jose + passlib** — JWT auth + sha256_crypt password hashing
- **uvicorn** — ASGI server

### AI Integration
- **Real LLM** via z-ai-web-dev-sdk (GLM-4.6 model) — no mock data, ever
- The Python FastAPI backend calls a Next.js API gateway route which uses
  z-ai-web-dev-sdk to talk to the real GLM-4.6 model
- **To switch to Gemini/Groq/HuggingFace**: Edit `mini-services/bam-api/ai_service.py`
  and replace the `_call_ai` function with a direct call to your preferred SDK.
  Instructions are in the file.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│  Next.js 16 Frontend (port 3000 in dev)                      │
│  - Comic-style UI                                           │
│  - Zustand state (auth, sound prefs)                        │
│  - Web Audio API for sounds                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP requests with ?XTransformPort=8001
                 │ (Caddy gateway routes these to FastAPI)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Caddy Gateway (port 81 in dev)                  │
│  - Routes /  → Next.js (port 3000)                          │
│  - Routes ?XTransformPort=N → port N                        │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────────────────────────────────┐
│  Next.js     │  │  FastAPI Backend (port 8001)              │
│  (port 3000) │  │  - SQLAlchemy ORM + SQLite                │
│              │  │  - JWT Auth                               │
│  - /api/ai   │  │  - Gamification engine                    │
│    (AI       │  │  - Achievement evaluation                 │
│     gateway  │  │  - Procrastination quiz scoring           │
│     using    │  │  - XP/Level/Streak tracking               │
│     z-ai-web │  │  - Calls /api/ai on Next.js for AI tasks  │
│     -dev-sdk)│  │                                           │
└──────────────┘  └──────────────────────────────────────────┘
```

## Project Structure

```
my-project/
├── src/                              # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx                # Root layout with comic fonts
│   │   ├── page.tsx                  # Main page (renders BamApp)
│   │   ├── globals.css               # Comic-style design system
│   │   └── api/
│   │       └── ai/
│   │           └── route.ts          # AI gateway (real GLM-4.6)
│   ├── components/
│   │   └── comic/
│   │       ├── bam-app.tsx           # Main app router (view state)
│   │       ├── bam-shell.tsx         # App layout + nav
│   │       ├── bam-logo.tsx          # Comic logo component
│   │       ├── auth-screen.tsx       # Login/register
│   │       ├── onboarding-flow.tsx   # Procrastination quiz
│   │       ├── bam-dashboard.tsx     # Hero HQ
│   │       ├── task-manager.tsx      # Tasks + AI breakdown
│   │       ├── focus-timer.tsx       # Pomodoro timer
│   │       ├── ai-coach.tsx          # Chat with BAM! AI
│   │       ├── personalized-plan.tsx # AI-generated plan
│   │       ├── achievements-gallery.tsx
│   │       ├── mood-checkin.tsx
│   │       └── comic-ui.tsx          # Reusable comic components
│   └── lib/
│       ├── api.ts                    # FastAPI client
│       ├── store.ts                  # Zustand store
│       ├── sounds.ts                 # Web Audio sound effects
│       └── utils.ts
├── mini-services/
│   └── bam-api/                      # Python FastAPI backend
│       ├── main.py                   # FastAPI app + all routes
│       ├── models.py                 # SQLAlchemy models
│       ├── schemas.py                # Pydantic schemas
│       ├── database.py               # DB setup + achievement seeding
│       ├── security.py               # JWT + password hashing
│       ├── gamification.py           # XP, levels, streaks, achievements
│       ├── ai_service.py             # Real AI integration
│       ├── onboarding.py             # Quiz questions + scoring
│       ├── config.py                 # Settings (env-driven)
│       ├── requirements.txt
│       ├── package.json              # For `bun run dev` compatibility
│       └── data/
│           └── bam.db                # SQLite database (auto-created)
├── public/
│   └── bam-logo.svg                  # Comic logo
└── scripts/
    └── start-bam-api.sh              # Helper to start FastAPI
```

---

## Running on Windows

This project is designed to run on Windows. Follow these steps:

### Prerequisites

1. **Python 3.11+** — Download from https://python.org
   - During install, check "Add Python to PATH"
2. **Node.js 20+** — Download from https://nodejs.org
3. **Bun** (optional but recommended) — `npm install -g bun`
   - Or just use `npm` instead of `bun` in commands below

### Setup Steps

#### 1. Clone the project

```powershell
# In PowerShell or Command Prompt
cd C:\Users\YourName\Projects
# Copy the project files here
```

#### 2. Install Python dependencies

```powershell
cd mini-services\bam-api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Install Node.js dependencies

```powershell
cd C:\Users\YourName\Projects\my-project
npm install
# or: bun install
```

#### 4. Initialize the database

```powershell
cd mini-services\bam-api
python -c "from database import init_db; init_db()"
```

This creates `mini-services\bam-api\data\bam.db` (SQLite file).

#### 5. Start the FastAPI backend

Open a new terminal:

```powershell
cd C:\Users\YourName\Projects\my-project\mini-services\bam-api
venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Backend runs at http://localhost:8001

#### 6. Start the Next.js frontend

Open another terminal:

```powershell
cd C:\Users\YourName\Projects\my-project
npm run dev
# or: bun run dev
```

Frontend runs at http://localhost:3000

#### 7. Open the app

Visit http://localhost:3000 in your browser.

> **Note**: On Windows, you don't need Caddy. The Next.js dev server proxies
> API requests to FastAPI via the `XTransformPort` query parameter using
> Next.js's built-in rewrites. Add this to `next.config.ts`:
>
> ```ts
> async rewrites() {
>   return [
>     {
>       source: '/api/v1/:path*',
>       destination: 'http://localhost:8001/api/v1/:path*',
>     },
>   ];
> }
> ```
>
> Then remove the `XTransformPort` logic from `src/lib/api.ts` (just use
> plain `/api/v1/...` URLs).

### Environment Variables (Optional)

Create `mini-services/bam-api/.env` to override defaults:

```env
BAM_SECRET_KEY=your-super-secret-jwt-key-change-me
BAM_DATABASE_URL=sqlite:///C:/Users/YourName/Projects/my-project/mini-services/bam-api/data/bam.db
BAM_AI_SERVICE_URL=http://localhost:3000/api/ai
```

### Switching to Gemini / Groq / HuggingFace

The AI is currently routed through the Next.js gateway using z-ai-web-dev-sdk
(real GLM-4.6 model). To switch to a direct Python integration:

1. Install the Python SDK:
   ```powershell
   pip install google-generativeai  # for Gemini
   # OR
   pip install groq                  # for Groq
   # OR
   pip install transformers torch    # for HuggingFace
   ```

2. Edit `mini-services/bam-api/ai_service.py` and replace the `_call_ai` function:

   ```python
   # Example for Gemini
   import google.generativeai as genai
   genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

   async def _call_ai(prompt: str, system: str = "", max_tokens: int = 1500) -> str:
       model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system)
       response = model.generate_content(prompt)
       return response.text
   ```

3. Set the API key in `.env`:
   ```env
   GEMINI_API_KEY=your-gemini-key
   ```

### Production Deployment

For production on Windows:

1. **Build the Next.js app**:
   ```powershell
   npm run build
   npm start
   ```

2. **Run FastAPI with multiple workers** (using gunicorn-equivalent):
   ```powershell
   pip install uvicorn[standard]
   uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
   ```

3. **Use a production database** (optional — SQLite is fine for most cases):
   - Install PostgreSQL: https://postgresql.org
   - Update `BAM_DATABASE_URL` in `.env`:
     ```env
     BAM_DATABASE_URL=postgresql://user:pass@localhost:5432/bam
     ```
   - Install psycopg2: `pip install psycopg2-binary`

4. **Use a reverse proxy** (IIS, nginx, or Caddy for Windows):
   - Route `/` to Next.js (port 3000)
   - Route `/api/v1/*` to FastAPI (port 8001)
   - Route `/api/ai` to Next.js (port 3000)

## File Paths

All paths in this project use forward slashes (`/`) which work on both Windows and Linux.
The database file is created at:
- **Windows**: `C:\Users\YourName\Projects\my-project\mini-services\bam-api\data\bam.db`
- **Linux/Mac**: `/home/user/projects/my-project/mini-services/bam-api/data/bam.db`

The `data/` folder is auto-created on first run.

## API Reference

### Authentication
- `POST /api/v1/auth/register` — Register a new user
- `POST /api/v1/auth/login` — Login (returns JWT)
- `GET /api/v1/auth/me` — Get current user

### Onboarding
- `GET /api/v1/onboarding/quiz` — Get the 6 procrastination-type questions
- `POST /api/v1/onboarding/submit` — Submit answers, get type assigned
- `GET /api/v1/onboarding/my-type` — Get user's type + description

### Tasks
- `GET /api/v1/tasks` — List tasks (filter by status, category)
- `POST /api/v1/tasks` — Create task
- `GET /api/v1/tasks/{id}` — Get single task
- `PATCH /api/v1/tasks/{id}` — Update task (status, breakdown, etc.)
- `DELETE /api/v1/tasks/{id}` — Delete task

### Focus Sessions
- `GET /api/v1/focus-sessions` — List sessions
- `POST /api/v1/focus-sessions` — Start a session
- `PATCH /api/v1/focus-sessions/{id}` — Update (complete, abandon, etc.)

### Mood
- `GET /api/v1/mood` — List mood entries
- `POST /api/v1/mood` — Create mood entry

### Achievements
- `GET /api/v1/achievements` — List all achievements
- `GET /api/v1/achievements/mine` — User's earned achievements
- `POST /api/v1/achievements/evaluate` — Re-evaluate (auto-runs on task complete)

### AI
- `POST /api/v1/ai/breakdown` — AI task breakdown
- `POST /api/v1/ai/coach` — AI coach chat
- `POST /api/v1/ai/plan` — Generate personalized plan
- `GET /api/v1/ai/interactions` — Log of past AI interactions

### Dashboard & Stats
- `GET /api/v1/dashboard` — All dashboard data in one call
- `GET /api/v1/stats/weekly` — Weekly focus + mood stats

## Research Foundation

The procrastination type framework is based on **Dr. Linda Sapadin's** book
"It's About Time!" which identifies six procrastination styles:

1. **The Perfectionist** — Sets impossibly high standards, fears flawed work
2. **The Dreamer** — Big vision, avoids mundane execution steps
3. **The Worrier** — Fear of failure paralyzes action
4. **The Crisis-Maker** — Manufactures urgency to feel alive
5. **The Defier** — Resists being told what to do (even by self)
6. **The Overdoer** — Takes on too much, can't prioritize

The AI plans incorporate techniques from:
- **Cognitive Behavioral Therapy (CBT)** — Reframing catastrophic thoughts
- **Behavioral Psychology** — Habit formation, streak tracking, micro-steps
- **Self-Compassion Research** — Dr. Kristin Neff's work on self-kindness
- **Implementation Intentions** — Peter Gollwitzer's "if-then" planning
- **Pomodoro Technique** — Francesco Cirillo's time-boxing method

## License

MIT License — feel free to use this for your own anti-procrastination journey!

## Credits

Built with POW! by the BAM! Team.
Comic-style UI inspired by classic comic books and modern web comic design.
