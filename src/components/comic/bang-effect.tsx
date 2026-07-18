"use client";

/**
 * BAM! — BangEffect Component
 *
 * Real comic-book explosion overlay matching the reference image:
 *  - Cloud-bordered burst (puffy white clouds with black outlines)
 *  - Radial orange/yellow stripes (sunburst pattern)
 *  - Halftone dot texture overlay
 *  - Bright yellow gradient center with glow
 *  - Scattered stars around the burst
 *  - Bold action word text inside (BAM!, POW!, ZAP!, etc.)
 *  - Animated entrance: scale + rotate + jitter + fade
 *
 * Triggered via <BangEffect/> mounted at app root + useBangEffect() hook.
 * Used for: task complete, XP gain, achievement unlock, level up,
 * plan generation, mood submit — any meaningful action.
 */

import { useEffect, useState, CSSProperties } from "react";

export type BangVariant = "bam" | "pow" | "zap" | "boom" | "wham" | "kapow" | "boom-large" | "levelup";

interface BangInstance {
  id: number;
  x: number;        // 0-100 (percent of viewport)
  y: number;        // 0-100
  variant: BangVariant;
  word: string;
  size: number;     // base px size
  color: string;    // primary color
}

let _id = 0;
const listeners = new Set<(b: BangInstance) => void>();

/** Trigger a BANG! effect anywhere in the app. */
export function triggerBang(opts?: {
  x?: number;       // default: center
  y?: number;
  variant?: BangVariant;
  word?: string;
  size?: number;
  color?: string;
}) {
  const bang: BangInstance = {
    id: ++_id,
    x: opts?.x ?? 50,
    y: opts?.y ?? 50,
    variant: opts?.variant ?? "bam",
    word: opts?.word ?? "BAM!",
    size: opts?.size ?? 220,
    color: opts?.color ?? "#FFD23F",
  };
  listeners.forEach((fn) => fn(bang));
}

/** React hook to trigger bangs imperatively. */
export function useBangEffect() {
  return triggerBang;
}

/* ---------- Variant config ---------- */
const VARIANT_CONFIG: Record<BangVariant, {
  word: string;
  colors: [string, string, string]; // inner, mid, outer burst
  textColor: string;
  textSize: string;
  rotate: number;
}> = {
  bam:        { word: "BAM!",   colors: ["#FFF59D", "#FFD23F", "#FF6B35"], textColor: "#FF4757", textSize: "3.4rem", rotate: -8 },
  pow:        { word: "POW!",   colors: ["#FFB3BC", "#FF4757", "#C9182A"], textColor: "#FFD23F", textSize: "3.4rem", rotate: 6 },
  zap:        { word: "ZAP!",   colors: ["#A0E8FF", "#4361EE", "#1B2A8F"], textColor: "#FFD23F", textSize: "3.4rem", rotate: -4 },
  boom:       { word: "BOOM!",  colors: ["#FFD23F", "#FF6B35", "#C9182A"], textColor: "#FFFFFF", textSize: "3.0rem", rotate: 4 },
  wham:       { word: "WHAM!",  colors: ["#FFB3BC", "#FF69B4", "#9B2D5E"], textColor: "#FFD23F", textSize: "3.2rem", rotate: -6 },
  kapow:      { word: "KAPOW!", colors: ["#A0E8FF", "#9B5DE5", "#5A189A"], textColor: "#FFD23F", textSize: "2.8rem", rotate: 8 },
  "boom-large": { word: "BOOM!",  colors: ["#FFD23F", "#FF6B35", "#C9182A"], textColor: "#FFFFFF", textSize: "4.4rem", rotate: 4 },
  levelup:    { word: "LEVEL UP!", colors: ["#FFD23F", "#06D6A0", "#4361EE"], textColor: "#FFFFFF", textSize: "2.4rem", rotate: -3 },
};

