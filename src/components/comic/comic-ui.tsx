"use client";

import { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sounds";

// ============ ComicPanel ============
interface ComicPanelProps extends HTMLAttributes<HTMLDivElement> {
  color?: "white" | "yellow" | "red" | "blue" | "green" | "orange" | "pink" | "cream" | "purple" | "ink";
  tilt?: "none" | "left" | "right" | "3l" | "3r";
  hoverable?: boolean;
  halftone?: boolean;
  textured?: boolean; // use textured color background instead of flat
  burst?: boolean;    // add subtle radial burst pattern
}

const panelColors: Record<string, string> = {
  white: "bg-white",
  yellow: "bg-[#FFD23F]",
  red: "bg-[#FF4757] text-white",
  blue: "bg-[#4361EE] text-white",
  green: "bg-[#06D6A0]",
  orange: "bg-[#FF6B35] text-white",
  pink: "bg-[#FF69B4] text-white",
  purple: "bg-[#9B5DE5] text-white",
  cream: "bg-[#FFF8DC]",
  ink: "bg-[#0A0A0A] text-[#FFD23F]",
};

const panelTextures: Record<string, string> = {
  white: "comic-paper-cream",
  yellow: "comic-textured-yellow",
  red: "comic-textured-red",
  blue: "comic-textured-blue",
  green: "comic-textured-green",
  orange: "comic-textured-orange",
  pink: "comic-textured-pink",
  purple: "comic-textured-purple",
  cream: "comic-paper-warm",
  ink: "comic-textured-ink",
};

const tilts: Record<string, string> = {
  none: "",
  left: "tilt-left",
  right: "tilt-right",
  "3l": "tilt-3l",
  "3r": "tilt-3r",
};

export function ComicPanel({
  children,
  color = "white",
  tilt = "none",
  hoverable = false,
  halftone = false,
  textured = true,
  burst = false,
  className,
  ...props
}: ComicPanelProps) {
  return (
    <div
      className={cn(
        "comic-panel-flat p-5 relative overflow-hidden",
        textured ? panelTextures[color] : panelColors[color],
        tilts[tilt],
        hoverable && "comic-panel cursor-pointer",
        halftone && "halftone",
        burst && "comic-burst-bg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============ ComicButton ============
interface ComicButtonProps extends HTMLAttributes<HTMLButtonElement> {
  color?: "red" | "yellow" | "blue" | "green" | "orange" | "pink" | "white";
  sound?: "click" | "pop" | "pow" | "bam" | "zap" | "boom" | "wham" | "whoosh";
  size?: "sm" | "md" | "lg";
}

const buttonSizes: Record<string, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-5 py-2",
  lg: "text-xl px-7 py-3",
};

export function ComicButton({
  children,
  color = "yellow",
  sound = "click",
  size = "md",
  className,
  onClick,
  ...props
}: ComicButtonProps) {
  return (
    <button
      className={cn(
        "comic-btn comic-btn-" + color,
        buttonSizes[size],
        className,
      )}
      onClick={(e) => {
        playSound(sound);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// ============ ActionWord ============
interface ActionWordProps {
  word?: string;
  className?: string;
  color?: "yellow" | "red" | "blue" | "green" | "orange" | "pink" | "white";
  size?: "sm" | "md" | "lg" | "xl";
}

const actionWordColors: Record<string, string> = {
  yellow: "text-[#FFD23F]",
  red: "text-[#FF4757]",
  blue: "text-[#4361EE]",
  green: "text-[#06D6A0]",
  orange: "text-[#FF6B35]",
  pink: "text-[#FF69B4]",
  white: "text-white",
};

const actionWordSizes: Record<string, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
};

export function ActionWord({
  word = "POW!",
  color = "yellow",
  size = "md",
  className,
}: ActionWordProps) {
  return (
    <span
      className={cn(
        "action-word inline-block",
        actionWordColors[color],
        actionWordSizes[size],
        className,
      )}
    >
      {word}
    </span>
  );
}

// ============ SpeechBubble ============
interface SpeechBubbleProps extends HTMLAttributes<HTMLDivElement> {
  color?: "white" | "yellow" | "blue";
  tilt?: "none" | "left" | "right";
}

export function SpeechBubble({
  children,
  color = "white",
  tilt = "left",
  className,
  ...props
}: SpeechBubbleProps) {
  const bgClass = color === "yellow" ? "bg-[#FFD23F]" : color === "blue" ? "bg-[#4361EE] text-white" : "bg-white";
  const tiltClass = tilt === "left" ? "tilt-left" : tilt === "right" ? "tilt-right" : "";
  return (
    <div
      className={cn(
        "speech-bubble",
        bgClass,
        tiltClass,
        className,
      )}
      style={{
        borderColor: "#0A0A0A",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============ Starburst ============
interface StarburstProps {
  children?: ReactNode;
  className?: string;
  size?: number;
}

export function Starburst({ children, className, size = 120 }: StarburstProps) {
  return (
    <div
      className={cn("starburst flex items-center justify-center text-center", className)}
      style={{ width: size, height: size }}
    >
      <div className="font-bangers text-2xl" style={{ transform: "rotate(-4deg)" }}>
        {children}
      </div>
    </div>
  );
}

// ============ ComicBadge ============
interface ComicBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: "red" | "yellow" | "blue" | "green" | "orange" | "pink" | "white";
}

const badgeColors: Record<string, string> = {
  red: "bg-[#FF4757] text-white",
  yellow: "bg-[#FFD23F] text-black",
  blue: "bg-[#4361EE] text-white",
  green: "bg-[#06D6A0] text-black",
  orange: "bg-[#FF6B35] text-white",
  pink: "bg-[#FF69B4] text-white",
  white: "bg-white text-black",
};

export function ComicBadge({ children, color = "yellow", className, ...props }: ComicBadgeProps) {
  return (
    <span className={cn("comic-badge", badgeColors[color], className)} {...props}>
      {children}
    </span>
  );
}

// ============ Halftone Background ============
interface HalftoneBgProps {
  color?: "ink" | "red" | "yellow" | "blue";
  className?: string;
  children?: ReactNode;
}

const halftoneColors: Record<string, string> = {
  ink: "halftone",
  red: "halftone-red",
  yellow: "halftone-yellow",
  blue: "halftone-blue",
};

export function HalftoneBg({ color = "ink", className, children }: HalftoneBgProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", halftoneColors[color], className)}>
      {children}
    </div>
  );
}

// ============ BurstRays ============
export function BurstRays({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <div
      className={cn(
        "burst-rays absolute inset-0 pointer-events-none opacity-30",
        animate && "animate-rays-spin",
        className,
      )}
    />
  );
}
