"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type MoodEntry } from "@/lib/api";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import {
  IconMood, IconEnergy, IconBolt, IconTarget, IconHeart, IconStar,
  IconSparkle, IconBreathe, IconFlame, IconDistraction, IconPriority, IconTag,
} from "@/components/comic/comic-icons";

// Mood levels: 1=drained, 5=energized. We render custom SVG mood faces.
const MOOD_LABELS = ["Drained", "Low", "Neutral", "Good", "Great"];
const ENERGY_LABELS = ["Empty", "Low", "Mid", "High", "Charged"];

const TRIGGERS = [
  { id: "overwhelm",       label: "Overwhelm",       Icon: IconPriority },
  { id: "boredom",         label: "Boredom",         Icon: IconBreathe },
  { id: "anxiety",         label: "Anxiety",         Icon: IconHeart },
  { id: "perfectionism",   label: "Perfectionism",   Icon: IconStar },
  { id: "fear_failure",    label: "Fear of Failure", Icon: IconPriority },
  { id: "no_motivation",   label: "No Motivation",   Icon: IconBolt },
  { id: "distraction",     label: "Distraction",     Icon: IconDistraction },
  { id: "tired",           label: "Too Tired",       Icon: IconEnergy },
  { id: "unclear",         label: "Unclear Task",    Icon: IconTag },
  { id: "too_big",         label: "Task Too Big",    Icon: IconTarget },
];

