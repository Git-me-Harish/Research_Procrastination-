"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type QuizQuestion } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import { BamLogo } from "@/components/comic/bam-logo";
import {
  ComicButton, ComicPanel, ActionWord, SpeechBubble,
  BurstRays, ComicBadge,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";

const TYPE_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  perfectionist: { bg: "#FFD23F", text: "#0A0A0A", emoji: "💎" },
  dreamer:       { bg: "#4361EE", text: "#FFFFFF", emoji: "💭" },
  worrier:       { bg: "#FF6B35", text: "#FFFFFF", emoji: "🛡️" },
  crisis_maker:  { bg: "#FF4757", text: "#FFFFFF", emoji: "🔥" },
  defier:        { bg: "#06D6A0", text: "#0A0A0A", emoji: "⚡" },
  overdoer:      { bg: "#FF69B4", text: "#FFFFFF", emoji: "🃏" },
};

export function OnboardingFlow() {
  const { user, refreshUser } = useBamStore();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<{ question_id: string; option_id: string; score: Record<string, number> }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // If user becomes null (logged out), BamApp will route to auth
    if (!user) return;
    // If user is already onboarded, BamApp will route to dashboard
    if (user.onboarding_completed_at) return;

    api.getQuiz().then((data) => {
      setQuestions(data.questions);
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load quiz");
      setLoading(false);
    });
  }, [user]);

  const handleAnswer = (q: QuizQuestion, optionId: string, scores: Record<string, number>) => {
    playSound("pop");
    const newAnswers = [...answers.filter(a => a.question_id !== q.id), {
      question_id: q.id,
      option_id: optionId,
      score: scores,
    }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        submitQuiz(newAnswers);
      }
    }, 250);
  };

  const submitQuiz = async (finalAnswers: typeof answers) => {
    setSubmitting(true);
    playSound("whoosh");
    try {
      await api.submitOnboarding({
        answers: finalAnswers,
        display_name: user?.display_name || undefined,
      });
      // Determine the winner for the reveal screen
      const scoreMap: Record<string, number> = {};
      finalAnswers.forEach(a => {
        Object.entries(a.score).forEach(([k, v]) => {
          scoreMap[k] = (scoreMap[k] || 0) + v;
        });
      });
      const winner = Object.entries(scoreMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "worrier";
      setResult(winner);
      setSubmitting(false);
      playSound("achievement");
      // Don't refreshUser() yet — wait for the user to click "Enter HQ" so they see their result reveal
    } catch (err: any) {
      playSound("error");
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  if (!user) return null;
  if (user.onboarding_completed_at && !result) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ComicPanel className="text-center">
          <ActionWord word="LOADING..." size="lg" />
          <p className="font-comic-neue mt-2">Summoning your quiz...</p>
        </ComicPanel>
      </div>
    );
  }

  // Result reveal
  if (result) {
    const colors = TYPE_COLORS[result] || TYPE_COLORS.worrier;
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        <BurstRays animate />
        <ComicPanel
          className="max-w-2xl text-center p-8 animate-bam-pop"
          tilt="3l"
          style={{ background: colors.bg, color: colors.text }}
        >
          <div className="text-7xl mb-3">{colors.emoji}</div>
          <p className="font-bangers text-2xl mb-2">YOUR TYPE IS...</p>
          <ActionWord
            word={result.replace("_", " ").toUpperCase() + "!"}
            color={colors.bg === "#FFD23F" ? "red" : "yellow"}
            size="xl"
            className="block my-4"
          />
          <SpeechBubble color="white" tilt="right" className="max-w-md mx-auto mt-6">
            <p className="font-comic-neue font-bold text-black">
              We've crafted a personalized plan just for you. Your comic-book journey
              to defeat procrastination begins NOW! Click below to enter your HQ.
            </p>
          </SpeechBubble>
          <div className="mt-6 mb-4">
            <ComicBadge color="yellow">⭐ XP +50 — Welcome bonus!</ComicBadge>
          </div>
          <ComicButton
            color="red"
            size="lg"
            sound="bam"
            onClick={() => {
              playSound("levelup");
              refreshUser();  // triggers BamApp to route to dashboard
            }}
          >
            ENTER MY HQ! →
          </ComicButton>
        </ComicPanel>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ComicPanel className="text-center">
          <ActionWord word="ANALYZING..." size="lg" />
          <p className="font-comic-neue mt-2">Decoding your hero profile...</p>
        </ComicPanel>
      </div>
    );
  }

  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden p-4">
      <BurstRays className="opacity-15" />

      <div className="max-w-3xl mx-auto pt-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <BamLogo size={50} />
          <ComicBadge color="blue">
            Question {currentIdx + 1} of {questions.length}
          </ComicBadge>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-6 bg-white border-3 border-black rounded-full overflow-hidden shadow-[3px_3px_0_#0A0A0A]">
            <div
              className="h-full bg-[#FFD23F] transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 halftone-red opacity-50" />
            </div>
          </div>
        </div>

        {/* Question */}
        <ComicPanel color="yellow" tilt="3r" className="mb-6 text-center">
          <p className="font-bangers text-2xl md:text-4xl">{q.text}</p>
        </ComicPanel>

        {/* Options */}
        <div className="grid gap-3">
          {q.options.map((opt, idx) => {
            const isSelected = answers.find(a => a.question_id === q.id)?.option_id === opt.id;
            const colorCycle = ["white", "cream", "white", "cream", "white", "cream"] as const;
            const tiltCycle = ["tilt-left", "tilt-right", "tilt-left", "tilt-right", "tilt-left", "tilt-right"];
            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(q, opt.id, opt.scores)}
                className={`comic-panel-flat p-4 text-left ${colorCycle[idx]} ${tiltCycle[idx]} hover:comic-panel transition-all`}
                style={{
                  borderColor: isSelected ? "#FF4757" : "#0A0A0A",
                  borderWidth: "3px",
                  background: isSelected ? "#FFD23F" : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="font-bangers text-2xl w-10 h-10 flex items-center justify-center bg-[#FF4757] text-white border-2 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A]">
                    {opt.id.toUpperCase()}
                  </div>
                  <div className="flex-1 font-comic-neue text-base font-bold pt-2">
                    {opt.text}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tip */}
        <div className="mt-8">
          <SpeechBubble color="white" tilt="left">
            <p className="font-comic-neue text-sm font-bold text-black">
              💡 Tip: Answer honestly — there are no wrong answers! We'll craft a
              personalized plan based on your unique procrastination style.
            </p>
          </SpeechBubble>
        </div>

        {/* Back button */}
        {currentIdx > 0 && (
          <div className="mt-6 text-center">
            <ComicButton
              color="white"
              size="sm"
              sound="click"
              onClick={() => {
                setCurrentIdx(currentIdx - 1);
                playSound("click");
              }}
            >
              ← Back
            </ComicButton>
          </div>
        )}
      </div>
    </div>
  );
}