/* ---------- Single BANG instance ---------- */
function BangBurst({ bang, onDone }: { bang: BangInstance; onDone: (id: number) => void }) {
  const cfg = VARIANT_CONFIG[bang.variant];

  useEffect(() => {
    const t = setTimeout(() => onDone(bang.id), 1400);
    return () => clearTimeout(t);
  }, [bang.id, onDone]);

  const wrapStyle: CSSProperties = {
    position: "fixed",
    left: `${bang.x}%`,
    top: `${bang.y}%`,
    transform: "translate(-50%, -50%)",
    width: bang.size,
    height: bang.size,
    pointerEvents: "none",
    zIndex: 9999,
    animation: "bang-explode 0.45s cubic-bezier(0.22, 1.4, 0.36, 1) both, bang-fade 1s ease-out 0.4s forwards",
  };

  // Star positions (relative percentages around the burst)
  const stars = [
    { x: -10, y: 5,  size: 22, rotate: 15 },
    { x: 95,  y: -5, size: 28, rotate: -20 },
    { x: 50,  y: -20, size: 24, rotate: 5 },
    { x: 105, y: 60, size: 20, rotate: 30 },
    { x: -15, y: 80, size: 26, rotate: -10 },
    { x: 70,  y: 105, size: 22, rotate: 25 },
    { x: 10,  y: 110, size: 18, rotate: -15 },
    { x: -20, y: 40, size: 18, rotate: 40 },
  ];

  return (
    <div style={wrapStyle}>
      {/* Radial sunburst stripes (conic gradient) */}
      <svg viewBox="0 0 200 200" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        animation: "bang-spin-fast 0.6s ease-out",
      }}>
        <defs>
          <radialGradient id={`bang-grad-${bang.id}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={cfg.colors[0]} />
            <stop offset="55%" stopColor={cfg.colors[1]} />
            <stop offset="100%" stopColor={cfg.colors[2]} />
          </radialGradient>
          <pattern id={`bang-halftone-${bang.id}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(10,10,10,0.35)" />
          </pattern>
          <clipPath id={`bang-cloud-clip-${bang.id}`}>
            <path d="M 100,15
                     C 80,8 60,12 55,28
                     C 35,22 18,32 22,52
                     C 8,58 5,78 22,88
                     C 12,98 18,118 38,118
                     C 42,135 62,140 78,130
                     C 88,145 112,145 122,130
                     C 138,140 158,135 162,118
                     C 182,118 188,98 178,88
                     C 195,78 192,58 178,52
                     C 182,32 165,22 145,28
                     C 140,12 120,8 100,15 Z" />
          </clipPath>
        </defs>

        {/* Cloud-bordered burst body */}
        <g>
          {/* Cloud border (white puffy with black outline) */}
          <path
            d="M 100,15
               C 80,8 60,12 55,28
               C 35,22 18,32 22,52
               C 8,58 5,78 22,88
               C 12,98 18,118 38,118
               C 42,135 62,140 78,130
               C 88,145 112,145 122,130
               C 138,140 158,135 162,118
               C 182,118 188,98 178,88
               C 195,78 192,58 178,52
               C 182,32 165,22 145,28
               C 140,12 120,8 100,15 Z"
            fill="#FFFFFF"
            stroke="#0A0A0A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Burst inside cloud (clipped) */}
          <g clipPath={`url(#bang-cloud-clip-${bang.id})`}>
            {/* Radial gradient base */}
            <circle cx="100" cy="100" r="80" fill={`url(#bang-grad-${bang.id})`} />
            {/* Sunburst stripes */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              return (
                <path
                  key={i}
                  d={`M 100,100 L ${100 + 90 * Math.cos((angle - 7.5) * Math.PI / 180)} ${100 + 90 * Math.sin((angle - 7.5) * Math.PI / 180)} L ${100 + 90 * Math.cos((angle + 7.5) * Math.PI / 180)} ${100 + 90 * Math.sin((angle + 7.5) * Math.PI / 180)} Z`}
                  fill={i % 2 === 0 ? cfg.colors[1] : cfg.colors[2]}
                  opacity={0.85}
                />
              );
            })}
            {/* Halftone overlay */}
            <rect x="0" y="0" width="200" height="200" fill={`url(#bang-halftone-${bang.id})`} />
            {/* Glow center */}
            <circle cx="100" cy="100" r="35" fill={cfg.colors[0]} opacity="0.9" />
            <circle cx="100" cy="100" r="20" fill="#FFFFFF" opacity="0.7" />
          </g>

          {/* Re-draw cloud outline on top for crisp edge */}
          <path
            d="M 100,15
               C 80,8 60,12 55,28
               C 35,22 18,32 22,52
               C 8,58 5,78 22,88
               C 12,98 18,118 38,118
               C 42,135 62,140 78,130
               C 88,145 112,145 122,130
               C 138,140 158,135 162,118
               C 182,118 188,98 178,88
               C 195,78 192,58 178,52
               C 182,32 165,22 145,28
               C 140,12 120,8 100,15 Z"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Action word text inside */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}>
        <span style={{
          fontFamily: "var(--font-bangers), 'Bangers', cursive",
          fontSize: cfg.textSize,
          color: cfg.textColor,
          letterSpacing: "0.04em",
          transform: `rotate(${cfg.rotate}deg) scale(1)`,
          textShadow: `
            -2px -2px 0 #0A0A0A, 2px -2px 0 #0A0A0A,
            -2px 2px 0 #0A0A0A, 2px 2px 0 #0A0A0A,
            0 4px 0 #0A0A0A,
            6px 6px 0 rgba(10,10,10,0.35)
          `,
          WebkitTextStroke: "1.5px #0A0A0A",
          animation: "bang-text-pop 0.55s cubic-bezier(0.34, 1.7, 0.64, 1) both",
        }}>
          {bang.word || cfg.word}
        </span>
      </div>

      {/* Scattered stars around the burst */}
      {stars.map((s, i) => (
        <svg key={i} viewBox="0 0 24 24" style={{
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          transform: `rotate(${s.rotate}deg)`,
          animation: `bang-star-pop 0.5s cubic-bezier(0.34, 1.6, 0.64, 1) ${0.1 + i * 0.03}s both`,
        }}>
          <path
            d="M12 1 L14.5 8 L22 9 L16 14 L18 22 L12 18 L6 22 L8 14 L2 9 L9.5 8 Z"
            fill={cfg.colors[0]}
            stroke="#0A0A0A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ))}

      {/* Smoke puff particles */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 360) / 6 + 30;
        const dist = 90;
        return (
          <div key={`p-${i}`} style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 18,
            height: 18,
            background: "#FFFFFF",
            border: "2.5px solid #0A0A0A",
            borderRadius: "50%",
            transform: `translate(-50%, -50%) translate(${Math.cos(angle * Math.PI / 180) * dist}px, ${Math.sin(angle * Math.PI / 180) * dist}px) scale(0.5)`,
            animation: `bang-particle-fly 0.9s ease-out ${0.1 + i * 0.04}s both`,
            '--tx': `${Math.cos(angle * Math.PI / 180) * (dist + 50)}px`,
            '--ty': `${Math.sin(angle * Math.PI / 180) * (dist + 50)}px`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}

/* ---------- Provider: mount once at app root ---------- */
export function BangProvider({ children }: { children: React.ReactNode }) {
  const [bangs, setBangs] = useState<BangInstance[]>([]);

  useEffect(() => {
    const handler = (b: BangInstance) => {
      setBangs((prev) => [...prev, b]);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const removeBang = (id: number) => {
    setBangs((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <>
      {children}
      {bangs.map((b) => (
        <BangBurst key={b.id} bang={b} onDone={removeBang} />
      ))}
    </>
  );
}
