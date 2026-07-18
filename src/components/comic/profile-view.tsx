"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type ProfileSummary, type UserUpdate } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge, BurstRays,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import type { View } from "./bam-app";
import {
  IconUser, IconStar, IconBolt, IconFlame, IconTrophy, IconClock, IconTask,
  IconFocus, IconBreathe, IconChain, IconShield, IconMood, IconCoach,
  IconEdit, IconCheck, IconDownload, IconRefresh, IconSoundOn, IconSoundOff,
  IconCalendar, IconChart, IconSparkle, IconEnergy,
} from "@/components/comic/comic-icons";

interface ProfileViewProps {
  setView: (v: View) => void;
}

export function ProfileView({ setView }: ProfileViewProps) {
  const { user, setUser, soundOn, toggleSound, refreshUser } = useBamStore();
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [kpiHistory, setKpiHistory] = useState<any[]>([]);
  const [retakeConfirm, setRetakeConfirm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.profileSummary(),
      api.kpiHistory(14).catch(() => ({ days: [] })),
    ])
      .then(([s, hist]) => {
        setSummary(s);
        setKpiHistory(hist.days || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === user?.display_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await api.updateMe({ display_name: trimmed });
      setUser(updated);
      setSummary(s => s ? { ...s, user: updated, procrastination_type: updated.procrastination_type } : s);
      playSound("bam");
      triggerBang({ variant: "bam", word: "SAVED!", x: 50, y: 35, size: 160 });
      setEditingName(false);
    } catch (e: any) {
      playSound("error");
      alert("Failed to save name: " + e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleToggleSound = async () => {
    // Optimistic toggle via store (already works) but also persist to server
    toggleSound();
    try {
      await api.updateMe({ sound_enabled: !soundOn });
      playSound("pop");
    } catch {}
  };

  const handleExportData = async () => {
    if (!summary) return;
    playSound("boom");
    triggerBang({ variant: "boom", word: "EXPORTED!", x: 50, y: 40, size: 180 });
    const blob = new Blob([JSON.stringify({
      exported_at: new Date().toISOString(),
      user: summary.user,
      level_progress: {
        level: summary.level,
        xp: summary.xp,
        xp_into_level: summary.xp_into_level,
        xp_for_next_level: summary.xp_for_next_level,
        xp_to_next_level: summary.xp_to_next_level,
        next_level: summary.next_level,
        progress_pct: summary.progress_pct,
      },
      lifetime_totals: {
        total_tasks: summary.total_tasks,
        tasks_completed: summary.tasks_completed,
        tasks_pending: summary.tasks_pending,
        total_focus_minutes: summary.total_focus_minutes,
        total_focus_sessions: summary.total_focus_sessions,
        total_breathe_sessions: summary.total_breathe_sessions,
        total_breathe_minutes: summary.total_breathe_minutes,
        total_chains: summary.total_chains,
        total_chain_completions: summary.total_chain_completions,
        longest_chain: summary.longest_chain,
        total_shields_earned: summary.total_shields_earned,
        total_shields_spent: summary.total_shields_spent,
        achievements_earned: summary.achievements_earned,
        achievements_total: summary.achievements_total,
        mood_entries: summary.mood_entries,
        ai_interactions: summary.ai_interactions,
        days_active: summary.days_active,
        member_since: summary.member_since,
      },
      procrastination_type: summary.procrastination_type,
      recent_activity: summary.recent_activity,
      kpi_history_14_days: kpiHistory,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bam-profile-${user?.username || "user"}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetakeQuiz = async () => {
    try {
      await api.retakeOnboarding();
      playSound("whoosh");
      triggerBang({ variant: "kapow", word: "RETAKE!", x: 50, y: 35, size: 180 });
      // Refresh user — onboarding_completed_at will be null, app will route to OnboardingFlow
      await refreshUser();
    } catch (e: any) {
      playSound("error");
      alert("Failed: " + e.message);
    }
  };

  if (loading || !summary) {
    return (
      <div className="text-center py-20">
        <ActionWord word="LOADING PROFILE..." size="lg" />
        <p className="font-comic-neue font-bold mt-3">Summing up your hero journey...</p>
      </div>
    );
  }

  const memberSinceDate = new Date(summary.member_since);
  const memberSinceStr = memberSinceDate.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  const initials = (user?.display_name || user?.username || "H")[0].toUpperCase();

  return (
    <div className="space-y-6">
      {/* ===== HERO PROFILE CARD ===== */}
      <div className="relative overflow-hidden">
        <BurstRays animate className="opacity-15" />
        <ComicPanel color="blue" tilt="2l" burst className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            {/* Big avatar */}
            <div className="flex-shrink-0 relative">
              <div
                className="w-28 h-28 flex items-center justify-center border-4 border-black rounded-2xl shadow-[6px_6px_0_#0A0A0A] comic-textured-yellow"
                style={{ transform: "rotate(-3deg)" }}
              >
                <span
                  className="font-bangers text-6xl text-[#FF4757]"
                  style={{
                    WebkitTextStroke: "2px #0A0A0A",
                    textShadow: "3px 3px 0 #0A0A0A",
                  }}
                >
                  {initials}
                </span>
              </div>
              {/* Level badge floating */}
              <div className="absolute -bottom-3 -right-3 bg-[#FFD23F] border-2 border-black rounded-full px-3 py-1 shadow-[2px_2px_0_#0A0A0A] flex items-center gap-1">
                <IconStar size={18} />
                <span className="font-bangers text-lg">LV {summary.level}</span>
              </div>
            </div>

            {/* Name + email + member since */}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    maxLength={120}
                    className="font-bangers text-3xl md:text-4xl bg-white border-3 border-black rounded-lg px-3 py-1 text-[#FF4757] outline-none focus:ring-4 focus:ring-[#FFD23F]/60"
                    style={{ borderWidth: "3px", WebkitTextStroke: "1px #0A0A0A" }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="w-10 h-10 flex items-center justify-center bg-[#06D6A0] text-white border-3 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#0A0A0A] transition-all disabled:opacity-50"
                    style={{ borderWidth: "3px" }}
                    title="Save"
                  >
                    <IconCheck size={22} />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="w-10 h-10 flex items-center justify-center bg-[#FF4757] text-white border-3 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#0A0A0A] transition-all"
                    style={{ borderWidth: "3px" }}
                    title="Cancel"
                  >
                    <IconRefresh size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="font-bangers text-3xl md:text-4xl text-[#FFD23F]"
                    style={{
                      WebkitTextStroke: "1.5px #0A0A0A",
                      textShadow: "3px 3px 0 #0A0A0A",
                    }}
                  >
                    {user?.display_name || user?.username}
                  </h1>
                  <button
                    onClick={() => {
                      setNameDraft(user?.display_name || user?.username || "");
                      setEditingName(true);
                      playSound("pop");
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#0A0A0A] transition-all"
                    title="Edit display name"
                  >
                    <IconEdit size={18} />
                  </button>
                </div>
              )}

              <div className="font-comic-neue font-bold mt-1 flex items-center gap-2 flex-wrap">
                <span className="bg-white/30 border-2 border-black rounded-full px-3 py-0.5 text-sm">
                  @{user?.username}
                </span>
                <span className="bg-white/30 border-2 border-black rounded-full px-3 py-0.5 text-sm flex items-center gap-1">
                  <IconUser size={14} /> {user?.email}
                </span>
                <span className="bg-[#FFD23F] text-black border-2 border-black rounded-full px-3 py-0.5 text-sm flex items-center gap-1">
                  <IconCalendar size={14} /> Joined {memberSinceStr}
                </span>
              </div>

              {/* Procrastination type chip */}
              <div className="mt-2">
                <ComicBadge color="pink">
                  <span className="font-bangers tracking-wide">
                    TYPE: {summary.procrastination_type.replace("_", " ").toUpperCase()}
                  </span>
                </ComicBadge>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <ComicButton color="yellow" sound="click" size="sm" onClick={handleExportData}>
                <span className="flex items-center gap-1">
                  <IconDownload size={18} /> Export
                </span>
              </ComicButton>
              <ComicButton color="green" sound="whoosh" size="sm" onClick={() => setRetakeConfirm(true)}>
                <span className="flex items-center gap-1">
                  <IconRefresh size={18} /> Re-take Quiz
                </span>
              </ComicButton>
            </div>
          </div>
        </ComicPanel>
      </div>

      {/* ===== LEVEL PROGRESS BAR ===== */}
      <ComicPanel color="yellow">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bangers text-2xl flex items-center gap-2">
            <IconStar size={26} /> LEVEL {summary.level} PROGRESS
          </h2>
          <div className="font-bangers text-xl">
            {summary.xp} / {summary.xp + summary.xp_to_next_level} XP
          </div>
        </div>
        <div className="relative h-8 bg-white border-3 border-black rounded-full overflow-hidden shadow-[3px_3px_0_#0A0A0A]" style={{ borderWidth: "3px" }}>
          <div
            className="absolute inset-y-0 left-0 comic-textured-red transition-all"
            style={{ width: `${Math.max(2, summary.progress_pct)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-bangers text-lg text-white" style={{ textShadow: "2px 2px 0 #0A0A0A" }}>
            {summary.progress_pct.toFixed(0)}% to LV {summary.next_level}
          </div>
        </div>
        <p className="font-comic-neue text-sm font-bold mt-2 text-center">
          {summary.xp_to_next_level} XP to reach Level {summary.next_level} — keep stacking POW!
        </p>
      </ComicPanel>

      {/* ===== LIFETIME STATS GRID ===== */}
      <div>
        <h2 className="font-bangers text-3xl mb-3 flex items-center gap-2" style={{
          WebkitTextStroke: "1px #0A0A0A",
          textShadow: "2px 2px 0 #0A0A0A",
        }}>
          <IconChart size={32} /> LIFETIME STATS
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<IconTask size={28} />} label="Tasks Done" value={summary.tasks_completed} sub={`${summary.tasks_pending} pending`} color="#FF4757" tilt="3l" />
          <StatCard icon={<IconFocus size={28} />} label="Focus Minutes" value={summary.total_focus_minutes} sub={`${summary.total_focus_sessions} sessions`} color="#4361EE" tilt="3r" />
          <StatCard icon={<IconBreathe size={28} />} label="Breathe Sessions" value={summary.total_breathe_sessions} sub={`${summary.total_breathe_minutes}m total`} color="#06D6A0" tilt="3l" />
          <StatCard icon={<IconChain size={28} />} label="Chains Built" value={summary.total_chains} sub={`${summary.longest_chain}d best`} color="#FFD23F" tilt="3r" />
          <StatCard icon={<IconShield size={28} />} label="Shields Earned" value={summary.total_shields_earned} sub={`${summary.total_shields_spent} spent`} color="#9B5DE5" tilt="3l" />
          <StatCard icon={<IconTrophy size={28} />} label="Trophies" value={`${summary.achievements_earned}/${summary.achievements_total}`} sub="unlocked" color="#FF6B35" tilt="3r" />
          <StatCard icon={<IconFlame size={28} />} label="Longest Streak" value={`${user?.longest_streak || 0}d`} sub={`${user?.current_streak || 0}d now`} color="#FF4757" tilt="3l" />
          <StatCard icon={<IconCalendar size={28} />} label="Days Active" value={summary.days_active} sub="distinct days" color="#4361EE" tilt="3r" />
        </div>
      </div>

      {/* ===== 14-DAY KPI TREND CHART ===== */}
      {kpiHistory.length > 1 && (
        <ComicPanel color="white">
          <h2 className="font-bangers text-2xl mb-3 flex items-center gap-2">
            <IconChart size={26} /> 14-DAY MOMENTUM TREND
          </h2>
          <KPITrendChart history={kpiHistory} />
        </ComicPanel>
      )}

      {/* ===== PROCRASTINATION TYPE CARD ===== */}
      <ComicPanel color="pink">
        <h2 className="font-bangers text-2xl mb-2 flex items-center gap-2">
          <IconCoach size={26} /> YOUR PROCRASTINATION PROFILE
        </h2>
        <div className="flex flex-col md:flex-row gap-3 items-start">
          <div className="flex-shrink-0">
            <ActionWord
              word={summary.procrastination_type.replace("_", " ").toUpperCase()}
              color="yellow"
              size="md"
              className="block"
            />
          </div>
          <SpeechBubble color="white" tilt="right" className="flex-1">
            <p className="font-comic-neue font-bold text-black text-sm">
              Your personalized AI plan, KPIs, and coach are all tuned to this procrastination type.
              If your patterns have changed, re-take the quiz to recalibrate your BAM! experience.
            </p>
          </SpeechBubble>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ComicButton color="yellow" size="sm" sound="whoosh" onClick={() => setView("plan")}>
            <span className="flex items-center gap-1"><IconCoach size={18} /> View My Plan</span>
          </ComicButton>
          <ComicButton color="green" size="sm" sound="whoosh" onClick={() => setView("coach")}>
            <span className="flex items-center gap-1"><IconSparkle size={18} /> Ask AI Coach</span>
          </ComicButton>
        </div>
      </ComicPanel>

      {/* ===== RECENT ACTIVITY TIMELINE ===== */}
      <ComicPanel color="white">
        <h2 className="font-bangers text-2xl mb-3 flex items-center gap-2">
          <IconBolt size={26} /> RECENT ACTIVITY
        </h2>
        {summary.recent_activity.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-2"><IconSparkle size={48} /></div>
            <p className="font-comic-neue font-bold">No activity yet — complete a task or focus session to start your story!</p>
            <ComicButton color="yellow" size="sm" sound="pop" className="mt-3" onClick={() => setView("tasks")}>
              Add a mission
            </ComicButton>
          </div>
        ) : (
          <ol className="relative border-l-3 border-black ml-3 space-y-3" style={{ borderLeftWidth: "3px" }}>
            {summary.recent_activity.map((item, idx) => (
              <li key={idx} className="ml-4">
                <div className="absolute -left-2.5 w-5 h-5 bg-[#FFD23F] border-2 border-black rounded-full" />
                <div className="flex items-start gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ActivityIcon kind={item.kind} />
                      <span className="font-comic-neue font-bold text-sm">{item.title}</span>
                      {item.xp > 0 && (
                        <ComicBadge color="yellow">+{item.xp} XP</ComicBadge>
                      )}
                    </div>
                    {item.detail && (
                      <div className="font-comic-neue text-xs text-black/70 mt-0.5">{item.detail}</div>
                    )}
                    <div className="font-comic-neue text-xs text-black/50 mt-0.5 flex items-center gap-1">
                      <IconClock size={12} />
                      {timeAgo(new Date(item.timestamp))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </ComicPanel>

      {/* ===== SETTINGS PANEL ===== */}
      <ComicPanel color="cream">
        <h2 className="font-bangers text-2xl mb-3 flex items-center gap-2">
          <IconEdit size={26} /> SETTINGS
        </h2>
        <div className="space-y-2">
          {/* Sound toggle */}
          <div className="flex items-center justify-between p-3 bg-white border-2 border-black rounded-lg">
            <div className="flex items-center gap-2">
              {soundOn ? <IconSoundOn size={28} /> : <IconSoundOff size={28} />}
              <div>
                <div className="font-bangers text-lg">Sound Effects</div>
                <div className="font-comic-neue text-xs font-bold text-black/60">
                  BAM/POW/ZAP sounds on every action
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-14 h-8 border-3 border-black rounded-full relative transition-all shadow-[2px_2px_0_#0A0A0A] ${soundOn ? "bg-[#06D6A0]" : "bg-[#FF4757]"}`}
              style={{ borderWidth: "3px" }}
              title={soundOn ? "Sound ON (click to mute)" : "Sound OFF (click to unmute)"}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white border-2 border-black rounded-full transition-all ${soundOn ? "left-7" : "left-0.5"}`}
              />
            </button>
          </div>

          {/* Member info */}
          <div className="flex items-center justify-between p-3 bg-white border-2 border-black rounded-lg">
            <div className="flex items-center gap-2">
              <IconCalendar size={28} />
              <div>
                <div className="font-bangers text-lg">Member Since</div>
                <div className="font-comic-neue text-xs font-bold text-black/60">
                  {memberSinceStr} ({Math.max(0, Math.floor((Date.now() - memberSinceDate.getTime()) / 86400000))} days ago)
                </div>
              </div>
            </div>
            <ComicBadge color="blue">{summary.days_active} active days</ComicBadge>
          </div>

          {/* AI usage */}
          <div className="flex items-center justify-between p-3 bg-white border-2 border-black rounded-lg">
            <div className="flex items-center gap-2">
              <IconCoach size={28} />
              <div>
                <div className="font-bangers text-lg">AI Coach Interactions</div>
                <div className="font-comic-neue text-xs font-bold text-black/60">
                  Lifetime AI calls (breakdowns, plans, chats)
                </div>
              </div>
            </div>
            <ComicBadge color="orange">{summary.ai_interactions}</ComicBadge>
          </div>
        </div>
      </ComicPanel>

      {/* ===== RETAKE QUIZ CONFIRMATION MODAL ===== */}
      {retakeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <ComicPanel color="yellow" className="max-w-md w-full" tilt="2r">
            <h3 className="font-bangers text-3xl text-[#FF4757] mb-2" style={{
              WebkitTextStroke: "1px #0A0A0A",
              textShadow: "2px 2px 0 #0A0A0A",
            }}>
              RE-TAKE QUIZ?
            </h3>
            <p className="font-comic-neue font-bold mb-4">
              This will reset your procrastination profile so you can take the 6-question quiz again.
              Your tasks, XP, streaks, and achievements will all be kept safe. Only your type and plan
              may change based on your new answers.
            </p>
            <div className="flex gap-2 justify-end">
              <ComicButton color="white" sound="click" size="sm" onClick={() => setRetakeConfirm(false)}>
                Cancel
              </ComicButton>
              <ComicButton color="green" sound="whoosh" size="sm" onClick={() => {
                setRetakeConfirm(false);
                handleRetakeQuiz();
              }}>
                <span className="flex items-center gap-1">
                  <IconRefresh size={18} /> Re-take it!
                </span>
              </ComicButton>
            </div>
          </ComicPanel>
        </div>
      )}
    </div>
  );
}

// ============ Sub-components ============

function StatCard({
  icon, label, value, sub, color, tilt = "none",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  tilt?: "none" | "3l" | "3r";
}) {
  return (
    <div
      className={`comic-panel-flat p-3 border-3 border-black rounded-lg shadow-[3px_3px_0_#0A0A0A] ${tilt === "3l" ? "tilt-3l" : tilt === "3r" ? "tilt-3r" : ""}`}
      style={{ background: color, borderWidth: "3px" }}
    >
      <div className="flex items-center justify-between">
        <div>{icon}</div>
        <div className="font-bangers text-2xl text-white" style={{ textShadow: "2px 2px 0 #0A0A0A" }}>
          {value}
        </div>
      </div>
      <div className="font-bangers text-sm mt-1 text-white" style={{ textShadow: "1px 1px 0 #0A0A0A" }}>
        {label}
      </div>
      {sub && <div className="font-comic-neue text-xs font-bold text-white/90">{sub}</div>}
    </div>
  );
}

function ActivityIcon({ kind }: { kind: string }) {
  const map: Record<string, React.ReactNode> = {
    task_completed: <IconCheck size={20} />,
    focus_session: <IconFocus size={20} />,
    mood_logged: <IconMood size={20} />,
    breathe_session: <IconBreathe size={20} />,
    chain_completed: <IconChain size={20} />,
    shield_earned: <IconShield size={20} />,
    achievement_earned: <IconTrophy size={20} />,
    ai_interaction: <IconCoach size={20} />,
  };
  return <span className="flex-shrink-0">{map[kind] || <IconBolt size={20} />}</span>;
}

function KPITrendChart({ history }: { history: any[] }) {
  if (history.length < 2) {
    return <p className="font-comic-neue font-bold text-center py-4">Not enough data yet — come back tomorrow!</p>;
  }

  const w = 600, h = 200, pad = 30;
  const maxVal = 100;
  const stepX = (w - pad * 2) / Math.max(1, history.length - 1);

  const toPath = (key: string) => {
    return history.map((d, i) => {
      const x = pad + i * stepX;
      const v = Number(d[key] || 0);
      const y = h - pad - (v / maxVal) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  const miPath = toPath("momentum_index");
  const arsPath = toPath("avoidance_resistance");
  const plPath = toPath("power_level");

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto bg-[#FFF8DC] border-3 border-black rounded-lg" style={{ borderWidth: "3px" }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = h - pad - (v / maxVal) * (h - pad * 2);
          return (
            <g key={v}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#0A0A0A" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3" />
              <text x={4} y={y + 4} fontSize="10" fontWeight="bold" fill="#0A0A0A">{v}</text>
            </g>
          );
        })}

        {/* MI line (red) */}
        <path d={miPath} fill="none" stroke="#FF4757" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {history.map((d, i) => {
          const x = pad + i * stepX;
          const v = Number(d.momentum_index || 0);
          const y = h - pad - (v / maxVal) * (h - pad * 2);
          return <circle key={`mi${i}`} cx={x} cy={y} r="3" fill="#FF4757" stroke="#0A0A0A" strokeWidth="1" />;
        })}

        {/* ARS line (blue) */}
        <path d={arsPath} fill="none" stroke="#4361EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {history.map((d, i) => {
          const x = pad + i * stepX;
          const v = Number(d.avoidance_resistance || 0);
          const y = h - pad - (v / maxVal) * (h - pad * 2);
          return <circle key={`ars${i}`} cx={x} cy={y} r="3" fill="#4361EE" stroke="#0A0A0A" strokeWidth="1" />;
        })}

        {/* PL line (green) */}
        <path d={plPath} fill="none" stroke="#06D6A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {history.map((d, i) => {
          const x = pad + i * stepX;
          const v = Number(d.power_level || 0);
          const y = h - pad - (v / maxVal) * (h - pad * 2);
          return <circle key={`pl${i}`} cx={x} cy={y} r="3" fill="#06D6A0" stroke="#0A0A0A" strokeWidth="1" />;
        })}

        {/* X-axis labels (first, middle, last) */}
        {[0, Math.floor(history.length / 2), history.length - 1].map((i) => {
          if (i >= history.length) return null;
          const d = history[i];
          const x = pad + i * stepX;
          const label = d.date ? String(d.date).slice(5) : "";
          return (
            <text key={`x${i}`} x={x} y={h - 8} fontSize="10" fontWeight="bold" fill="#0A0A0A" textAnchor="middle">{label}</text>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        <Legend color="#FF4757" label="Momentum Index" />
        <Legend color="#4361EE" label="Avoidance Resistance" />
        <Legend color="#06D6A0" label="Power Level" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-4 h-1 rounded" style={{ background: color, boxShadow: `1px 1px 0 #0A0A0A` }} />
      <span className="font-comic-neue text-xs font-bold">{label}</span>
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
