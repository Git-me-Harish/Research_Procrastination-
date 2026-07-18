"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ComicButton, ComicPanel, ActionWord } from "@/components/comic/comic-ui";
import { IconBreathe, IconWind, IconClose, IconBolt, IconHeart } from "@/components/comic/comic-icons";
import { triggerBang } from "@/components/comic/bang-effect";
import { playSound } from "@/lib/sounds";

type Technique = "4_7_8" | "box" | "deep_belly";

const TECHNIQUE_CONFIG: Record<Technique, {
  name: string;
  phases: Array<{ name: "INHALE" | "HOLD" | "EXHALE" | "REST"; seconds: number; scale: number; color: string }>;
  description: string;
}> = {
  "4_7_8": {
    name: "4-7-8 Calm Breathing",
    description: "Inhale 4s, hold 7s, exhale 8s. Activates parasympathetic nervous system.",
    phases: [
      { name: "INHALE", seconds: 4, scale: 1.4, color: "#06D6A0" },
      { name: "HOLD", seconds: 7, scale: 1.4, color: "#FFD23F" },
      { name: "EXHALE", seconds: 8, scale: 0.7, color: "#4361EE" },
      { name: "REST", seconds: 1, scale: 0.7, color: "#9B5DE5" },
    ],
  },
  "box": {
    name: "Box Breathing",
    description: "4-4-4-4 pattern. Used by Navy SEALs to stay calm under pressure.",
    phases: [
      { name: "INHALE", seconds: 4, scale: 1.4, color: "#06D6A0" },
      { name: "HOLD", seconds: 4, scale: 1.4, color: "#FFD23F" },
      { name: "EXHALE", seconds: 4, scale: 0.7, color: "#4361EE" },
      { name: "HOLD", seconds: 4, scale: 0.7, color: "#9B5DE5" },
    ],
  },
  "deep_belly": {
    name: "Deep Belly Breathing",
    description: "6-second inhale, 6-second exhale. Maximum relaxation.",
    phases: [
      { name: "INHALE", seconds: 6, scale: 1.5, color: "#06D6A0" },
      { name: "EXHALE", seconds: 6, scale: 0.65, color: "#4361EE" },
    ],
  },
};

