"use client";

/**
 * BAM! — Custom Comic Icon System
 * Hand-crafted SVG icons in comic-book style (bold black outlines, vibrant fills,
 * halftone shading). Replaces ALL default emojis with consistent comic-art icons.
 *
 * Every icon:
 *  - Uses 3px black strokes (matches comic panel borders)
 *  - Uses halftone dot overlay for shading
 *  - Scales cleanly at any size
 *  - Has a `bang` prop for a tilted action-word style variant
 */

import { CSSProperties } from "react";

type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  fill?: string;
  stroke?: string;
};

const baseSvgProps = (size: number, className?: string, style?: CSSProperties) => ({
  width: size,
  height: size,
  viewBox: "0 0 48 48",
  className,
  style,
  xmlns: "http://www.w3.org/2000/svg",
});

/* ---------- Halftone pattern def (reused) ---------- */
function HalftoneDef() {
  return (
    <defs>
      <pattern id="bam-halftone" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" fill="rgba(10,10,10,0.35)" />
      </pattern>
      <pattern id="bam-halftone-white" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" fill="rgba(255,255,255,0.4)" />
      </pattern>
      <radialGradient id="bam-glow-yellow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="60%" stopColor="#FFD23F" />
        <stop offset="100%" stopColor="#FF6B35" />
      </radialGradient>
      <radialGradient id="bam-glow-red" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFB3BC" />
        <stop offset="60%" stopColor="#FF4757" />
        <stop offset="100%" stopColor="#C9182A" />
      </radialGradient>
      <linearGradient id="bam-steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#D0D5DD" />
        <stop offset="100%" stopColor="#7B8190" />
      </linearGradient>
      <linearGradient id="bam-fire" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#C9182A" />
        <stop offset="50%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="#FFD23F" />
      </linearGradient>
      <linearGradient id="bam-leaf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9EE6C5" />
        <stop offset="100%" stopColor="#06D6A0" />
      </linearGradient>
      <linearGradient id="bam-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7BA0FF" />
        <stop offset="100%" stopColor="#4361EE" />
      </linearGradient>
    </defs>
  );
}

/* ============================================================
   ICONS — each one is a self-contained comic illustration
   ============================================================ */

