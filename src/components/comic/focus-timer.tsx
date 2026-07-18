"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { api, type Task, type FocusSession as FocusSessionType } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge, BurstRays,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";

type Mode = "pomodoro" | "short_break" | "long_break" | "deep_work";

const MODES: Record<Mode, { label: string; minutes: number; color: string; emoji: string }> = {
  pomodoro:    { label: "POW-er Pomodoro",  minutes: 25, color: "#FF4757", emoji: "💥" },
  short_break: { label: "Quick ZAP Break",  minutes: 5,  color: "#06D6A0", emoji: "⚡" },
  long_break:  { label: "Big BAM Break",    minutes: 15, color: "#4361EE", emoji: "🌟" },
  deep_work:   { label: "Deep BOOM Work",   minutes: 50, color: "#FF6B35", emoji: "🧠" },
};

export function FocusTimer() {
  const { user, refreshUser } = useBamStore();
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(MODES.pomodoro.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<FocusSessionType | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialSeconds = MODES[mode].minutes * 60;

  // Load pending tasks
  useEffect(() => {
    api.listTasks("pending").then(setTasks).catch(() => {});
  }, []);

  // Timer tick — only decrements, doesn't call handleComplete
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
        if (secondsLeft <= 4 && secondsLeft > 0) {
          playSound("tick");
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  // Watch for timer completion
  useEffect(() => {
    if (secondsLeft === 0 && isRunning && currentSession) {
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isRunning, currentSession]);


  const handleModeChange = (newMode: Mode) => {
    if (isRunning) {
      toast.info("Pause current session first!");
      return;
    }
    playSound("pop");
    setMode(newMode);
    setSecondsLeft(MODES[newMode].minutes * 60);
  };

  const handleStart = async () => {
    playSound("bam");
    try {
      const session = await api.createSession({
        task_id: selectedTaskId,
        session_type: mode,
        planned_minutes: MODES[mode].minutes,
      });
      setCurrentSession(session);
      setIsRunning(true);
      toast.success(`${MODES[mode].label} started! ${MODES[mode].emoji} GO!`);
    } catch (err: any) {
      playSound("error");
      toast.error(err.message);
    }
  };

  const handlePause = () => {
    playSound("whoosh");
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleResume = () => {
    playSound("pop");
    setIsRunning(true);
  };

  const handleComplete = async () => {
    if (!currentSession) return;
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    playSound("achievement");

    const actualMinutes = MODES[mode].minutes;
    try {
      await api.updateSession(currentSession.id, {
        status: "completed",
        actual_minutes: actualMinutes,
        distractions,
        focus_quality: 4,
      });
      setCompletedToday(completedToday + 1);
      toast.success(`BOOM! Session complete! +${actualMinutes * 2} XP 💥`);
      playSound("levelup");
      refreshUser();
      // Reset
      setCurrentSession(null);
      setSecondsLeft(MODES[mode].minutes * 60);
      setDistractions(0);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAbandon = async () => {
    if (!currentSession) return;
    playSound("wham");
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await api.updateSession(currentSession.id, {
        status: "abandoned",
        actual_minutes: Math.max(0, Math.floor((initialSeconds - secondsLeft) / 60)),
        distractions,
      });
      toast.info("Session abandoned. No XP — but try again!");
      setCurrentSession(null);
      setSecondsLeft(MODES[mode].minutes * 60);
      setDistractions(0);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDistraction = () => {
    playSound("error");
    setDistractions(d => d + 1);
    toast.warning("Distraction logged! Re-focus 💪");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = ((initialSeconds - secondsLeft) / initialSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <ActionWord word="FOCUS ZONE!" color="blue" size="lg" />
        <p className="font-comic-neue font-bold text-sm mt-1">
          Pick a mode, hit start, and let the POW-er flow!
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`p-3 border-2 border-black rounded-lg font-bangers text-sm transition-all ${
              mode === m ? "shadow-[3px_3px_0_#0A0A0A] -translate-y-0.5" : "bg-white hover:-translate-y-0.5"
            }`}
            style={{ background: mode === m ? MODES[m].color : "#FFFFFF", color: mode === m ? "#0A0A0A" : "#0A0A0A" }}
          >
            <div className="text-2xl">{MODES[m].emoji}</div>
            <div className="mt-1">{MODES[m].label}</div>
            <div className="text-xs font-comic-neue">{MODES[m].minutes} min</div>
          </button>
        ))}
      </div>

      {/* Timer */}
      <ComicPanel color="white" className="relative overflow-hidden">
        <BurstRays animate className="opacity-15" />
        <div className="relative">
          {/* Circular timer */}
          <div className="flex justify-center my-6">
            <div className="relative w-72 h-72">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
                <circle
                  cx="140" cy="140" r="120"
                  fill="#FFF8DC"
                  stroke="#0A0A0A"
                  strokeWidth="8"
                />
                <circle
                  cx="140" cy="140" r="120"
                  fill="none"
                  stroke={MODES[mode].color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl">{MODES[mode].emoji}</div>
                <div className="font-bangers text-6xl mt-1" style={{ color: MODES[mode].color }}>
                  {formatTime(secondsLeft)}
                </div>
                <div className="font-comic-neue text-sm font-bold uppercase">
                  {isRunning ? "🔥 FOCUSING" : currentSession ? "PAUSED" : "READY"}
                </div>
              </div>
            </div>
          </div>

          {/* Task selector */}
          {!currentSession && (
            <div className="mb-4">
              <label className="font-bangers text-lg block mb-1">Linked Mission (optional)</label>
              <select
                value={selectedTaskId || ""}
                onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                className="comic-input"
              >
                <option value="">No specific task — just focus</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-2 flex-wrap">
            {!isRunning && !currentSession && (
              <ComicButton color="red" size="lg" sound="bam" onClick={handleStart}>
                {MODES[mode].emoji} START!
              </ComicButton>
            )}
            {isRunning && (
              <>
                <ComicButton color="yellow" size="lg" sound="whoosh" onClick={handlePause}>
                  ⏸ Pause
                </ComicButton>
                <ComicButton color="orange" size="lg" sound="error" onClick={handleDistraction}>
                  😵 Distracted
                </ComicButton>
              </>
            )}
            {!isRunning && currentSession && (
              <>
                <ComicButton color="green" size="lg" sound="pop" onClick={handleResume}>
                  ▶ Resume
                </ComicButton>
                <ComicButton color="red" size="lg" sound="achievement" onClick={handleComplete}>
                  ✓ Complete Early
                </ComicButton>
                <ComicButton color="white" size="lg" sound="wham" onClick={handleAbandon}>
                  ✕ Abandon
                </ComicButton>
              </>
            )}
          </div>

          {/* Stats */}
          {(currentSession || completedToday > 0) && (
            <div className="flex justify-center gap-4 mt-4">
              <ComicBadge color="blue">Sessions today: {completedToday}</ComicBadge>
              {currentSession && <ComicBadge color="orange">Distractions: {distractions}</ComicBadge>}
            </div>
          )}
        </div>
      </ComicPanel>

      {/* Tips */}
      <div className="grid md:grid-cols-2 gap-3">
        <SpeechBubble color="yellow" tilt="left">
          <p className="font-comic-neue font-bold text-black">
            💡 Pro tip: Silence your phone, close unnecessary tabs, and commit fully.
            Even 5 minutes of pure focus beats 25 minutes of half-focus!
          </p>
        </SpeechBubble>
        {user?.procrastination_type && (
          <SpeechBubble color="white" tilt="right">
            <p className="font-comic-neue font-bold text-black">
              🦸 For your <strong>{user.procrastination_type.replace("_", " ")}</strong> type:
              {" "}
              {user.procrastination_type === "perfectionist" && "Done is better than perfect — ship it!"}
              {user.procrastination_type === "dreamer" && "Make it tangible. Ship something real."}
              {user.procrastination_type === "worrier" && "Small steps. You've got this."}
              {user.procrastination_type === "crisis_maker" && "No fake urgency needed. Just flow."}
              {user.procrastination_type === "defier" && "You chose this. Make it yours."}
              {user.procrastination_type === "overdoer" && "One thing at a time. Breathe."}
            </p>
          </SpeechBubble>
        )}
      </div>
    </div>
  );
}
