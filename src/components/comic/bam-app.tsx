"use client";

import { useEffect, useState } from "react";
import { useBamStore } from "@/lib/store";
import { initSoundOnFirstInteraction, playSound } from "@/lib/sounds";
import { AuthScreen } from "@/components/comic/auth-screen";
import { OnboardingFlow } from "@/components/comic/onboarding-flow";
import { BamDashboard } from "@/components/comic/bam-dashboard";
import { FocusTimer } from "@/components/comic/focus-timer";
import { TaskManager } from "@/components/comic/task-manager";
import { AICoach } from "@/components/comic/ai-coach";
import { AchievementsGallery } from "@/components/comic/achievements-gallery";
import { MoodCheckin } from "@/components/comic/mood-checkin";
import { PersonalizedPlan } from "@/components/comic/personalized-plan";
import { BamShell } from "@/components/comic/bam-shell";

export type View =
  | "dashboard"
  | "tasks"
  | "focus"
  | "coach"
  | "achievements"
  | "mood"
  | "plan";

export function BamApp() {
  const { user, token, refreshUser } = useBamStore();
  const [view, setView] = useState<View>("dashboard");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    initSoundOnFirstInteraction();
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setBootstrapped(true));
    } else {
      setBootstrapped(true);
    }
  }, [token, refreshUser]);

  // Show loading while bootstrapping
  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFEF7]">
        <div className="text-center">
          <div className="font-bangers text-6xl text-[#FF4757]" style={{
            WebkitTextStroke: "2px #0A0A0A",
            textShadow: "4px 4px 0 #0A0A0A",
          }}>
            LOADING...
          </div>
          <p className="font-comic-neue font-bold mt-2">Summoning your hero stats...</p>
        </div>
      </div>
    );
  }

  // Not logged in → auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // Logged in but no onboarding → onboarding
  if (!user.onboarding_completed_at) {
    return <OnboardingFlow />;
  }

  // Logged in and onboarded → main app
  const setViewWithSound = (v: View) => {
    playSound("whoosh");
    setView(v);
  };

  return (
    <BamShell view={view} setView={setViewWithSound}>
      {view === "dashboard" && <BamDashboard setView={setViewWithSound} />}
      {view === "tasks" && <TaskManager />}
      {view === "focus" && <FocusTimer />}
      {view === "coach" && <AICoach />}
      {view === "achievements" && <AchievementsGallery />}
      {view === "mood" && <MoodCheckin />}
      {view === "plan" && <PersonalizedPlan />}
    </BamShell>
  );
}
