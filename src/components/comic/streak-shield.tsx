"use client";

import { useEffect, useState } from "react";
import { api, type Shield } from "@/lib/api";
import {
  ComicPanel, ComicButton, ActionWord, ComicBadge, SpeechBubble,
} from "@/components/comic/comic-ui";
import {
  IconShield, IconFlame, IconBolt, IconCheck, IconClose, IconStar, IconTarget,
  IconBreathe,
} from "@/components/comic/comic-icons";
import { triggerBang } from "@/components/comic/bang-effect";
import { playSound } from "@/lib/sounds";
import { useBamStore } from "@/lib/store";

const SHIELD_RARITY_INFO: Record<string, { label: string; color: string; bg: string }> = {
  common:   { label: "Common",    color: "#4361EE", bg: "#E8F0FF" },
  rare:     { label: "Rare",      color: "#9B5DE5", bg: "#F3E8FF" },
  epic:     { label: "Epic",      color: "#FF6B35", bg: "#FFE8DC" },
  legendary:{ label: "Legendary", color: "#FFD23F", bg: "#FFF8DC" },
};

const SHIELD_COLOR_INFO: Record<string, string> = {
  blue: "#4361EE",
  gold: "#FFD23F",
  rainbow: "linear-gradient(135deg, #FF4757, #FFD23F, #06D6A0, #4361EE, #9B5DE5)",
  green: "#06D6A0",
};