/* HQ / Home base — comic house with star */
export function IconHQ({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M6 22 L24 6 L42 22 L42 42 L6 42 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M6 22 L24 6 L42 22" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <rect x="19" y="28" width="10" height="14" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="9" y="28" width="7" height="7" fill="#FFF8DC" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="32" y="28" width="7" height="7" fill="#FFF8DC" stroke="#0A0A0A" strokeWidth="3" />
      <path d="M30 4 L32 9 L37 9 L33 12 L35 17 L30 14 L25 17 L27 12 L23 9 L28 9 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* Task / Mission — clipboard with checkmark */
export function IconTask({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="8" y="8" width="32" height="36" rx="3" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="8" y="8" width="32" height="36" rx="3" fill="url(#bam-halftone)" />
      <rect x="16" y="4" width="16" height="10" rx="2" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" />
      <path d="M14 22 L22 30 L34 16" fill="none" stroke="#06D6A0" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 22 L22 30 L34 16" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="36" x2="34" y2="36" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Focus Timer — comic alarm clock */
export function IconFocus({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="12" cy="10" r="4" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2.5" />
      <circle cx="36" cy="10" r="4" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2.5" />
      <circle cx="24" cy="26" r="16" fill="#4361EE" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="26" r="16" fill="url(#bam-halftone-white)" />
      <circle cx="24" cy="26" r="12" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="2" />
      <line x1="24" y1="26" x2="24" y2="16" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="26" x2="32" y2="26" stroke="#FF4757" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="26" r="2" fill="#0A0A0A" />
      <circle cx="14" cy="26" r="1.2" fill="#0A0A0A" />
      <circle cx="34" cy="26" r="1.2" fill="#0A0A0A" />
      <circle cx="24" cy="16" r="1.2" fill="#0A0A0A" />
      <circle cx="24" cy="36" r="1.2" fill="#0A0A0A" />
    </svg>
  );
}

/* AI Coach — comic robot head */
export function IconCoach({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="6" y="14" width="36" height="26" rx="5" fill="#06D6A0" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="6" y="14" width="36" height="26" rx="5" fill="url(#bam-halftone)" />
      <rect x="14" y="22" width="8" height="6" rx="1" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="2" />
      <rect x="26" y="22" width="8" height="6" rx="1" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="2" />
      <circle cx="18" cy="25" r="2" fill="#4361EE" />
      <circle cx="30" cy="25" r="2" fill="#4361EE" />
      <path d="M14 33 Q24 38 34 33" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="6" x2="24" y2="14" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="5" r="3" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" />
      <rect x="2" y="22" width="4" height="6" rx="1" fill="#9B5DE5" stroke="#0A0A0A" strokeWidth="2" />
      <rect x="42" y="22" width="4" height="6" rx="1" fill="#9B5DE5" stroke="#0A0A0A" strokeWidth="2" />
    </svg>
  );
}

/* Map / Plan — comic treasure map */
export function IconPlan({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M6 10 Q6 6 10 6 L18 8 L30 6 L38 8 Q42 6 42 10 L42 38 Q42 42 38 42 L30 40 L18 42 L10 40 Q6 42 6 38 Z" fill="#FFFEF7" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M6 10 Q6 6 10 6 L18 8 L30 6 L38 8 Q42 6 42 10 L42 38 Q42 42 38 42 L30 40 L18 42 L10 40 Q6 42 6 38 Z" fill="url(#bam-halftone)" />
      <path d="M14 14 Q20 12 22 18 Q24 24 30 22 Q34 21 34 28" fill="none" stroke="#FF4757" strokeWidth="3" strokeDasharray="4 3" strokeLinecap="round" />
      <path d="M30 28 L34 24 L36 30 L32 32 Z" fill="#0A0A0A" />
      <circle cx="14" cy="14" r="2.5" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" />
      <path d="M34 32 L36 36 L32 36 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" />
      <path d="M22 30 L24 34 L26 30 Z" fill="#06D6A0" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* Trophy / Achievement — comic gold cup */
export function IconTrophy({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M12 6 L36 6 L36 18 Q36 28 24 28 Q12 28 12 18 Z" fill="url(#bam-glow-yellow)" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 6 L36 6 L36 18 Q36 28 24 28 Q12 28 12 18 Z" fill="url(#bam-halftone)" />
      <path d="M12 10 Q4 12 6 18 Q8 22 12 20" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 10 Q44 12 42 18 Q40 22 36 20" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <rect x="20" y="28" width="8" height="6" fill="#FF6B35" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="14" y="34" width="20" height="6" rx="1" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" />
      <path d="M19 14 L22 18 L19 22 L24 19 L29 22 L26 18 L29 14 L24 17 Z" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* Mood — comic smiley with comic outline */
export function IconMood({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="24" cy="24" r="18" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="18" fill="url(#bam-halftone)" />
      <ellipse cx="17" cy="20" rx="2.5" ry="3.5" fill="#0A0A0A" />
      <ellipse cx="31" cy="20" rx="2.5" ry="3.5" fill="#0A0A0A" />
      <ellipse cx="16" cy="19" rx="0.8" ry="1.2" fill="#FFFFFF" />
      <ellipse cx="30" cy="19" rx="0.8" ry="1.2" fill="#FFFFFF" />
      <path d="M14 28 Q24 38 34 28" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="11" cy="26" r="2" fill="#FF69B4" stroke="#0A0A0A" strokeWidth="1.5" opacity="0.7" />
      <circle cx="37" cy="26" r="2" fill="#FF69B4" stroke="#0A0A0A" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

/* Star — comic 5-point star */
export function IconStar({ size = 32, className, style, fill = "#FFD23F" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 4 L29 17 L43 18 L32 27 L36 41 L24 33 L12 41 L16 27 L5 18 L19 17 Z" fill={fill} stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 4 L29 17 L43 18 L32 27 L36 41 L24 33 L12 41 L16 27 L5 18 L19 17 Z" fill="url(#bam-halftone)" />
      <path d="M24 12 L26 18 L32 18 L27 22 L29 28 L24 24 L19 28 L21 22 L16 18 L22 18 Z" fill="#FFFFFF" opacity="0.4" />
    </svg>
  );
}

/* XP / Power bolt */
export function IconBolt({ size = 32, className, style, fill = "#FF4757" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M28 4 L10 26 L20 26 L18 44 L38 20 L28 20 L32 4 Z" fill={fill} stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 4 L10 26 L20 26 L18 44 L38 20 L28 20 L32 4 Z" fill="url(#bam-halftone)" />
      <path d="M26 8 L14 24 L20 24 L20 30 L30 18 L26 18 L28 8 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* Streak / Fire flame */
export function IconFlame({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 4 Q14 12 18 22 Q12 24 14 32 Q14 42 24 44 Q34 42 34 32 Q36 24 30 22 Q34 12 24 4 Z" fill="url(#bam-fire)" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 4 Q14 12 18 22 Q12 24 14 32 Q14 42 24 44 Q34 42 34 32 Q36 24 30 22 Q34 12 24 4 Z" fill="url(#bam-halftone)" />
      <path d="M24 16 Q20 22 22 28 Q24 32 24 36 Q24 32 26 28 Q28 22 24 16 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 22 Q22 26 23 30 Q24 33 24 35 Q24 33 25 30 Q26 26 24 22 Z" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

/* Power Chain — chain links (habit stacking) */
export function IconChain({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <ellipse cx="14" cy="18" rx="9" ry="6" fill="none" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 14 18)" />
      <ellipse cx="14" cy="18" rx="9" ry="6" fill="url(#bam-halftone)" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 14 18)" />
      <ellipse cx="14" cy="18" rx="5" ry="3" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" transform="rotate(-30 14 18)" />
      <ellipse cx="34" cy="30" rx="9" ry="6" fill="none" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 34 30)" />
      <ellipse cx="34" cy="30" rx="9" ry="6" fill="url(#bam-halftone)" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 34 30)" />
      <ellipse cx="34" cy="30" rx="5" ry="3" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2" transform="rotate(-30 34 30)" />
      <path d="M22 22 L26 26" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Streak Shield — comic knight shield */
export function IconShield({ size = 32, className, style, fill = "#4361EE" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 4 L40 10 L40 26 Q40 38 24 44 Q8 38 8 26 L8 10 Z" fill={fill} stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 4 L40 10 L40 26 Q40 38 24 44 Q8 38 8 26 L8 10 Z" fill="url(#bam-halftone-white)" />
      <path d="M24 4 L40 10 L40 26 Q40 38 24 44 Q8 38 8 26 L8 10 Z" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 12 L18 22 L24 32 L30 22 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 16 L21 22 L24 28 L27 22 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* Breathe — comic wind/lungs */
export function IconBreathe({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M10 14 Q6 18 8 28 Q10 38 16 38 Q20 38 20 30 L20 14 Q20 10 16 10 Q12 10 10 14 Z" fill="#9EE6C5" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 14 Q42 18 40 28 Q38 38 32 38 Q28 38 28 30 L28 14 Q28 10 32 10 Q36 10 38 14 Z" fill="#9EE6C5" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M10 14 Q6 18 8 28 Q10 38 16 38 Q20 38 20 30 L20 14 Q20 10 16 10 Q12 10 10 14 Z" fill="url(#bam-halftone)" />
      <path d="M38 14 Q42 18 40 28 Q38 38 32 38 Q28 38 28 30 L28 14 Q28 10 32 10 Q36 10 38 14 Z" fill="url(#bam-halftone)" />
      <path d="M20 18 Q24 14 28 18" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 22 Q24 19 26 22" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 24 Q2 24 2 22" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
      <path d="M44 24 Q46 24 46 22" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Sound on — comic speaker waves */
export function IconSoundOn({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M4 18 L12 18 L22 8 L22 40 L12 30 L4 30 Z" fill="#06D6A0" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M4 18 L12 18 L22 8 L22 40 L12 30 L4 30 Z" fill="url(#bam-halftone)" />
      <path d="M28 14 Q34 18 34 24 Q34 30 28 34" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 10 Q42 16 42 24 Q42 32 32 38" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 6 Q46 14 46 24 Q46 34 36 42" fill="none" stroke="#FF4757" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Sound off — comic speaker with X */
export function IconSoundOff({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M4 18 L12 18 L22 8 L22 40 L12 30 L4 30 Z" fill="#7B8190" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M4 18 L12 18 L22 8 L22 40 L12 30 L4 30 Z" fill="url(#bam-halftone)" />
      <line x1="28" y1="14" x2="42" y2="34" stroke="#FF4757" strokeWidth="4" strokeLinecap="round" />
      <line x1="42" y1="14" x2="28" y2="34" stroke="#FF4757" strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="14" x2="42" y2="34" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="14" x2="28" y2="34" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Logout — comic door with arrow */
export function IconLogout({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="4" y="6" width="26" height="36" rx="2" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="4" y="6" width="26" height="36" rx="2" fill="url(#bam-halftone)" />
      <circle cx="22" cy="24" r="2" fill="#0A0A0A" />
      <path d="M30 24 L44 24" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 24 L44 24" stroke="#FF4757" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 18 L44 24 L38 30" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 18 L44 24 L38 30" fill="none" stroke="#FF4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Menu / hamburger — comic stacked lines */
export function IconMenu({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <rect x="6" y="10" width="36" height="6" rx="2" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2.5" />
      <rect x="6" y="21" width="36" height="6" rx="2" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2.5" />
      <rect x="6" y="32" width="36" height="6" rx="2" fill="#4361EE" stroke="#0A0A0A" strokeWidth="2.5" />
    </svg>
  );
}

/* Close X — comic crossed-out */
export function IconClose({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <circle cx="24" cy="24" r="20" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="20" fill="url(#bam-halftone)" />
      <line x1="14" y1="14" x2="34" y2="34" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <line x1="34" y1="14" x2="14" y2="34" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <line x1="14" y1="14" x2="34" y2="34" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="14" x2="14" y2="34" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Check — comic check in circle */
export function IconCheck({ size = 32, className, style, fill = "#06D6A0" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="24" cy="24" r="20" fill={fill} stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="20" fill="url(#bam-halftone)" />
      <path d="M12 24 L20 32 L36 14" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 24 L20 32 L36 14" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Plus — comic plus in circle */
export function IconPlus({ size = 32, className, style, fill = "#06D6A0" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="24" cy="24" r="20" fill={fill} stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="20" fill="url(#bam-halftone)" />
      <line x1="24" y1="12" x2="24" y2="36" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <line x1="12" y1="24" x2="36" y2="24" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <line x1="24" y1="12" x2="24" y2="36" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="24" x2="36" y2="24" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Trash — comic trash can */
export function IconTrash({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M10 14 L38 14 L36 42 L12 42 Z" fill="#7B8190" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M10 14 L38 14 L36 42 L12 42 Z" fill="url(#bam-halftone)" />
      <line x1="16" y1="20" x2="18" y2="38" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="20" x2="24" y2="38" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="20" x2="30" y2="38" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="6" y="8" width="36" height="6" rx="2" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" />
      <path d="M18 8 L18 4 L30 4 L30 8" fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/* Edit / pencil — comic pencil */
export function IconEdit({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M4 44 L12 36 L36 12 L42 18 L18 42 L10 50 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" transform="translate(0,-4)" />
      <path d="M4 44 L12 36 L36 12 L42 18 L18 42 L10 50 Z" fill="url(#bam-halftone)" transform="translate(0,-4)" />
      <path d="M12 36 L18 42" stroke="#0A0A0A" strokeWidth="3" />
      <path d="M36 12 L42 18" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="33" y="9" width="12" height="6" rx="1" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2.5" transform="rotate(45 39 12)" />
      <path d="M4 44 L8 48" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Filter — comic funnel */
export function IconFilter({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M4 8 L44 8 L28 26 L28 40 L20 44 L20 26 Z" fill="#4361EE" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M4 8 L44 8 L28 26 L28 40 L20 44 L20 26 Z" fill="url(#bam-halftone-white)" />
    </svg>
  );
}

/* Sparkle / Magic — comic 4-point sparkle */
export function IconSparkle({ size = 32, className, style, fill = "#FF69B4" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 4 Q26 18 24 24 Q18 26 4 24 Q18 22 24 24 Q26 18 24 4 Z" fill={fill} stroke="#0A0A0A" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 44 Q22 30 24 24 Q30 22 44 24 Q30 26 24 24 Q22 30 24 44 Z" fill={fill} stroke="#0A0A0A" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 4 Q26 18 24 24 Q18 26 4 24 Q18 22 24 24 Q26 18 24 4 Z" fill="url(#bam-halftone)" />
      <path d="M24 44 Q22 30 24 24 Q30 22 44 24 Q30 26 24 24 Q22 30 24 44 Z" fill="url(#bam-halftone)" />
      <circle cx="24" cy="24" r="3" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* Eye / View */
export function IconEye({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M4 24 Q24 8 44 24 Q24 40 4 24 Z" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="8" fill="#4361EE" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="4" fill="#0A0A0A" />
      <circle cx="22" cy="22" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/* Arrow right — comic arrow */
export function IconArrowRight({ size = 32, className, style, fill = "#0A0A0A" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <path d="M6 22 L28 22 L28 12 L44 24 L28 36 L28 26 L6 26 Z" fill={fill} stroke="#0A0A0A" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/* Send — comic paper plane */
export function IconSend({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M4 24 L44 4 L40 44 L24 32 L12 42 L16 28 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M4 24 L44 4 L24 32 Z" fill="#FF6B35" stroke="#0A0A0A" strokeWidth="2" />
      <path d="M24 32 L24 32" stroke="#0A0A0A" strokeWidth="3" />
    </svg>
  );
}

/* Heart — for mood */
export function IconHeart({ size = 32, className, style, fill = "#FF4757" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 42 Q4 30 4 18 Q4 8 14 8 Q20 8 24 14 Q28 8 34 8 Q44 8 44 18 Q44 30 24 42 Z" fill={fill} stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 42 Q4 30 4 18 Q4 8 14 8 Q20 8 24 14 Q28 8 34 8 Q44 8 44 18 Q44 30 24 42 Z" fill="url(#bam-halftone)" />
      <path d="M14 14 Q10 18 14 22" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/* Energy / Lightning battery */
export function IconEnergy({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="6" y="14" width="32" height="20" rx="2" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="6" y="14" width="32" height="20" rx="2" fill="url(#bam-halftone)" />
      <rect x="38" y="20" width="4" height="8" fill="#0A0A0A" />
      <path d="M22 14 L16 26 L22 26 L20 34 L28 22 L22 22 L24 14 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* Clock — for time */
export function IconClock({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="24" cy="24" r="18" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="18" fill="url(#bam-halftone)" />
      <line x1="24" y1="24" x2="24" y2="12" stroke="#FF4757" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="24" x2="32" y2="24" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2" fill="#0A0A0A" />
      <circle cx="24" cy="8" r="1.5" fill="#0A0A0A" />
    </svg>
  );
}

/* Calendar */
export function IconCalendar({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="6" y="8" width="36" height="36" rx="3" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="6" y="8" width="36" height="36" rx="3" fill="url(#bam-halftone)" />
      <rect x="6" y="8" width="36" height="8" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" />
      <line x1="14" y1="4" x2="14" y2="12" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <line x1="34" y1="4" x2="34" y2="12" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      <rect x="12" y="22" width="6" height="6" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" />
      <rect x="21" y="22" width="6" height="6" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" />
      <rect x="30" y="22" width="6" height="6" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" />
      <rect x="12" y="32" width="6" height="6" fill="#06D6A0" stroke="#0A0A0A" strokeWidth="1.5" />
      <rect x="21" y="32" width="6" height="6" fill="#06D6A0" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* Chart / Stats */
export function IconChart({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="4" y="4" width="40" height="40" rx="3" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="8" y="24" width="6" height="16" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2" />
      <rect x="18" y="16" width="6" height="24" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" />
      <rect x="28" y="20" width="6" height="20" fill="#06D6A0" stroke="#0A0A0A" strokeWidth="2" />
      <line x1="6" y1="40" x2="42" y2="40" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* Pause */
export function IconPause({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="24" cy="24" r="20" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="20" fill="url(#bam-halftone)" />
      <rect x="16" y="14" width="6" height="20" fill="#0A0A0A" />
      <rect x="26" y="14" width="6" height="20" fill="#0A0A0A" />
    </svg>
  );
}

/* Play */
export function IconPlay({ size = 32, className, style, fill = "#06D6A0" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="24" cy="24" r="20" fill={fill} stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="20" fill="url(#bam-halftone)" />
      <path d="M18 14 L36 24 L18 34 Z" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/* Reset / Restart */
export function IconReset({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M40 24 Q40 36 30 42 Q18 46 10 38 Q4 30 8 20 Q14 10 24 12" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 24 Q40 36 30 42 Q18 46 10 38 Q4 30 8 20 Q14 10 24 12" fill="none" stroke="#4361EE" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 4 L24 16 L34 10 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/* Distraction / Phone */
export function IconDistraction({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="14" y="4" width="20" height="40" rx="3" fill="#0A0A0A" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="16" y="8" width="16" height="28" fill="#4361EE" />
      <rect x="16" y="8" width="16" height="28" fill="url(#bam-halftone-white)" />
      <circle cx="24" cy="40" r="1.5" fill="#FFD23F" />
      <path d="M30 14 L40 6" stroke="#FF4757" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 6 L36 4 L42 4 L42 10 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* Tag / Category */
export function IconTag({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M4 24 L24 4 L44 4 L44 24 L24 44 Z" fill="#FF6B35" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M4 24 L24 4 L44 4 L44 24 L24 44 Z" fill="url(#bam-halftone)" />
      <circle cx="34" cy="14" r="3" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" />
    </svg>
  );
}

/* Priority / Warning */
export function IconPriority({ size = 32, className, style, fill = "#FF4757" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 4 L44 40 L4 40 Z" fill={fill} stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 4 L44 40 L4 40 Z" fill="url(#bam-halftone)" />
      <line x1="24" y1="16" x2="24" y2="28" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="34" r="2.5" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* Target / Goal */
export function IconTarget({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <circle cx="24" cy="24" r="20" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="14" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="8" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="3" fill="#FF4757" stroke="#0A0A0A" strokeWidth="1.5" />
      <path d="M24 4 L24 0 M44 24 L48 24 M24 44 L24 48 M4 24 L0 24" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Lock — for locked achievements */
export function IconLock({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <rect x="8" y="20" width="32" height="24" rx="3" fill="#7B8190" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="8" y="20" width="32" height="24" rx="3" fill="url(#bam-halftone)" />
      <path d="M14 20 L14 14 Q14 4 24 4 Q34 4 34 14 L34 20" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="30" r="3" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" />
      <rect x="22" y="32" width="4" height="6" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* Rocket — for momentum */
export function IconRocket({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 4 Q34 8 36 22 L36 32 L12 32 L12 22 Q14 8 24 4 Z" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="24" cy="18" r="4" fill="#4361EE" stroke="#0A0A0A" strokeWidth="2.5" />
      <path d="M12 28 L4 36 L12 36 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M36 28 L44 36 L36 36 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 32 L16 38 L20 36 L20 32 Z" fill="#FF6B35" stroke="#0A0A0A" strokeWidth="2" />
      <path d="M28 32 L28 38 L32 36 L32 32 Z" fill="#FF6B35" stroke="#0A0A0A" strokeWidth="2" />
      <path d="M22 36 L24 44 L26 36 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" />
    </svg>
  );
}

/* Wind — for breathing */
export function IconWind({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <path d="M4 16 Q14 16 18 16 Q24 16 24 12 Q24 8 20 8" fill="none" stroke="#0A0A0A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M4 16 Q14 16 18 16 Q24 16 24 12 Q24 8 20 8" fill="none" stroke="#06D6A0" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 24 Q20 24 28 24 Q36 24 36 20 Q36 16 32 16" fill="none" stroke="#0A0A0A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M4 24 Q20 24 28 24 Q36 24 36 20 Q36 16 32 16" fill="none" stroke="#06D6A0" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 32 Q16 32 22 32 Q30 32 30 28 Q30 24 26 24" fill="none" stroke="#0A0A0A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M4 32 Q16 32 22 32 Q30 32 30 28 Q30 24 26 24" fill="none" stroke="#06D6A0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Snap — broken chain link (for chain break) */
export function IconSnap({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <ellipse cx="14" cy="18" rx="9" ry="6" fill="none" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 14 18)" />
      <ellipse cx="14" cy="18" rx="9" ry="6" fill="url(#bam-halftone)" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 14 18)" />
      <ellipse cx="14" cy="18" rx="5" ry="3" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="2" transform="rotate(-30 14 18)" />
      <ellipse cx="34" cy="30" rx="9" ry="6" fill="none" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 34 30)" />
      <ellipse cx="34" cy="30" rx="9" ry="6" fill="url(#bam-halftone)" stroke="#0A0A0A" strokeWidth="4" transform="rotate(-30 34 30)" />
      <ellipse cx="34" cy="30" rx="5" ry="3" fill="#FF4757" stroke="#0A0A0A" strokeWidth="2" transform="rotate(-30 34 30)" />
      <path d="M22 16 L26 22 M28 24 L32 30" stroke="#FF4757" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 14 L24 12 M28 32 L32 34" stroke="#FFD23F" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* Battery / Power level */
export function IconPowerLevel({ size = 32, className, style, fill = "#06D6A0" }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <rect x="4" y="14" width="36" height="20" rx="2" fill="none" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="40" y="20" width="4" height="8" fill="#0A0A0A" />
      <rect x="7" y="17" width="8" height="14" fill={fill} stroke="#0A0A0A" strokeWidth="1.5" />
      <rect x="17" y="17" width="8" height="14" fill={fill} stroke="#0A0A0A" strokeWidth="1.5" />
      <rect x="27" y="17" width="8" height="14" fill={fill} stroke="#0A0A0A" strokeWidth="1.5" />
      <path d="M22 12 L18 22 L22 22 L20 30 L26 18 L22 18 L24 12 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* Settings / Gear */
export function IconGear({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M24 4 L28 8 L34 6 L36 12 L42 14 L40 20 L44 24 L40 28 L42 34 L36 36 L34 42 L28 40 L24 44 L20 40 L14 42 L12 36 L6 34 L8 28 L4 24 L8 20 L6 14 L12 12 L14 6 L20 8 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="8" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" />
      <circle cx="24" cy="24" r="3" fill="#FF4757" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

/* User / Profile — comic hero bust with mask */
export function IconUser({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      {/* Shoulders */}
      <path d="M6 44 Q6 32 18 28 L30 28 Q42 32 42 44 Z" fill="#4361EE" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <rect x="4" y="42" width="40" height="4" fill="url(#bam-halftone)" />
      {/* Head */}
      <circle cx="24" cy="18" r="11" fill="#FFE0B2" stroke="#0A0A0A" strokeWidth="3" />
      {/* Mask */}
      <path d="M11 16 Q24 12 37 16 L37 20 Q24 24 11 20 Z" fill="#FF4757" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      {/* Mask eye holes */}
      <ellipse cx="18" cy="18" rx="2" ry="1.5" fill="#0A0A0A" />
      <ellipse cx="30" cy="18" rx="2" ry="1.5" fill="#0A0A0A" />
      {/* Hair tuft */}
      <path d="M14 10 Q24 4 34 10 Q34 6 24 4 Q14 6 14 10 Z" fill="#0A0A0A" />
      {/* Mask tie band */}
      <path d="M20 28 L24 32 L28 28" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Download / Export — comic arrow pointing into tray */
export function IconDownload({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      {/* Tray */}
      <path d="M6 30 L6 40 Q6 42 8 42 L40 42 Q42 42 42 40 L42 30 L34 30 L34 36 L14 36 L14 30 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <rect x="6" y="32" width="36" height="6" fill="url(#bam-halftone)" />
      {/* Arrow */}
      <path d="M24 4 L24 26 M14 18 L24 28 L34 18" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 4 L24 24 M16 16 L24 26 L32 16" fill="none" stroke="#FF4757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Refresh / Re-take — comic circular arrows */
export function IconRefresh({ size = 32, className, style }: IconProps) {
  return (
    <svg {...baseSvgProps(size, className, style)}>
      <HalftoneDef />
      <path d="M38 14 A16 16 0 1 0 42 26" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 14 A16 16 0 1 0 42 26" fill="none" stroke="#06D6A0" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrowhead */}
      <path d="M32 8 L40 14 L34 22 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M32 8 L40 14 L34 22 Z" fill="url(#bam-halftone)" opacity="0.3" />
    </svg>
  );
}
