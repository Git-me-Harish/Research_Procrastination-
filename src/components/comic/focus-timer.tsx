"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { api, type Task, type FocusSession as FocusSessionType } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge, BurstRays,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import {
  IconBolt, IconFocus, IconStar, IconTarget, IconPlay, IconPause,
  IconCheck, IconClose, IconDistraction, IconSparkle, IconCoach, IconFlame,
} from "@/components/comic/comic-icons";

type Mode = "pomodoro" | "short_break" | "long_break" | "deep_work";

const MODES: Record<Mode, { label: string; minutes: number; color: string; Icon: (p: { size?: number }) => JSX.Element }> = {
  pomodoro:    { label: "POW-er Pomodoro",  minutes: 25, color: "#FF4757", Icon: IconBolt },
  short_break: { label: "Quick ZAP Break",  minutes: 5,  color: "#06D6A0", Icon: IconPlay },
  long_break:  { label: "Big BAM Break",    minutes: 15, color: "#4361EE", Icon: IconStar },
  deep_work:   { label: "Deep BOOM Work",   minutes: 50, color: "#FF6B35", Icon: IconTarget },
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

  // Timer tick
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
    triggerBang({ variant: "bam", word: "GO!", x: 50, y: 40, size: 220 });
    try {
      const session = await api.createSession({
        task_id: selectedTaskId,
        session_type: mode,
        planned_minutes: MODES[mode].minutes,
      });
      setCurrentSession(session);
      setIsRunning(true);
      toast.success(`${MODES[mode].label} started! GO!`);
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
      const xp = mode === "deep_work" ? actualMinutes * 3 : actualMinutes * 2;
      // Trigger appropriate BANG based on session type
      if (mode === "deep_work") {
        triggerBang({ variant: "boom-large", word: "DEEP WORK!", x: 50, y: 35, size: 320 });
      } else if (mode === "pomodoro") {
        triggerBang({ variant: "boom", word: "POW!", x: 50, y: 40, size: 260 });
      } else {
        triggerBang({ variant: "pow", word: "DONE!", x: 50, y: 40, size: 220 });
      }
      toast.success(`BOOM! Session complete! +${xp} XP`);
      playSound("levelup");
      refreshUser();
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
    triggerBang({ variant: "zap", word: "OOPS!", x: 50, y: 60, size: 160 });
    toast.warning("Distraction logged! Re-focus!");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = ((initialSeconds - secondsLeft) / initialSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference - (progress / 100) * circumference;
  const ModeIcon = MODES[mode].Icon;

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
        {(Object.keys(MODES) as Mode[]).map((m) => {
          const MIcon = MODES[m].Icon;
          return (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`p-3 border-2 border-black rounded-lg font-bangers text-sm transition-all flex flex-col items-center gap-1 ${
                mode === m ? "shadow-[3px_3px_0_#0A0A0A] -translate-y-0.5" : "bg-white hover:-translate-y-0.5"
              }`}
              style={{ background: mode === m ? MODES[m].color : "#FFFFFF", color: "#0A0A0A" }}
            >
              <MIcon size={32} />
              <div>{MODES[m].label}</div>
              <div className="text-xs font-comic-neue">{MODES[m].minutes} min</div>
            </button>
          );
        })}
      </div>

      {/* Timer */}
      <ComicPanel color="white" className="relative overflow-hidden">
        <BurstRays animate className="opacity-15" />
        <div className="relative">
          {/* Circular timer */}
          <div className="flex justify-center my-6">
            <div className="relative w-72 h-72">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
                <defs>
                  <pattern id="timer-halftone" width="6" height="6" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(10,10,10,0.18)" />
                  </pattern>
                </defs>
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
                <circle
                  cx="140" cy="140" r="120"
                  fill="none"
                  stroke="url(#timer-halftone)"
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 1s linear", pointerEvents: "none" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex justify-center"><ModeIcon size={48} /></div>
                <div className="font-bangers text-6xl mt-1" style={{ color: MODES[mode].color }}>
                  {formatTime(secondsLeft)}
                </div>
                <div className="font-comic-neue text-sm font-bold uppercase flex items-center gap-1">
                  {isRunning ? (
                    <>
                      <IconFlame size={16} /> FOCUSING
                    </>
                  ) : currentSession ? "PAUSED" : "READY"}
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
                <span className="flex items-center gap-2">
                  <ModeIcon size={22} /> START!
                </span>
              </ComicButton>
            )}
            {isRunning && (
              <>
                <ComicButton color="yellow" size="lg" sound="whoosh" onClick={handlePause}>
                  <span className="flex items-center gap-1">
                    <IconPause size={20} /> Pause
                  </span>
                </ComicButton>
                <ComicButton color="orange" size="lg" sound="error" onClick={handleDistraction}>
                  <span className="flex items-center gap-1">
                    <IconDistraction size={20} /> Distracted
                  </span>
                </ComicButton>
              </>
            )}
            {!isRunning && currentSession && (
              <>
                <ComicButton color="green" size="lg" sound="pop" onClick={handleResume}>
                  <span className="flex items-center gap-1">
                    <IconPlay size={20} /> Resume
                  </span>
                </ComicButton>
                <ComicButton color="red" size="lg" sound="achievement" onClick={handleComplete}>
                  <span className="flex items-center gap-1">
                    <IconCheck size={20} /> Complete Early
                  </span>
                </ComicButton>
                <ComicButton color="white" size="lg" sound="wham" onClick={handleAbandon}>
                  <span className="flex items-center gap-1">
                    <IconClose size={20} /> Abandon
                  </span>
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
          <p className="font-comic-neue font-bold text-black flex items-start gap-2">
            <IconSparkle size={22} className="flex-shrink-0" />
            <span>
              Pro tip: Silence your phone, close unnecessary tabs, and commit fully.
              Even 5 minutes of pure focus beats 25 minutes of half-focus!
            </span>
          </p>
        </SpeechBubble>
        {user?.procrastination_type && (
          <SpeechBubble color="white" tilt="right">
            <p className="font-comic-neue font-bold text-black flex items-start gap-2">
              <IconCoach size={22} className="flex-shrink-0" />
              <span>
                For your <strong>{user.procrastination_type.replace("_", " ")}</strong> type:
                {" "}
                {user.procrastination_type === "perfectionist" && "Done is better than perfect — ship it!"}
                {user.procrastination_type === "dreamer" && "Make it tangible. Ship something real."}
                {user.procrastination_type === "worrier" && "Small steps. You've got this."}
                {user.procrastination_type === "crisis_maker" && "No fake urgency needed. Just flow."}
                {user.procrastination_type === "defier" && "You chose this. Make it yours."}
                {user.procrastination_type === "overdoer" && "One thing at a time. Breathe."}
              </span>
            </p>
          </SpeechBubble>
        )}
      </div>
    </div>
  );
}
