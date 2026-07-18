"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type Achievement, type UserAchievement } from "@/lib/api";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge, BurstRays,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import {
  IconTrophy, IconStar, IconChart, IconLock, IconCheck, IconBolt, IconFlame, IconBreathe, IconTarget, IconHeart, IconSparkle,
} from "@/components/comic/comic-icons";

const FLAIR_COLORS: Record<string, string> = {
  pow:  "#FF4757",
  zap:  "#FFD23F",
  boom: "#FF6B35",
  wham: "#4361EE",
};

export function AchievementsGallery() {
  const [all, setAll] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.listAchievements(),
      api.myAchievements(),
    ])
      .then(([a, e]) => { setAll(a); setEarned(e); })
      .catch(() => toast.error("Failed to load achievements"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const earnedCodes = new Set(earned.map(e => e.achievement.code));

  if (loading) {
    return (
      <div className="text-center py-20">
        <ActionWord word="LOADING TROPHIES..." size="lg" color="pink" />
      </div>
    );
  }

  const totalXp = earned.reduce((sum, e) => sum + e.achievement.xp_reward, 0);
  const earnedCount = earned.length;
  const totalCount = all.length;
  const completion = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative">
        <BurstRays animate className="opacity-15" />
        <ComicPanel color="pink" tilt="3r" className="relative">
          <ActionWord word="TROPHIES!" color="yellow" size="lg" />
          <p className="font-comic-neue font-bold text-white">
            Every POW-worthy deed earns a trophy. Collect them all to become a BAM! Legend!
          </p>
        </ComicPanel>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <ComicPanel color="yellow" tilt="3l" className="text-center">
          <div className="flex justify-center mb-1"><IconTrophy size={48} /></div>
          <div className="font-bangers text-3xl">{earnedCount}/{totalCount}</div>
          <div className="font-comic-neue text-xs font-bold">EARNED</div>
        </ComicPanel>
        <ComicPanel color="green" className="text-center">
          <div className="flex justify-center mb-1"><IconStar size={48} /></div>
          <div className="font-bangers text-3xl">{totalXp}</div>
          <div className="font-comic-neue text-xs font-bold">XP FROM TROPHIES</div>
        </ComicPanel>
        <ComicPanel color="blue" tilt="3r" className="text-center">
          <div className="flex justify-center mb-1"><IconChart size={48} /></div>
          <div className="font-bangers text-3xl">{completion.toFixed(0)}%</div>
          <div className="font-comic-neue text-xs font-bold">COMPLETION</div>
        </ComicPanel>
      </div>

      {/* Progress bar */}
      <ComicPanel color="white">
        <h3 className="font-bangers text-lg mb-2 flex items-center gap-2"><IconChart size={24} /> COMPLETION PROGRESS</h3>
        <div className="h-6 bg-[#FFF8DC] border-3 border-black rounded-full overflow-hidden shadow-[3px_3px_0_#0A0A0A]">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${completion}%`,
              background: "linear-gradient(90deg, #FFD23F, #FF6B35, #FF4757)",
            }}
          >
            <div className="h-full halftone opacity-30" />
          </div>
        </div>
      </ComicPanel>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {all.map((ach) => {
          const isEarned = earnedCodes.has(ach.code);
          const earnedData = earned.find(e => e.achievement.code === ach.code);
          const flairColor = FLAIR_COLORS[ach.flair] || "#FFD23F";
          return (
            <div
              key={ach.id}
              className={`comic-panel-flat p-4 text-center ${isEarned ? "tilt-3l" : ""}`}
              style={{
                background: isEarned ? flairColor : "#F5F5F5",
                opacity: isEarned ? 1 : 0.5,
                filter: isEarned ? "none" : "grayscale(60%)",
              }}
            >
              <div className={`flex justify-center mb-2 ${isEarned ? "" : "opacity-50"}`}>
                {isEarned ? <IconTrophy size={56} /> : <IconLock size={56} />}
              </div>
              <h3 className="font-bangers text-base">{ach.title}</h3>
              <p className="font-comic-neue text-xs mt-1 mb-2">{ach.description}</p>
              <div className="flex justify-center gap-1 flex-wrap">
                <ComicBadge color="yellow">+{ach.xp_reward} XP</ComicBadge>
                {isEarned && earnedData && (
                  <ComicBadge color="green"><span className="flex items-center gap-1"><IconCheck size={12} /> EARNED</span></ComicBadge>
                )}
              </div>
              {isEarned && earnedData && (
                <div className="font-comic-neue text-[10px] mt-2 italic">
                  {new Date(earnedData.earned_at).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Encouragement */}
      {earnedCount < totalCount && (
        <SpeechBubble color="yellow" tilt="left">
          <p className="font-comic-neue font-bold text-black flex items-start gap-2">
            <IconBolt size={22} className="flex-shrink-0" />
            <span>
              You've earned <strong>{earnedCount}</strong> out of <strong>{totalCount}</strong> trophies.
              Complete more tasks, build longer streaks, and rack up focus minutes to unlock them all!
              POW!
            </span>
          </p>
        </SpeechBubble>
      )}

      {earnedCount === totalCount && (
        <ComicPanel color="yellow" tilt="3r" className="text-center">
          <div className="flex justify-center mb-2"><IconStar size={72} fill="#FFD23F" /></div>
          <ActionWord word="LEGEND!" color="red" size="xl" />
          <p className="font-comic-neue font-bold text-lg mt-2">
            You've earned every single trophy. You are a true BAM! Legend!
          </p>
        </ComicPanel>
      )}
    </div>
  );
}
