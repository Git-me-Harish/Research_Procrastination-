"use client";

import { useEffect, useState } from "react";
import { api, type Dashboard as DashboardData } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble,
  BurstRays, ComicBadge,
} from "@/components/comic/comic-ui";
import { KPIStrip } from "@/components/comic/kpi-strip";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import type { View } from "./bam-app";
import {
  IconStar, IconBolt, IconClock, IconTrophy, IconFlame,
  IconTask, IconFocus, IconArrowRight, IconSparkle,
  IconCoach, IconPlan, IconMood, IconCheck, IconHeart, IconEnergy,
} from "@/components/comic/comic-icons";

interface DashboardProps {
  setView: (v: View) => void;
}

export function BamDashboard({ setView }: DashboardProps) {
  const { user, refreshUser } = useBamStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.dashboard()
      .then(setData)
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Trigger a welcome BANG on first dashboard load
  useEffect(() => {
    if (data && !loading) {
      const t = setTimeout(() => {
        triggerBang({ variant: "bam", word: user?.display_name?.toUpperCase() || "HELLO!", x: 50, y: 25, size: 180 });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [data, loading, user]);

  if (loading || !data) {
    return (
      <div className="text-center py-20">
        <ActionWord word="LOADING HQ..." size="lg" />
        <p className="font-comic-neue font-bold mt-3">Gathering your hero stats...</p>
      </div>
    );
  }

  const maxWeekly = Math.max(...data.weekly_focus_minutes.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden">
        <BurstRays animate className="opacity-20" />
        <ComicPanel color="yellow" tilt="3r" burst className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="font-bangers text-3xl md:text-4xl text-[#FF4757]" style={{
                WebkitTextStroke: "1.5px #0A0A0A",
                textShadow: "3px 3px 0 #0A0A0A",
              }}>
                HEY, {user?.display_name?.toUpperCase() || user?.username.toUpperCase()}!
              </div>
              <p className="font-comic-neue font-bold mt-1 flex items-center gap-2">
                {data.user.current_streak > 0 ? (
                  <>
                    <IconFlame size={20} />
                    <span>{data.user.current_streak}-day streak! Keep it BURNING!</span>
                  </>
                ) : (
                  <span>Ready to start your first streak? Let's GO!</span>
                )}
              </p>
              <p className="font-comic-neue text-sm italic mt-1 text-black/70">
                "{data.motivational_quote}"
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <ComicButton color="red" sound="bam" size="lg" onClick={() => setView("focus")}>
                <span className="flex items-center gap-1">
                  <IconFocus size={22} /> Start Focus
                </span>
              </ComicButton>
              <ComicButton color="blue" sound="pow" size="lg" onClick={() => setView("tasks")}>
                <span className="flex items-center gap-1">
                  <IconTask size={22} /> Tasks
                </span>
              </ComicButton>
            </div>
          </div>
        </ComicPanel>
      </div>

      {/* KPI Strip — unique BAM! metrics */}
      <KPIStrip />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<IconStar size={32} />}
          label="Level"
          value={data.user.level}
          color="#FFD23F"
          tilt="3l"
        />
        <StatCard
          icon={<IconBolt size={32} />}
          label="Total XP"
          value={data.user.xp}
          color="#FF4757"
          tilt="3r"
        />
        <StatCard
          icon={<IconClock size={32} />}
          label="Today Focus"
          value={`${data.today_focus_minutes}m`}
          color="#4361EE"
          tilt="3l"
        />
        <StatCard
          icon={<IconTrophy size={32} />}
          label="Total Focus"
          value={`${data.total_focus_minutes}m`}
          color="#06D6A0"
          tilt="3r"
        />
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Today's tasks */}
        <ComicPanel color="white" className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bangers text-2xl flex items-center gap-2">
              <IconTask size={28} /> TODAY'S MISSIONS
            </h2>
            <ComicButton color="yellow" size="sm" sound="click" onClick={() => setView("tasks")}>
              <span className="flex items-center gap-1">
                View All <IconArrowRight size={16} />
              </span>
            </ComicButton>
          </div>
          {data.today_tasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-2">
                <IconSparkle size={64} />
              </div>
              <p className="font-comic-neue font-bold">All caught up! No pending tasks.</p>
              <ComicButton color="green" size="sm" sound="pop" className="mt-3" onClick={() => setView("tasks")}>
                Add a new mission
              </ComicButton>
            </div>
          ) : (
            <div className="space-y-2">
              {data.today_tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-[#FFF8DC] border-2 border-black rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <IconBolt size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="font-comic-neue font-bold">{task.title}</div>
                    <div className="flex gap-2 mt-1">
                      <ComicBadge color={task.priority === "urgent" ? "red" : task.priority === "high" ? "orange" : "yellow"}>
                        {task.priority}
                      </ComicBadge>
                      <ComicBadge color="blue">{task.estimated_minutes}m</ComicBadge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComicPanel>

        {/* Procrastination type */}
        <ComicPanel color="blue">
          <h2 className="font-bangers text-2xl mb-2 flex items-center gap-2">
            <IconCoach size={28} /> YOUR TYPE
          </h2>
          <ActionWord
            word={data.user.procrastination_type.replace("_", " ").toUpperCase()}
            color="yellow"
            size="md"
            className="block mb-3"
          />
          <SpeechBubble color="white" tilt="right">
            <p className="font-comic-neue text-sm font-bold text-black">
              Your personalized plan is tuned to your type. Tap below to review it!
            </p>
          </SpeechBubble>
          <ComicButton color="yellow" size="sm" sound="whoosh" className="mt-3 w-full" onClick={() => setView("plan")}>
            <span className="flex items-center justify-center gap-1">
              <IconPlan size={20} /> View My Plan
            </span>
          </ComicButton>
        </ComicPanel>
      </div>

      {/* Weekly focus chart */}
      <ComicPanel color="white">
        <h2 className="font-bangers text-2xl mb-4 flex items-center gap-2">
          <IconTrophy size={28} /> WEEKLY FOCUS POWER
        </h2>
        <div className="flex items-end justify-between gap-2 h-48">
          {data.weekly_focus_minutes.map((d, i) => {
            const date = new Date(d.date);
            const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
            const isToday = i === data.weekly_focus_minutes.length - 1;
            const height = (d.minutes / maxWeekly) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="font-bangers text-sm">{d.minutes}m</div>
                <div
                  className="w-full border-2 border-black rounded-t-md relative overflow-hidden"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    background: isToday ? "#FF4757" : "#FFD23F",
                    boxShadow: "3px 3px 0 #0A0A0A",
                  }}
                >
                  <div className="absolute inset-0 halftone opacity-30" />
                </div>
                <div className="font-comic-neue text-xs font-bold">
                  {weekday}{isToday ? " *" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </ComicPanel>

      {/* Recent achievements + Mood */}
      <div className="grid md:grid-cols-2 gap-4">
        <ComicPanel color="pink">
          <h2 className="font-bangers text-2xl mb-3 flex items-center gap-2">
            <IconTrophy size={28} /> RECENT TROPHIES
          </h2>
          {data.recent_achievements.length === 0 ? (
            <p className="font-comic-neue font-bold">No trophies yet — complete tasks to earn them!</p>
          ) : (
            <div className="space-y-2">
              {data.recent_achievements.slice(0, 3).map((ua) => (
                <div key={ua.id} className="flex items-center gap-2 p-2 bg-white border-2 border-black rounded-md">
                  <IconTrophy size={32} />
                  <div>
                    <div className="font-bangers text-sm">{ua.achievement.title}</div>
                    <div className="font-comic-neue text-xs">+{ua.achievement.xp_reward} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ComicButton color="yellow" size="sm" sound="achievement" className="mt-3 w-full" onClick={() => setView("achievements")}>
            <span className="flex items-center justify-center gap-1">
              <IconTrophy size={20} /> View All Trophies
            </span>
          </ComicButton>
        </ComicPanel>

        {/* Current mood */}
        <ComicPanel color="green">
          <h2 className="font-bangers text-2xl mb-3 flex items-center gap-2">
            <IconMood size={28} /> CURRENT MOOD
          </h2>
          {data.current_mood ? (
            <div>
              <div className="flex gap-3 mb-2">
                <div className="flex-1 p-2 bg-white border-2 border-black rounded-md">
                  <div className="font-comic-neue text-xs font-bold">Mood</div>
                  <div className="font-bangers text-xl flex items-center gap-0.5">
                    {Array.from({ length: data.current_mood.mood_score }).map((_, i) => (
                      <IconStar key={i} size={16} fill="#FFD23F" />
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-2 bg-white border-2 border-black rounded-md">
                  <div className="font-comic-neue text-xs font-bold">Energy</div>
                  <div className="font-bangers text-xl flex items-center gap-0.5">
                    {Array.from({ length: data.current_mood.energy_score }).map((_, i) => (
                      <IconEnergy key={i} size={16} />
                    ))}
                  </div>
                </div>
              </div>
              {data.current_mood.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.current_mood.triggers.map((t) => (
                    <ComicBadge key={t} color="white">{t}</ComicBadge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="font-comic-neue font-bold mb-3">No mood check-in yet today.</p>
          )}
          <ComicButton color="orange" size="sm" sound="pop" className="mt-3 w-full" onClick={() => setView("mood")}>
            <span className="flex items-center justify-center gap-1">
              <IconHeart size={20} /> Check In Mood
            </span>
          </ComicButton>
        </ComicPanel>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, color, tilt = "none",
}: { icon: React.ReactNode; label: string; value: string | number; color: string; tilt?: "none" | "3l" | "3r" }) {
  return (
    <div
      className={`comic-panel-flat p-4 text-center ${tilt === "3l" ? "tilt-3l" : tilt === "3r" ? "tilt-3r" : ""}`}
      style={{ background: color }}
    >
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="font-bangers text-2xl mt-1">{value}</div>
      <div className="font-comic-neue text-xs font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}
