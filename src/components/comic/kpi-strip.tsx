"use client";

import { useEffect, useState } from "react";
import { api, type KPIs } from "@/lib/api";
import { ComicPanel, ComicBadge, ActionWord } from "@/components/comic/comic-ui";
import {
  IconRocket, IconBolt, IconPowerLevel, IconChain, IconShield, IconBreathe,
  IconClock, IconStar, IconFlame, IconTarget,
} from "@/components/comic/comic-icons";
import { triggerBang } from "@/components/comic/bang-effect";
import { playSound } from "@/lib/sounds";

/**
 * KPIStrip — Real-time display of BAM!'s unique KPIs
 *
 * Momentum Index (MI), Avoidance Resistance Score (ARS), Power Level (PL),
 * Chain Strength, Shield Reserve, Calm Count Week
 *
 * Each KPI has its own comic-styled gauge with custom SVG icons (no emojis).
 */
export function KPIStrip({ compact = false }: { compact?: boolean }) {
  const [kpis, setKpis] = useState<KPIs | null>(null);

  const load = () => {
    api.getKPIs().then(setKpis).catch(() => {});
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30s
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (!kpis) {
    return (
      <ComicPanel color="cream" tilt="3l" className="!p-3">
        <div className="font-bangers text-lg">COMPUTING KPIs...</div>
      </ComicPanel>
    );
  }

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <MiniKPI label="MOMENTUM" value={kpis.momentum_index} icon={<IconRocket size={22} />} color="#FF4757" />
        <MiniKPI label="RESISTANCE" value={kpis.avoidance_resistance} icon={<IconBolt size={22} />} color="#4361EE" />
        <MiniKPI label="POWER" value={kpis.power_level} icon={<IconPowerLevel size={22} />} color="#06D6A0" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bangers text-2xl flex items-center gap-2">
          <IconTarget size={28} />
          BAM! HERO METRICS
        </h2>
        <ComicBadge color="yellow" onClick={() => { playSound("pop"); load(); }} className="cursor-pointer">
          REFRESH
        </ComicBadge>
      </div>

      {/* Three big composite KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPIGauge
          label="MOMENTUM INDEX"
          sub="streak x focus x done"
          value={kpis.momentum_index}
          max={100}
          icon={<IconRocket size={32} />}
          colors={["#FFD23F", "#FF6B35", "#FF4757"]}
          tilt="3l"
          onPeak={() => triggerBang({ variant: "boom", word: "BOOST!", x: 50, y: 30, size: 200 })}
        />
        <KPIGauge
          label="AVOIDANCE RESISTANCE"
          sub="speed-to-act score"
          value={kpis.avoidance_resistance}
          max={100}
          icon={<IconBolt size={32} />}
          colors={["#A0E8FF", "#4361EE", "#1B2A8F"]}
          tilt="3r"
          onPeak={() => triggerBang({ variant: "zap", word: "ZAP!", x: 50, y: 30, size: 200 })}
        />
        <KPIGauge
          label="POWER LEVEL"
          sub="energy x completion"
          value={kpis.power_level}
          max={100}
          icon={<IconPowerLevel size={32} />}
          colors={["#9EE6C5", "#06D6A0", "#047857"]}
          tilt="3l"
          onPeak={() => triggerBang({ variant: "pow", word: "POWER UP!", x: 50, y: 30, size: 200 })}
        />
      </div>

      {/* Three smaller stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStatCard
          label="CHAIN STRENGTH"
          value={kpis.chain_strength}
          suffix="days"
          icon={<IconChain size={28} />}
          color="#FFD23F"
          tilt="3r"
        />
        <MiniStatCard
          label="SHIELD RESERVE"
          value={kpis.shield_reserve}
          suffix="tokens"
          icon={<IconShield size={28} />}
          color="#4361EE"
          tilt="3l"
        />
        <MiniStatCard
          label="CALM COUNT WEEK"
          value={kpis.calm_count_week}
          suffix="sessions"
          icon={<IconBreathe size={28} />}
          color="#06D6A0"
          tilt="3r"
        />
      </div>

      {/* Underlying metrics strip */}
      <ComicPanel color="cream" tilt="3l" className="!p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <UnderlyingMetric icon={<IconClock size={20} />} label="FOCUS TODAY" value={`${kpis.focus_minutes_today}m`} />
          <UnderlyingMetric icon={<IconStar size={20} />} label="TASKS DONE" value={kpis.tasks_completed_today} />
          <UnderlyingMetric icon={<IconFlame size={20} />} label="STREAK" value={`${kpis.streak_days}d`} />
          <UnderlyingMetric icon={<IconBolt size={20} />} label="AVG LATENCY" value={`${Math.round(kpis.avg_action_latency_min)}m`} />
        </div>
      </ComicPanel>
    </div>
  );
}