// Comic mood face: a circle with eyes + mouth that changes based on score (1-5)
function MoodFace({ score, size = 48 }: { score: number; size?: number }) {
  // Mouth shape based on score
  // 1=deep frown, 2=frown, 3=flat, 4=smile, 5=big smile
  const mouthPath = score === 1 ? "M 16 32 Q 24 24 32 32"
                  : score === 2 ? "M 16 30 Q 24 26 32 30"
                  : score === 3 ? "M 16 30 L 32 30"
                  : score === 4 ? "M 16 28 Q 24 34 32 28"
                  :              "M 14 26 Q 24 38 34 26";
  const faceColor = score === 1 ? "#7B8190"
                  : score === 2 ? "#9B5DE5"
                  : score === 3 ? "#FFD23F"
                  : score === 4 ? "#06D6A0"
                  :              "#FF4757";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill={faceColor} stroke="#0A0A0A" strokeWidth="3" />
      <pattern id={`mood-face-h-${score}`} width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.6" fill="rgba(10,10,10,0.25)" />
      </pattern>
      <circle cx="24" cy="24" r="20" fill={`url(#mood-face-h-${score})`} />
      <circle cx="17" cy="20" r="2" fill="#0A0A0A" />
      <circle cx="31" cy="20" r="2" fill="#0A0A0A" />
      <path d={mouthPath} fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
      {score === 5 && (
        <>
          <path d="M 6 14 L 4 8 L 10 12 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" />
          <path d="M 42 14 L 44 8 L 38 12 Z" fill="#FFD23F" stroke="#0A0A0A" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

function EnergyBar({ score, size = 48 }: { score: number; size?: number }) {
  // Battery-like icon with fill based on score (1-5)
  const fillPct = score / 5;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <rect x="6" y="14" width="32" height="20" rx="2" fill="#FFF8DC" stroke="#0A0A0A" strokeWidth="3" />
      <rect x="38" y="20" width="4" height="8" fill="#0A0A0A" />
      <rect x="8" y="16" width={28 * fillPct} height="16" fill={score >= 4 ? "#FF4757" : score >= 3 ? "#FF6B35" : score >= 2 ? "#FFD23F" : "#7B8190"} />
      <path d="M 22 14 L 16 24 L 22 24 L 20 32 L 28 22 L 22 22 L 24 14 Z" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

export function MoodCheckin() {
  const [moodScore, setMoodScore] = useState(3);
  const [energyScore, setEnergyScore] = useState(3);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listMood(30)
      .then(setHistory)
      .catch(() => toast.error("Failed to load mood history"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleTrigger = (id: string) => {
    playSound("click");
    setTriggers(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    playSound("bam");
    try {
      await api.createMood({
        mood_score: moodScore,
        energy_score: energyScore,
        triggers,
        note: note.trim() || undefined,
      });
      playSound("achievement");
      triggerBang({ variant: "pow", word: "LOGGED!", x: 50, y: 40, size: 220 });
      toast.success("POW! Mood logged! +5 XP");
      setNote("");
      setTriggers([]);
      setMoodScore(3);
      setEnergyScore(3);
      load();
    } catch (err: any) {
      playSound("error");
      toast.error(err.message);
    }
  };

  // Calculate averages
  const avgMood = history.length > 0
    ? history.reduce((s, m) => s + m.mood_score, 0) / history.length
    : 0;
  const avgEnergy = history.length > 0
    ? history.reduce((s, m) => s + m.energy_score, 0) / history.length
    : 0;

  // Count triggers
  const triggerCounts: Record<string, number> = {};
  history.forEach(m => {
    m.triggers?.forEach(t => {
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
  });
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <ActionWord word="MOOD CHECK-IN!" color="green" size="lg" />
        <p className="font-comic-neue font-bold text-sm mt-1">
          Track your mood & energy. Patterns reveal your procrastination triggers!
        </p>
      </div>

      {/* Check-in form */}
      <ComicPanel color="yellow" tilt="3l">
        <h3 className="font-bangers text-2xl mb-3">HOW ARE YOU FEELING RIGHT NOW?</h3>

        {/* Mood */}
        <div className="mb-4">
          <label className="font-bangers text-lg block mb-2">Mood</label>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => { setMoodScore(n); playSound("pop"); }}
                className={`flex-1 p-3 border-2 border-black rounded-lg transition-all flex flex-col items-center gap-1 ${
                  moodScore === n ? "shadow-[3px_3px_0_#0A0A0A] -translate-y-1 bg-white" : "bg-[#FFF8DC] hover:bg-white"
                }`}
              >
                <MoodFace score={n} size={36} />
                <span className="font-comic-neue text-[10px] font-bold">{MOOD_LABELS[n - 1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div className="mb-4">
          <label className="font-bangers text-lg block mb-2">Energy</label>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => { setEnergyScore(n); playSound("pop"); }}
                className={`flex-1 p-3 border-2 border-black rounded-lg transition-all flex flex-col items-center gap-1 ${
                  energyScore === n ? "shadow-[3px_3px_0_#0A0A0A] -translate-y-1 bg-white" : "bg-[#FFF8DC] hover:bg-white"
                }`}
              >
                <EnergyBar score={n} size={36} />
                <span className="font-comic-neue text-[10px] font-bold">{ENERGY_LABELS[n - 1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Triggers */}
        <div className="mb-4">
          <label className="font-bangers text-lg block mb-2">What's blocking you? (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTrigger(t.id)}
                className={`px-3 py-2 border-2 border-black rounded-md font-comic-neue text-sm font-bold transition-all flex items-center gap-1 ${
                  triggers.includes(t.id)
                    ? "bg-[#FF4757] text-white shadow-[2px_2px_0_#0A0A0A] -translate-y-0.5"
                    : "bg-white hover:bg-[#FFF8DC]"
                }`}
              >
                <t.Icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4">
          <label className="font-bangers text-lg block mb-1">Notes (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind? Any context that might help..."
            className="comic-input min-h-[80px]"
          />
        </div>

        <ComicButton color="red" sound="bam" size="lg" onClick={handleSubmit}>
          <span className="flex items-center gap-1">
            <IconBolt size={20} /> LOG IT!
          </span>
        </ComicButton>
      </ComicPanel>

      {/* Stats */}
      {history.length > 0 && (
        <div className="grid md:grid-cols-3 gap-3">
          <ComicPanel color="blue" className="text-center">
            <div className="flex justify-center mb-2"><MoodFace score={Math.round(avgMood)} size={48} /></div>
            <div className="font-bangers text-3xl text-white">{avgMood.toFixed(1)}/5</div>
            <div className="font-comic-neue text-xs font-bold text-white/90">AVG MOOD ({history.length} entries)</div>
          </ComicPanel>
          <ComicPanel color="orange" className="text-center">
            <div className="flex justify-center mb-2"><EnergyBar score={Math.round(avgEnergy)} size={48} /></div>
            <div className="font-bangers text-3xl">{avgEnergy.toFixed(1)}/5</div>
            <div className="font-comic-neue text-xs font-bold">AVG ENERGY</div>
          </ComicPanel>
          <ComicPanel color="pink" className="text-center">
            <div className="flex justify-center mb-2"><IconTarget size={48} /></div>
            <div className="font-bangers text-3xl">{Object.keys(triggerCounts).length}</div>
            <div className="font-comic-neue text-xs font-bold">UNIQUE TRIGGERS</div>
          </ComicPanel>
        </div>
      )}

      {/* Top triggers */}
      {topTriggers.length > 0 && (
        <ComicPanel color="white">
          <h3 className="font-bangers text-2xl mb-3 flex items-center gap-2">
            <IconTarget size={28} /> YOUR TOP TRIGGERS
          </h3>
          <div className="space-y-2">
            {topTriggers.map(([triggerId, count]) => {
              const trigger = TRIGGERS.find(t => t.id === triggerId);
              if (!trigger) return null;
              const pct = (count / history.length) * 100;
              return (
                <div key={triggerId} className="flex items-center gap-3">
                  <trigger.Icon size={28} />
                  <div className="flex-1">
                    <div className="flex justify-between font-comic-neue font-bold text-sm">
                      <span>{trigger.label}</span>
                      <span>{count}x</span>
                    </div>
                    <div className="h-3 bg-[#FFF8DC] border-2 border-black rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF4757]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ComicPanel>
      )}

      {/* History */}
      {history.length > 0 && (
        <ComicPanel color="white">
          <h3 className="font-bangers text-2xl mb-3 flex items-center gap-2">
            <IconSparkle size={28} /> RECENT ENTRIES
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.slice(0, 15).map((entry) => (
              <div key={entry.id} className="p-3 bg-[#FFF8DC] border-2 border-black rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MoodFace score={entry.mood_score} size={32} />
                    <EnergyBar score={entry.energy_score} size={32} />
                  </div>
                  <div className="font-comic-neue text-xs text-black/60">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
                {entry.note && (
                  <p className="font-comic-neue text-sm italic mt-1">"{entry.note}"</p>
                )}
                {entry.triggers && entry.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.triggers.map((t) => {
                      const trigger = TRIGGERS.find(tr => tr.id === t);
                      return (
                        <ComicBadge key={t} color="white">
                          <span className="flex items-center gap-1">
                            {trigger && <trigger.Icon size={12} />}
                            {trigger?.label || t}
                          </span>
                        </ComicBadge>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ComicPanel>
      )}

      {history.length === 0 && !loading && (
        <SpeechBubble color="white" tilt="left">
          <p className="font-comic-neue font-bold text-black flex items-start gap-2">
            <IconMood size={24} className="flex-shrink-0" />
            <span>
              No mood entries yet. Check in above to start tracking your patterns.
              Over time, you'll see your unique procrastination triggers emerge!
            </span>
          </p>
        </SpeechBubble>
      )}
    </div>
  );
}
