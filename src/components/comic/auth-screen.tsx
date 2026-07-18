"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBamStore } from "@/lib/store";
import { BamLogo } from "@/components/comic/bam-logo";
import { ComicButton, ComicPanel, ActionWord, SpeechBubble, BurstRays } from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import {
  IconStar, IconCoach, IconFocus, IconTrophy, IconBolt, IconArrowRight,
} from "@/components/comic/comic-icons";

export function AuthScreen() {
  const { login, register, user } = useBamStore();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  // If user is set, BamApp will route to onboarding/dashboard automatically
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playSound("whoosh");
    try {
      if (mode === "register") {
        await register(email, username, password, displayName || undefined);
        playSound("bam");
        triggerBang({ variant: "boom", word: "WELCOME!", x: 50, y: 35, size: 280 });
        toast.success("Welcome to BAM! Let's set you up!");
      } else {
        await login(email, password);
        playSound("bam");
        triggerBang({ variant: "bam", word: "BACK!", x: 50, y: 35, size: 220 });
        toast.success("Welcome back, hero! POW!");
      }
      // BamApp will re-render and route based on user state — no router.push needed
    } catch (err: any) {
      playSound("error");
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Halftone + burst background */}
      <div className="absolute inset-0 halftone opacity-30 pointer-events-none" />
      <BurstRays animate className="opacity-20" />

      {/* Floating action words */}
      <div className="absolute top-10 left-4 hidden md:block">
        <ActionWord word="POW!" color="red" size="md" />
      </div>
      <div className="absolute top-32 right-8 hidden md:block">
        <ActionWord word="ZAP!" color="blue" size="sm" />
      </div>
      <div className="absolute bottom-20 left-12 hidden md:block">
        <ActionWord word="BOOM!" color="orange" size="lg" />
      </div>
      <div className="absolute bottom-32 right-16 hidden md:block">
        <ActionWord word="WHAM!" color="green" size="md" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6">
            <BamLogo size={140} className="mx-auto" />
            <h1 className="font-bangers text-5xl mt-3 text-[#FF4757]" style={{
              WebkitTextStroke: "2px #0A0A0A",
              paintOrder: "stroke fill",
              textShadow: "4px 4px 0 #0A0A0A",
            }}>
              BEAT AVOIDANCE MODE
            </h1>
            <p className="font-comic-neue text-sm font-bold mt-2 text-black/70">
              The comic-book way to defeat procrastination. POW! BAM! ZAP!
            </p>
          </div>

          {/* Speech bubble tagline */}
          <SpeechBubble color="yellow" tilt="right" className="mb-6 text-center">
            <p className="font-comic-neue font-bold text-black flex items-center justify-center gap-2 flex-wrap">
              <IconStar size={18} />
              <span>Track procrastination • Build focus habits • Level up like a hero!</span>
            </p>
          </SpeechBubble>

          {/* Auth panel */}
          <ComicPanel color="white" className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-[#FFF8DC] border-2 border-black rounded-lg">
              <button
                onClick={() => {
                  setMode("register");
                  playSound("pop");
                }}
                className={`flex-1 py-2 font-bangers text-lg rounded-md transition-all ${
                  mode === "register"
                    ? "bg-[#FFD23F] border-2 border-black shadow-[2px_2px_0_#0A0A0A]"
                    : "hover:bg-yellow-100"
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setMode("login");
                  playSound("pop");
                }}
                className={`flex-1 py-2 font-bangers text-lg rounded-md transition-all ${
                  mode === "login"
                    ? "bg-[#FFD23F] border-2 border-black shadow-[2px_2px_0_#0A0A0A]"
                    : "hover:bg-yellow-100"
                }`}
              >
                Log In
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-bangers text-lg block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hero@bam.app"
                  className="comic-input"
                  autoComplete="email"
                />
              </div>

              {mode === "register" && (
                <>
                  <div>
                    <label className="font-bangers text-lg block mb-1">Username</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="CaptainFocus"
                      className="comic-input"
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label className="font-bangers text-lg block mb-1">Display Name (optional)</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="The Procrastination Slayer"
                      className="comic-input"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="font-bangers text-lg block mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="comic-input"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </div>

              <ComicButton
                type="submit"
                color="red"
                size="lg"
                sound="bam"
                className="w-full"
                disabled={loading}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading
                    ? "Loading..."
                    : mode === "register"
                      ? <>BAM! Sign Me Up <IconBolt size={22} /></>
                      : <>POW! Log Me In <IconArrowRight size={22} /></>}
                </span>
              </ComicButton>
            </form>

            {/* Mode switch link */}
            <p className="text-center font-comic-neue text-sm">
              {mode === "register" ? (
                <>
                  Already a hero?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      playSound("pop");
                    }}
                    className="font-bold underline text-[#4361EE]"
                  >
                    Log in here
                  </button>
                </>
              ) : (
                <>
                  New to BAM!?{" "}
                  <button
                    onClick={() => {
                      setMode("register");
                      playSound("pop");
                    }}
                    className="font-bold underline text-[#FF4757]"
                  >
                    Join the adventure
                  </button>
                </>
              )}
            </p>
          </ComicPanel>

          {/* Feature badges */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <ComicPanel color="yellow" tilt="3l" className="text-center p-3">
              <div className="flex justify-center mb-1"><IconCoach size={32} /></div>
              <div className="font-bangers text-xs">AI Coach</div>
            </ComicPanel>
            <ComicPanel color="green" tilt="3r" className="text-center p-3">
              <div className="flex justify-center mb-1"><IconFocus size={32} /></div>
              <div className="font-bangers text-xs">Focus Timer</div>
            </ComicPanel>
            <ComicPanel color="pink" tilt="3l" className="text-center p-3">
              <div className="flex justify-center mb-1"><IconTrophy size={32} /></div>
              <div className="font-bangers text-xs">Achievements</div>
            </ComicPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