export function BreatheOverlay({ onClose }: { onClose: () => void }) {
  const [technique, setTechnique] = useState<Technique>("4_7_8");
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [calmBefore, setCalmBefore] = useState(3);
  const [calmAfter, setCalmAfter] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cfg = TECHNIQUE_CONFIG[technique];
  const currentPhase = cfg.phases[phaseIndex];
  const phaseProgress = phaseElapsed / currentPhase.seconds;

  // Reset state when technique changes
  useEffect(() => {
    setRunning(false);
    setPhaseIndex(0);
    setPhaseElapsed(0);
    setCyclesCompleted(0);
    setTotalElapsed(0);
    setShowFinish(false);
  }, [technique]);

  // Timer loop
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setPhaseElapsed((e) => {
        const next = e + 0.1;
        if (next >= currentPhase.seconds) {
          // Advance phase
          setPhaseIndex((pi) => {
            const nextPi = (pi + 1) % cfg.phases.length;
            if (nextPi === 0) {
              setCyclesCompleted((c) => c + 1);
              playSound("pop");
              // Trigger small bang at cycle completion
              triggerBang({ variant: "pow", word: "BREATHE!", x: 50, y: 50, size: 150 });
            }
            return nextPi;
          });
          return 0;
        }
        return next;
      });
      setTotalElapsed((t) => t + 0.1);
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, currentPhase.seconds, cfg.phases.length]);

  const handleStart = () => {
    playSound("whoosh");
    setRunning(true);
    setShowFinish(false);
  };

  const handleStop = () => {
    playSound("pop");
    setRunning(false);
    setShowFinish(true);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await api.createBreatheSession({
        technique,
        cycles_completed: Math.max(1, cyclesCompleted),  // min 1 for API validation
        duration_seconds: Math.max(10, Math.round(totalElapsed)),  // min 10s
        calmness_before: calmBefore,
        calmness_after: calmAfter,
      });
      triggerBang({ variant: "bam", word: "CALM!", x: 50, y: 40, size: 240 });
      playSound("achievement");
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Lung visual: animated expansion based on phase + progress
  const lungScale = running
    ? currentPhase.scale * (0.85 + 0.15 * Math.sin(phaseProgress * Math.PI))
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(10,10,10,0.75)",
        backdropFilter: "blur(4px)",
      }}
    >
      <ComicPanel color="cream" className="w-full max-w-2xl !p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 hover:scale-110 transition-transform"
          aria-label="Close"
        >
          <IconClose size={32} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <IconBreathe size={48} />
          <div>
            <h2 className="font-bangers text-3xl text-[#4361EE]" style={{
              WebkitTextStroke: "1.5px #0A0A0A",
              textShadow: "2px 2px 0 #0A0A0A",
            }}>
              BREATHE!
            </h2>
            <p className="font-comic-neue text-sm font-bold text-black/70">Calm the noise. Defuse the urge to procrastinate.</p>
          </div>
        </div>

        {/* Technique selector */}
        {!running && !showFinish && (
          <div className="mb-4 space-y-3">
            <div className="font-bangers text-lg">CHOOSE YOUR TECHNIQUE</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(Object.keys(TECHNIQUE_CONFIG) as Technique[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTechnique(t); playSound("click"); }}
                  className={`comic-panel-flat p-3 text-left transition-all ${
                    technique === t ? "ring-4 ring-[#FFD23F] -translate-y-1" : "hover:-translate-y-0.5"
                  }`}
                  style={{ background: technique === t ? "#FFD23F" : "#FFFFFF" }}
                >
                  <div className="font-bangers text-base">{TECHNIQUE_CONFIG[t].name}</div>
                  <div className="font-comic-neue text-[11px] text-black/70 mt-1">{TECHNIQUE_CONFIG[t].description}</div>
                </button>
              ))}
            </div>

            {/* Pre-calm rating */}
            <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0_#0A0A0A]">
              <div className="font-comic-neue text-sm font-bold mb-2">How restless do you feel right now?</div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setCalmBefore(6 - n); playSound("pop"); }}
                    className={`flex-1 p-2 border-2 border-black rounded-md font-bangers text-lg transition-all ${
                      calmBefore === 6 - n ? "bg-[#FF4757] text-white shadow-[2px_2px_0_#0A0A0A]" : "bg-white hover:bg-[#FFF8DC]"
                    }`}
                  >
                    {["Calm", "Easy", "Mid", "Tense", "Buzzing"][n - 1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <ComicButton color="green" size="lg" sound="whoosh" onClick={handleStart}>
                START BREATHING
              </ComicButton>
            </div>
          </div>
        )}

        {/* Active breathing animation */}
        {running && (
          <div className="space-y-4">
            {/* Lung visualization */}
            <div className="relative h-72 flex items-center justify-center overflow-hidden">
              {/* Background burst rays */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `repeating-conic-gradient(from 0deg at 50% 50%, ${currentPhase.color}88 0deg 8deg, transparent 8deg 16deg)`,
                  animation: "rays-spin 30s linear infinite",
                }}
              />
              {/* Expanding lung */}
              <div
                className="relative transition-transform"
                style={{
                  transform: `scale(${lungScale})`,
                  transitionDuration: "100ms",
                  transitionTimingFunction: "ease-in-out",
                }}
              >
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <defs>
                    <radialGradient id="lung-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="60%" stopColor={currentPhase.color} />
                      <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.5" />
                    </radialGradient>
                    <pattern id="lung-halftone" width="6" height="6" patternUnits="userSpaceOnUse">
                      <circle cx="1.5" cy="1.5" r="1" fill="rgba(10,10,10,0.3)" />
                    </pattern>
                  </defs>
                  {/* Cloud border */}
                  <path
                    d="M 90,15
                       C 70,8 50,12 45,28
                       C 25,22 8,32 12,52
                       C -2,58 -5,78 12,88
                       C 2,98 8,118 28,118
                       C 32,135 52,140 68,130
                       C 78,145 102,145 112,130
                       C 128,140 148,135 152,118
                       C 172,118 178,98 168,88
                       C 185,78 182,58 168,52
                       C 172,32 155,22 135,28
                       C 130,12 110,8 90,15 Z"
                    fill="#FFFFFF"
                    stroke="#0A0A0A"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  {/* Inner gradient circle */}
                  <circle cx="90" cy="90" r="60" fill="url(#lung-grad)" />
                  <circle cx="90" cy="90" r="60" fill="url(#lung-halftone)" />
                  {/* Inner ring */}
                  <circle cx="90" cy="90" r="40" fill="none" stroke="#0A0A0A" strokeWidth="2" />
                </svg>
              </div>

              {/* Phase label overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div
                  className="font-bangers text-5xl text-center"
                  style={{
                    color: "#FFFFFF",
                    WebkitTextStroke: "2px #0A0A0A",
                    textShadow: "4px 4px 0 #0A0A0A",
                    transform: "rotate(-3deg)",
                  }}
                >
                  {currentPhase.name}
                </div>
                <div className="font-bangers text-2xl mt-1" style={{ color: currentPhase.color, WebkitTextStroke: "1px #0A0A0A" }}>
                  {Math.max(0, Math.ceil(currentPhase.seconds - phaseElapsed))}
                </div>
              </div>
            </div>

            {/* Stats + progress */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white border-2 border-black rounded-md p-2 shadow-[2px_2px_0_#0A0A0A]">
                <div className="font-comic-neue text-xs font-bold">CYCLES</div>
                <div className="font-bangers text-2xl">{cyclesCompleted}</div>
              </div>
              <div className="bg-white border-2 border-black rounded-md p-2 shadow-[2px_2px_0_#0A0A0A]">
                <div className="font-comic-neue text-xs font-bold">ELAPSED</div>
                <div className="font-bangers text-2xl">{Math.floor(totalElapsed)}s</div>
              </div>
              <div className="bg-white border-2 border-black rounded-md p-2 shadow-[2px_2px_0_#0A0A0A]">
                <div className="font-comic-neue text-xs font-bold">PHASE</div>
                <div className="font-bangers text-2xl">{phaseIndex + 1}/{cfg.phases.length}</div>
              </div>
            </div>

            {/* Phase progress dots */}
            <div className="flex justify-center gap-2">
              {cfg.phases.map((p, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border-2 border-black transition-all"
                  style={{
                    background: i === phaseIndex ? currentPhase.color : "#FFFFFF",
                    transform: i === phaseIndex ? "scale(1.4)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            <div className="flex justify-center gap-2">
              <ComicButton color="red" size="md" sound="wham" onClick={handleStop}>
                FINISH SESSION
              </ComicButton>
            </div>
          </div>
        )}

        {/* Finish screen — rate calmness + submit */}
        {showFinish && (
          <div className="space-y-4">
            <ComicPanel color="green" tilt="3l">
              <ActionWord word="NICE!" color="yellow" size="lg" />
              <p className="font-comic-neue font-bold mt-2">
                You completed {cyclesCompleted} {cyclesCompleted === 1 ? "cycle" : "cycles"} in {Math.floor(totalElapsed)} seconds.
                Rate how calm you feel now:
              </p>
            </ComicPanel>

            <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0_#0A0A0A]">
              <div className="font-comic-neue text-sm font-bold mb-2">Post-session calmness</div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setCalmAfter(n); playSound("pop"); }}
                    className={`flex-1 p-2 border-2 border-black rounded-md font-bangers text-lg transition-all ${
                      calmAfter === n ? "bg-[#06D6A0] text-white shadow-[2px_2px_0_#0A0A0A]" : "bg-white hover:bg-[#FFF8DC]"
                    }`}
                  >
                    {["Buzzing", "Tense", "Mid", "Easy", "Calm"][n - 1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <ComicButton color="white" size="md" sound="click" onClick={() => setShowFinish(false)}>
                Back
              </ComicButton>
              <ComicButton color="green" size="md" sound="achievement" onClick={handleFinish} disabled={submitting}>
                {submitting ? "Logging..." : "LOG SESSION"}
              </ComicButton>
            </div>
          </div>
        )}
      </ComicPanel>
    </div>
  );
}
