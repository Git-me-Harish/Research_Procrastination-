"use client";

import { useEffect, useState } from "react";
import { api, type Dashboard as DashboardData } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble,
  BurstRays, ComicBadge,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import type { View } from "./bam-app";

interface DashboardProps {
  setView: (v: View) => void;
}

export function BamDashboard({ setView }: DashboardProps) {
  const { user } = useBamStore();
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
        <ComicPanel color="yellow" tilt="3r" className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="font-bangers text-3xl md:text-4xl text-[#FF4757]" style={{
                WebkitTextStroke: "1.5px #0A0A0A",
                textShadow: "3px 3px 0 #0A0A0A",
              }}>
                HEY, {user?.display_name?.toUpperCase() || user?.username.toUpperCase()}!
              </div>
              <p className="font-comic-neue font-bold mt-1">
                {data.user.current_streak > 0
                  ? `🔥 ${data.user.current_streak}-day streak! Keep it BURNING!`
                  : "Ready to start your first streak? Let's GO!"}
              </p>
              <p className="font-comic-neue text-sm italic mt-1 text-black/70">
                "{data.motivational_quote}"
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <ComicButton color="red" sound="bam" size="lg" onClick={() => setView("focus")}>
                Start Focus
              </ComicButton>
              <ComicButton color="blue" sound="pow" size="lg" onClick={() => setView("tasks")}>
                Tasks
              </ComicButton>
            </div>
          </div>
        </ComicPanel>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          emoji="⭐"
          label="Level"
          value={data.user.level}
          color="#FFD23F"
          tilt="3l"
        />
        <StatCard
          emoji="💥"
          label="Total XP"
          value={data.user.xp}
          color="#FF4757"
          tilt="3r"
        />
        <StatCard
          emoji="⏰"
          label="Today Focus"
          value={`${data.today_focus_minutes}m`}
          color="#4361EE"
          tilt="3l"
        />
        <StatCard
          emoji="🏆"
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
            <h2 className="font-bangers text-2xl">🎯 TODAY'S MISSIONS</h2>
            <ComicButton color="yellow" size="sm" sound="click" onClick={() => setView("tasks")}>
              View All →
            </ComicButton>
          </div>
          {data.today_tasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-2">🎉</div>
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
                  <span className="text-2xl">{task.action_word === "POW!" ? "💥" : task.action_word === "ZAP!" ? "⚡" : task.action_word === "BOOM!" ? "💥" : "⭐"}</span>
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
          <h2 className="font-bangers text-2xl mb-2">🦸 YOUR TYPE</h2>
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
            View My Plan
          </ComicButton>
        </ComicPanel>
      </div>

      {/* Weekly focus chart */}
      <ComicPanel color="white">
        <h2 className="font-bangers text-2xl mb-4">📈 WEEKLY FOCUS POWER</h2>
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
                  {weekday}{isToday ? " ⭐" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </ComicPanel>

      {/* Recent achievements */}
      <div className="grid md:grid-cols-2 gap-4">
        <ComicPanel color="pink">
          <h2 className="font-bangers text-2xl mb-3">🏆 RECENT TROPHIES</h2>
          {data.recent_achievements.length === 0 ? (
            <p className="font-comic-neue font-bold">No trophies yet — complete tasks to earn them!</p>
          ) : (
            <div className="space-y-2">
              {data.recent_achievements.slice(0, 3).map((ua) => (
                <div key={ua.id} className="flex items-center gap-2 p-2 bg-white border-2 border-black rounded-md">
                  <span className="text-2xl">{ua.achievement.icon_emoji}</span>
                  <div>
                    <div className="font-bangers text-sm">{ua.achievement.title}</div>
                    <div className="font-comic-neue text-xs">+{ua.achievement.xp_reward} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ComicButton color="yellow" size="sm" sound="achievement" className="mt-3 w-full" onClick={() => setView("achievements")}>
            View All Trophies
          </ComicButton>
        </ComicPanel>

        {/* Current mood */}
        <ComicPanel color="green">
          <h2 className="font-bangers text-2xl mb-3">😊 CURRENT MOOD</h2>
          {data.current_mood ? (
            <div>
              <div className="flex gap-3 mb-2">
                <div className="flex-1 p-2 bg-white border-2 border-black rounded-md">
                  <div className="font-comic-neue text-xs font-bold">Mood</div>
                  <div className="font-bangers text-xl">{"⭐".repeat(data.current_mood.mood_score)}</div>
                </div>
                <div className="flex-1 p-2 bg-white border-2 border-black rounded-md">
                  <div className="font-comic-neue text-xs font-bold">Energy</div>
                  <div className="font-bangers text-xl">{"⚡".repeat(data.current_mood.energy_score)}</div>
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
            Check In Mood
          </ComicButton>
        </ComicPanel>
      </div>
    </div>
  );
}

function StatCard({
  emoji, label, value, color, tilt = "none",
}: { emoji: string; label: string; value: string | number; color: string; tilt?: "none" | "3l" | "3r" }) {
  return (
    <div
      className={`comic-panel-flat p-4 text-center ${tilt === "3l" ? "tilt-3l" : tilt === "3r" ? "tilt-3r" : ""}`}
      style={{ background: color }}
    >
      <div className="text-3xl">{emoji}</div>
      <div className="font-bangers text-2xl mt-1">{value}</div>
      <div className="font-comic-neue text-xs font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}
