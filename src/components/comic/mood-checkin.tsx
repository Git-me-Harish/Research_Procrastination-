"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type MoodEntry } from "@/lib/api";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";

const MOOD_EMOJIS = ["😔", "😕", "😐", "🙂", "😄"];
const ENERGY_EMOJIS = ["🪫", "🔅", "🔆", "⚡", "🔥"];

const TRIGGERS = [
  { id: "overwhelm",       label: "Overwhelm",       emoji: "🌊" },
  { id: "boredom",         label: "Boredom",         emoji: "😴" },
  { id: "anxiety",         label: "Anxiety",         emoji: "😰" },
  { id: "perfectionism",   label: "Perfectionism",   emoji: "💎" },
  { id: "fear_failure",    label: "Fear of Failure", emoji: "😨" },
  { id: "no_motivation",   label: "No Motivation",   emoji: "🥱" },
  { id: "distraction",     label: "Distraction",     emoji: "🌀" },
  { id: "tired",           label: "Too Tired",       emoji: "🥱" },
  { id: "unclear",         label: "Unclear Task",    emoji: "❓" },
  { id: "too_big",         label: "Task Too Big",    emoji: "🏔️" },
];

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
      toast.success("POW! Mood logged! +5 XP 💥");
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
            {MOOD_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => { setMoodScore(i + 1); playSound("pop"); }}
                className={`flex-1 p-3 border-2 border-black rounded-lg text-3xl transition-all ${
                  moodScore === i + 1 ? "shadow-[3px_3px_0_#0A0A0A] -translate-y-1 bg-white" : "bg-[#FFF8DC] hover:bg-white"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div className="mb-4">
          <label className="font-bangers text-lg block mb-2">Energy</label>
          <div className="flex justify-between gap-2">
            {ENERGY_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => { setEnergyScore(i + 1); playSound("pop"); }}
                className={`flex-1 p-3 border-2 border-black rounded-lg text-3xl transition-all ${
                  energyScore === i + 1 ? "shadow-[3px_3px_0_#0A0A0A] -translate-y-1 bg-white" : "bg-[#FFF8DC] hover:bg-white"
                }`}
              >
                {emoji}
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
                className={`px-3 py-2 border-2 border-black rounded-md font-comic-neue text-sm font-bold transition-all ${
                  triggers.includes(t.id)
                    ? "bg-[#FF4757] text-white shadow-[2px_2px_0_#0A0A0A] -translate-y-0.5"
                    : "bg-white hover:bg-[#FFF8DC]"
                }`}
              >
                {t.emoji} {t.label}
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
          💥 LOG IT!
        </ComicButton>
      </ComicPanel>

      {/* Stats */}
      {history.length > 0 && (
        <div className="grid md:grid-cols-3 gap-3">
          <ComicPanel color="blue" className="text-center">
            <div className="text-3xl">😊</div>
            <div className="font-bangers text-3xl">{avgMood.toFixed(1)}/5</div>
            <div className="font-comic-neue text-xs font-bold">AVG MOOD ({history.length} entries)</div>
          </ComicPanel>
          <ComicPanel color="orange" className="text-center">
            <div className="text-3xl">⚡</div>
            <div className="font-bangers text-3xl">{avgEnergy.toFixed(1)}/5</div>
            <div className="font-comic-neue text-xs font-bold">AVG ENERGY</div>
          </ComicPanel>
          <ComicPanel color="pink" className="text-center">
            <div className="text-3xl">🎯</div>
            <div className="font-bangers text-3xl">{Object.keys(triggerCounts).length}</div>
            <div className="font-comic-neue text-xs font-bold">UNIQUE TRIGGERS</div>
          </ComicPanel>
        </div>
      )}

      {/* Top triggers */}
      {topTriggers.length > 0 && (
        <ComicPanel color="white">
          <h3 className="font-bangers text-2xl mb-3">🎯 YOUR TOP TRIGGERS</h3>
          <div className="space-y-2">
            {topTriggers.map(([triggerId, count]) => {
              const trigger = TRIGGERS.find(t => t.id === triggerId);
              if (!trigger) return null;
              const pct = (count / history.length) * 100;
              return (
                <div key={triggerId} className="flex items-center gap-3">
                  <span className="text-2xl">{trigger.emoji}</span>
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
          <h3 className="font-bangers text-2xl mb-3">📜 RECENT ENTRIES</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.slice(0, 15).map((entry) => (
              <div key={entry.id} className="p-3 bg-[#FFF8DC] border-2 border-black rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{MOOD_EMOJIS[entry.mood_score - 1]}</span>
                    <span className="text-2xl">{ENERGY_EMOJIS[entry.energy_score - 1]}</span>
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
                          {trigger?.emoji} {trigger?.label || t}
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
          <p className="font-comic-neue font-bold text-black">
            👋 No mood entries yet. Check in above to start tracking your patterns.
            Over time, you'll see your unique procrastination triggers emerge!
          </p>
        </SpeechBubble>
      )}
    </div>
  );
}