export function StreakShieldView() {
  const { user, refreshUser } = useBamStore();
  const [shields, setShields] = useState<Shield[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpend, setShowSpend] = useState(false);

  const load = () => {
    setLoading(true);
    api.listShields()
      .then(setShields)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reserve = shields.filter((s) => !s.is_spent).length;
  const spent = shields.filter((s) => s.is_spent).length;

  const handleSpend = async (targetDate: string) => {
    try {
      const result = await api.spendShield(targetDate);
      if (result.success) {
        triggerBang({ variant: "kapow", word: "PROTECTED!", x: 50, y: 40, size: 280 });
        playSound("levelup");
        refreshUser();
        load();
        setShowSpend(false);
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      alert(e.message || "Failed to spend shield");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <ActionWord word="LOADING SHIELDS..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <ComicPanel color="blue" tilt="3r" burst>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-bangers text-4xl text-[#FFD23F]" style={{
              WebkitTextStroke: "1.5px #0A0A0A",
              textShadow: "3px 3px 0 #0A0A0A",
            }}>
              STREAK SHIELDS!
            </h1>
            <p className="font-comic-neue font-bold mt-1 max-w-2xl text-white">
              Earn shields by completing power chains, hitting milestones, and finishing deep work sessions.
              Spend them to protect missed days — never lose your streak to one bad day again.
            </p>
          </div>
          <div className="text-center bg-white border-2 border-black rounded-lg p-3 shadow-[3px_3px_0_#0A0A0A]">
            <div className="font-comic-neue text-xs font-bold uppercase">Reserve</div>
            <div className="font-bangers text-3xl text-[#4361EE]">{reserve}</div>
            <div className="font-comic-neue text-[10px]">shields</div>
          </div>
        </div>
      </ComicPanel>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="comic-textured-blue border-2 border-black rounded-lg p-3 text-center shadow-[3px_3px_0_#0A0A0A]">
          <div className="flex justify-center mb-1"><IconShield size={28} /></div>
          <div className="font-bangers text-2xl text-white">{reserve}</div>
          <div className="font-comic-neue text-xs font-bold text-white/90 uppercase">In Reserve</div>
        </div>
        <div className="comic-textured-yellow border-2 border-black rounded-lg p-3 text-center shadow-[3px_3px_0_#0A0A0A]">
          <div className="flex justify-center mb-1"><IconCheck size={28} /></div>
          <div className="font-bangers text-2xl">{spent}</div>
          <div className="font-comic-neue text-xs font-bold uppercase">Spent</div>
        </div>
        <div className="comic-textured-orange border-2 border-black rounded-lg p-3 text-center shadow-[3px_3px_0_#0A0A0A]">
          <div className="flex justify-center mb-1"><IconFlame size={28} /></div>
          <div className="font-bangers text-2xl text-white">{user?.current_streak ?? 0}</div>
          <div className="font-comic-neue text-xs font-bold text-white/90 uppercase">Current Streak</div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bangers text-2xl">YOUR SHIELD COLLECTION</h2>
        <ComicButton
          color="yellow"
          sound="whoosh"
          size="md"
          onClick={() => setShowSpend(true)}
          disabled={reserve === 0}
        >
          <span className="flex items-center gap-2">
            <IconShield size={22} />
            SPEND A SHIELD
          </span>
        </ComicButton>
      </div>

      {/* Empty state */}
      {shields.length === 0 && (
        <ComicPanel color="cream">
          <div className="text-center py-12">
            <div className="flex justify-center mb-3 opacity-50">
              <IconShield size={80} />
            </div>
            <h3 className="font-bangers text-2xl mb-2">NO SHIELDS YET</h3>
            <p className="font-comic-neue font-bold text-black/70 max-w-md mx-auto">
              Earn shields by:
            </p>
            <ul className="font-comic-neue text-sm text-black/70 mt-2 max-w-md mx-auto text-left list-none">
              <li className="flex items-center gap-2 mb-1">
                <IconBolt size={18} /> Extending a power chain every 3 days
              </li>
              <li className="flex items-center gap-2 mb-1">
                <IconBreathe size={18} /> Completing 5 breathing sessions per week
              </li>
              <li className="flex items-center gap-2 mb-1">
                <IconStar size={18} /> Earning rare achievements
              </li>
              <li className="flex items-center gap-2">
                <IconTarget size={18} /> Completing deep work focus sessions
              </li>
            </ul>
          </div>
        </ComicPanel>
      )}

      {/* Shield grid */}
      {shields.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {shields.map((shield) => (
            <ShieldCard key={shield.id} shield={shield} />
          ))}
        </div>
      )}

      {/* Spend modal */}
      {showSpend && (
        <SpendShieldModal
          reserve={reserve}
          onClose={() => setShowSpend(false)}
          onSpend={handleSpend}
        />
      )}
    </div>
  );
}

/* ---------- Single shield card ---------- */
function ShieldCard({ shield }: { shield: Shield }) {
  const rarity = SHIELD_RARITY_INFO[shield.rarity] || SHIELD_RARITY_INFO.common;
  const shieldFill = SHIELD_COLOR_INFO[shield.shield_color] || SHIELD_COLOR_INFO.blue;

  return (
    <div
      className={`comic-panel-flat p-3 text-center relative ${shield.is_spent ? "opacity-60 grayscale" : ""}`}
      style={{
        background: rarity.bg,
        animation: shield.is_spent ? "none" : "bam-pulse 2.5s ease-in-out infinite",
      }}
    >
      {/* Rarity badge */}
      <div
        className="absolute top-1 right-1 px-2 py-0.5 border-2 border-black rounded-full font-bangers text-[10px]"
        style={{ background: rarity.color, color: "#FFFFFF" }}
      >
        {rarity.label.toUpperCase()}
      </div>

      {/* Shield SVG */}
      <div className="flex justify-center my-3">
        <svg width="64" height="64" viewBox="0 0 48 48">
          <defs>
            {shield.shield_color === "rainbow" && (
              <linearGradient id={`shield-grad-${shield.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF4757" />
                <stop offset="25%" stopColor="#FFD23F" />
                <stop offset="50%" stopColor="#06D6A0" />
                <stop offset="75%" stopColor="#4361EE" />
                <stop offset="100%" stopColor="#9B5DE5" />
              </linearGradient>
            )}
            <pattern id={`shield-halftone-${shield.id}`} width="3" height="3" patternUnits="userSpaceOnUse">
              <circle cx="0.8" cy="0.8" r="0.6" fill="rgba(10,10,10,0.3)" />
            </pattern>
          </defs>
          <path
            d="M24 4 L40 10 L40 26 Q40 38 24 44 Q8 38 8 26 L8 10 Z"
            fill={shield.shield_color === "rainbow" ? `url(#shield-grad-${shield.id})` : shieldFill}
            stroke="#0A0A0A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M24 4 L40 10 L40 26 Q40 38 24 44 Q8 38 8 26 L8 10 Z"
            fill={`url(#shield-halftone-${shield.id})`}
          />
          <path
            d="M24 12 L18 22 L24 32 L30 22 Z"
            fill="#FFD23F"
            stroke="#0A0A0A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {shield.is_spent && (
            <line x1="6" y1="6" x2="42" y2="42" stroke="#FF4757" strokeWidth="4" strokeLinecap="round" />
          )}
        </svg>
      </div>

      <div className="font-bangers text-sm">
        {shield.source.replace(/_/g, " ").toUpperCase()}
      </div>
      <div className="font-comic-neue text-[10px] text-black/70 mt-1 leading-tight">
        {shield.source_detail || `Earned ${new Date(shield.earned_at).toLocaleDateString()}`}
      </div>
      {shield.is_spent && shield.spent_for_date && (
        <div className="mt-2 bg-[#FF4757] text-white border border-black rounded px-1 py-0.5 font-bangers text-[10px]">
          PROTECTED {shield.spent_for_date}
        </div>
      )}
      {!shield.is_spent && (
        <ComicBadge color="green" className="mt-2">
          AVAILABLE
        </ComicBadge>
      )}
    </div>
  );
}

/* ---------- Spend Shield Modal ---------- */
function SpendShieldModal({
  reserve, onClose, onSpend,
}: {
  reserve: number;
  onClose: () => void;
  onSpend: (targetDate: string) => void;
}) {
  // Show last 7 days for selection (excluding today)
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1));
    return d;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(4px)" }}
    >
      <ComicPanel color="cream" className="w-full max-w-lg !p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 hover:scale-110 transition-transform">
          <IconClose size={32} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <IconShield size={48} />
          <div>
            <h2 className="font-bangers text-3xl text-[#4361EE]" style={{
              WebkitTextStroke: "1.5px #0A0A0A",
              textShadow: "2px 2px 0 #0A0A0A",
            }}>
              SPEND A SHIELD
            </h2>
            <p className="font-comic-neue text-sm font-bold text-black/70">
              {reserve} shield{reserve === 1 ? "" : "s"} in reserve. Pick a missed day to protect.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {days.map((d) => {
            const dateStr = d.toISOString().split("T")[0];
            const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
            const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <button
                key={dateStr}
                onClick={() => onSpend(dateStr)}
                className="w-full flex items-center gap-3 bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0_#0A0A0A] hover:bg-[#FFD23F] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0A0A0A] transition-all"
              >
                <IconShield size={32} />
                <div className="flex-1 text-left">
                  <div className="font-bangers text-lg">{weekday}</div>
                  <div className="font-comic-neue text-xs font-bold text-black/70">{dateLabel} • {dateStr}</div>
                </div>
                <IconBolt size={20} />
              </button>
            );
          })}
        </div>

        <SpeechBubble color="yellow" tilt="right">
          <p className="font-comic-neue text-sm font-bold text-black">
            Pick a missed day from the past week. Your streak will be protected as if you completed a task that day.
          </p>
        </SpeechBubble>

        <div className="flex justify-end mt-4">
          <ComicButton color="white" size="md" sound="click" onClick={onClose}>
            Cancel
          </ComicButton>
        </div>
      </ComicPanel>
    </div>
  );
}
