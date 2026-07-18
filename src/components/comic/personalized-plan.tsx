"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type AIPlanResponse } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge, BurstRays,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";

export function PersonalizedPlan() {
  const { user, refreshUser } = useBamStore();
  const [plan, setPlan] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    if (user?.personalized_plan && Object.keys(user.personalized_plan).length > 0) {
      setPlan(user.personalized_plan);
      setUpdatedAt(user.plan_updated_at || null);
      setLoading(false);
    } else {
      // No plan yet — generate one
      generatePlan();
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const generatePlan = async () => {
    setGenerating(true);
    playSound("whoosh");
    try {
      const resp: AIPlanResponse = await api.aiPlan();
      setPlan(resp.plan);
      setUpdatedAt(resp.generated_at);
      await refreshUser();
      playSound("achievement");
      toast.success("BOOM! Your personalized plan is ready! 💥");
    } catch (err: any) {
      playSound("error");
      toast.error(err.message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  if (loading || generating) {
    return (
      <div className="text-center py-20">
        <ActionWord word="CRAFTING PLAN..." size="lg" color="orange" />
        <p className="font-comic-neue font-bold mt-3">
          AI is analyzing your profile and designing your custom anti-procrastination plan...
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <ComicPanel color="white" className="text-center py-12">
        <h3 className="font-bangers text-2xl">No plan yet</h3>
        <ComicButton color="orange" sound="whoosh" size="lg" className="mt-3" onClick={generatePlan}>
          Generate My Plan
        </ComicButton>
      </ComicPanel>
    );
  }

  const sections = [
    { key: "morning_routine", label: "🌅 Morning Routine", color: "#FFD23F" },
    { key: "focus_blocks",    label: "🎯 Focus Blocks",    color: "#FF4757" },
    { key: "recovery",        label: "💆 Recovery",         color: "#06D6A0" },
    { key: "evening_review",  label: "🌙 Evening Review",   color: "#4361EE" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative">
        <BurstRays animate className="opacity-15" />
        <ComicPanel color="orange" tilt="3l" className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <ActionWord word="YOUR PLAN!" color="yellow" size="lg" />
              <p className="font-comic-neue font-bold text-white">
                Personalized for your <strong>{user?.procrastination_type.replace("_", " ")}</strong> type.
                AI-generated based on your real activity data.
              </p>
              {updatedAt && (
                <p className="font-comic-neue text-xs text-white/80 mt-1">
                  Last updated: {new Date(updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <ComicButton color="yellow" sound="whoosh" size="lg" onClick={generatePlan}>
              🔄 Regenerate
            </ComicButton>
          </div>
        </ComicPanel>
      </div>

      {/* One-pager summary */}
      {plan.one_pager_summary && (
        <SpeechBubble color="yellow" tilt="right">
          <p className="font-comic-neue font-bold text-black text-lg">
            ⭐ {plan.one_pager_summary}
          </p>
        </SpeechBubble>
      )}

      {/* Weekly milestone */}
      {plan.weekly_milestone && (
        <ComicPanel color="pink" tilt="3r">
          <h3 className="font-bangers text-2xl mb-2">🏆 THIS WEEK'S MILESTONE</h3>
          <p className="font-comic-neue font-bold text-lg">{plan.weekly_milestone}</p>
        </ComicPanel>
      )}

      {/* Action word */}
      {plan.action_word && (
        <div className="text-center py-4">
          <ActionWord word={plan.action_word} color="yellow" size="xl" />
        </div>
      )}

      {/* Plan sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const items = plan[section.key];
          if (!items || !Array.isArray(items)) return null;
          return (
            <ComicPanel key={section.key} color="white" tilt={Math.random() > 0.5 ? "3l" : "3r"}>
              <h3 className="font-bangers text-xl mb-3" style={{ color: section.color }}>
                {section.label}
              </h3>
              <ul className="space-y-2">
                {items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 font-comic-neue text-sm font-bold">
                    <span
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center border-2 border-black rounded-md font-bangers text-xs"
                      style={{ background: section.color }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </ComicPanel>
          );
        })}
      </div>

      {/* Procrastination type info */}
      {user?.procrastination_type && (
        <ComicPanel color="blue">
          <h3 className="font-bangers text-2xl mb-2">🦸 YOUR PROCRASTINATION TYPE</h3>
          <ActionWord
            word={user.procrastination_type.replace("_", " ").toUpperCase()}
            color="yellow"
            size="md"
          />
          <p className="font-comic-neue text-sm mt-2 text-white">
            This plan is specifically designed for your type. As you complete tasks,
            log moods, and build focus time, the AI will refine your plan further.
            Re-generate anytime to get a fresh take based on your latest data!
          </p>
        </ComicPanel>
      )}
    </div>
  );
}
