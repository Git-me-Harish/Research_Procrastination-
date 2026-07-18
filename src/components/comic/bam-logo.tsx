"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: "full" | "icon";
}

export function BamLogo({ size = 60, className, showText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          className="block"
        >
          <defs>
            <radialGradient id="logoBg" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#FFD23F" />
              <stop offset="100%" stopColor="#FF6B35" />
            </radialGradient>
            <linearGradient id="logoText" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#FFD23F" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
          </defs>
          {/* Starburst */}
          <polygon
            points="100,5 115,40 155,30 145,70 195,75 155,105 185,150 135,135 130,180 100,150 70,180 65,135 15,150 45,105 5,75 55,70 45,30 85,40"
            fill="url(#logoBg)"
            stroke="#0A0A0A"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* BAM text */}
          <text
            x="100" y="120"
            fontFamily="Bangers, Impact, sans-serif"
            fontSize="62"
            fontWeight="900"
            fill="url(#logoText)"
            stroke="#0A0A0A"
            strokeWidth="4"
            strokeLinejoin="round"
            textAnchor="middle"
            letterSpacing="2"
            transform="rotate(-4 100 100)"
          >
            BAM!
          </text>
        </svg>
      </div>
      {showText && (
        <div className="font-bangers text-3xl text-[#FF4757] leading-none">
          <span
            style={{
              WebkitTextStroke: "2px #0A0A0A",
              paintOrder: "stroke fill",
              textShadow: "3px 3px 0 #0A0A0A",
            }}
          >
            BAM!
          </span>
          <div className="font-comic-neue text-xs font-bold text-black/70 tracking-widest -mt-1">
            BEAT AVOIDANCE MODE
          </div>
        </div>
      )}
    </div>
  );
}
