"use client";

import { useState, ReactNode } from "react";
import { useBamStore } from "@/lib/store";
import { BamLogo } from "@/components/comic/bam-logo";
import { ActionWord, ComicBadge } from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import type { View } from "./bam-app";
import { cn } from "@/lib/utils";

interface NavItem {
  id: View;
  label: string;
  emoji: string;
  color: string;
  sound: any;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",    label: "HQ",            emoji: "🏠", color: "#FFD23F", sound: "pop" },
  { id: "tasks",        label: "Tasks",         emoji: "📝", color: "#FF4757", sound: "click" },
  { id: "focus",        label: "Focus",         emoji: "⏰", color: "#4361EE", sound: "zap" },
  { id: "coach",        label: "AI Coach",      emoji: "🤖", color: "#06D6A0", sound: "pow" },
  { id: "plan",         label: "My Plan",       emoji: "🗺️", color: "#FF6B35", sound: "whoosh" },
  { id: "achievements", label: "Trophies",      emoji: "🏆", color: "#FF69B4", sound: "achievement" },
  { id: "mood",         label: "Mood",          emoji: "😊", color: "#9B5DE5", sound: "pop" },
];

interface BamShellProps {
  view: View;
  setView: (v: View) => void;
  children: ReactNode;
}

export function BamShell({ view, setView, children }: BamShellProps) {
  const { user, logout, soundOn, toggleSound } = useBamStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    playSound("wham");
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFEF7]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#FFD23F] border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          {/* Logo */}
          <button
            onClick={() => setView("dashboard")}
            className="flex items-center gap-2"
          >
            <BamLogo size={42} />
            <div className="hidden sm:block">
              <div className="font-bangers text-2xl text-[#FF4757] leading-none" style={{
                WebkitTextStroke: "1.5px #0A0A0A",
                textShadow: "2px 2px 0 #0A0A0A",
              }}>
                BAM!
              </div>
              <div className="font-comic-neue text-[10px] font-bold text-black/70 tracking-widest leading-none">
                BEAT AVOIDANCE
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "px-3 py-1.5 font-bangers text-base rounded-md border-2 border-black transition-all",
                  view === item.id
                    ? "shadow-[2px_2px_0_#0A0A0A] -translate-y-0.5"
                    : "shadow-none hover:shadow-[2px_2px_0_#0A0A0A] hover:-translate-y-0.5",
                )}
                style={{
                  background: view === item.id ? item.color : "#FFFEF7",
                  color: view === item.id ? "#0A0A0A" : "#0A0A0A",
                }}
              >
                <span className="mr-1">{item.emoji}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side: user info + sound + logout */}
          <div className="flex items-center gap-2">
            {/* Level badge */}
            {user && (
              <div className="hidden sm:flex items-center gap-1 bg-white border-2 border-black rounded-full px-2 py-1 shadow-[2px_2px_0_#0A0A0A]">
                <span className="text-base">⭐</span>
                <span className="font-bangers text-sm">Lv {user.level}</span>
                <span className="font-comic-neue text-xs font-bold text-black/60">|</span>
                <span className="font-bangers text-sm text-[#FF4757]">{user.xp} XP</span>
              </div>
            )}

            {/* Streak */}
            {user && user.current_streak > 0 && (
              <div className="hidden sm:flex items-center gap-1 bg-[#FF6B35] text-white border-2 border-black rounded-full px-2 py-1 shadow-[2px_2px_0_#0A0A0A]">
                <span className="text-base">🔥</span>
                <span className="font-bangers text-sm">{user.current_streak}d</span>
              </div>
            )}

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="w-9 h-9 flex items-center justify-center bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A] hover:shadow-[1px_1px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              title={soundOn ? "Sound ON (click to mute)" : "Sound OFF (click to unmute)"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>

            {/* User avatar */}
            {user && (
              <div className="hidden sm:flex w-9 h-9 items-center justify-center bg-[#4361EE] text-white border-2 border-black rounded-full shadow-[2px_2px_0_#0A0A0A] font-bangers">
                {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || "H"}
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center bg-[#FF4757] text-white border-2 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A] hover:shadow-[1px_1px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              title="Log out"
            >
              ⏻
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => {
                setMobileOpen(!mobileOpen);
                playSound("pop");
              }}
              className="md:hidden w-9 h-9 flex items-center justify-center bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A]"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t-2 border-black bg-[#FFD23F]">
            <div className="grid grid-cols-2 gap-2 p-3">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "px-3 py-2 font-bangers text-base rounded-md border-2 border-black flex items-center justify-start gap-2",
                    view === item.id ? "shadow-[2px_2px_0_#0A0A0A]" : "",
                  )}
                  style={{
                    background: view === item.id ? item.color : "#FFFEF7",
                  }}
                >
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] text-[#FFD23F] border-t-4 border-black mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="font-bangers text-sm">
            BAM! • Beat Avoidance Mode • Built with POW! 💥
          </div>
          <div className="font-comic-neue text-xs text-[#FFD23F]/70">
            Real AI coaching • Real progress tracking • No mock data, ever.
          </div>
        </div>
      </footer>
    </div>
  );
}