/* ---------- Big KPI gauge with animated radial fill ---------- */
function KPIGauge({
  label, sub, value, max, icon, colors, tilt, onPeak,
}: {
  label: string; sub: string; value: number; max: number;
  icon: React.ReactNode; colors: [string, string, string];
  tilt: "3l" | "3r" | "none"; onPeak?: () => void;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const tier = pct >= 80 ? "ELITE" : pct >= 60 ? "STRONG" : pct >= 40 ? "STEADY" : pct >= 20 ? "BUILDING" : "WARMING";
  const tierColor = pct >= 80 ? "#FFD23F" : pct >= 60 ? "#06D6A0" : pct >= 40 ? "#4361EE" : pct >= 20 ? "#FF6B35" : "#FF4757";

  // Trigger peak celebration when value is high
  useEffect(() => {
    if (pct >= 80 && onPeak) {
      const id = setTimeout(onPeak, 600);
      return () => clearTimeout(id);
    }
  }, [pct, onPeak]);

  // SVG arc parameters
  const size = 100;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct / 100);

  return (
    <ComicPanel color="white" tilt={tilt} className="!p-4">
      <div className="flex items-center gap-3">
        {/* Radial gauge */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id={`gauge-grad-${label}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={colors[0]} />
                <stop offset="50%" stopColor={colors[1]} />
                <stop offset="100%" stopColor={colors[2]} />
              </linearGradient>
              <pattern id={`gauge-halftone-${label}`} width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.6" fill="rgba(10,10,10,0.3)" />
              </pattern>
            </defs>
            {/* Background ring */}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FFF8DC" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#gauge-halftone-ink)" strokeWidth={stroke} opacity="0.4" />
            {/* Progress arc */}
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={`url(#gauge-grad-${label})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.5, 0.64, 1)" }}
            />
            {/* Halftone overlay */}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={`url(#gauge-halftone-${label})`} strokeWidth={stroke}
              strokeDasharray={circ} strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ pointerEvents: "none", transition: "stroke-dashoffset 0.8s" }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="font-bangers text-2xl leading-none" style={{ color: colors[1] }}>
              {Math.round(value)}
            </div>
            <div className="font-comic-neue text-[9px] font-bold text-black/60">/ {max}</div>
          </div>
        </div>
        {/* Label + tier */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">{icon}</div>
            <div className="font-bangers text-base leading-tight">{label}</div>
          </div>
          <div className="font-comic-neue text-xs italic text-black/70">{sub}</div>
          <div className="mt-2">
            <ComicBadge color="yellow" >
              <span style={{ color: tierColor }}>{tier}</span>
            </ComicBadge>
          </div>
        </div>
      </div>
    </ComicPanel>
  );
}

function MiniStatCard({
  label, value, suffix, icon, color, tilt,
}: {
  label: string; value: number; suffix: string;
  icon: React.ReactNode; color: string; tilt: "3l" | "3r" | "none";
}) {
  return (
    <ComicPanel color="white" tilt={tilt} className="!p-3">
      <div className="flex flex-col items-center text-center gap-1">
        <div className="flex items-center gap-1">
          {icon}
        </div>
        <div className="font-bangers text-2xl" style={{ color }}>{value}</div>
        <div className="font-comic-neue text-[10px] font-bold uppercase tracking-wider">{suffix}</div>
        <div className="font-comic-neue text-[10px] text-black/60 leading-tight">{label}</div>
      </div>
    </ComicPanel>
  );
}

function MiniKPI({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div
      className="comic-panel-flat p-2 text-center"
      style={{ background: color }}
    >
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="font-bangers text-lg leading-none" style={{ WebkitTextStroke: "0.5px #0A0A0A" }}>{Math.round(value)}</div>
      <div className="font-comic-neue text-[9px] font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}

function UnderlyingMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div>{icon}</div>
      <div className="font-bangers text-lg">{value}</div>
      <div className="font-comic-neue text-[10px] font-bold uppercase tracking-wider text-black/70">{label}</div>
    </div>
  );
}
