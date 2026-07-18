"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { api, type AICoachResponse } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge, BurstRays,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import { IconCoach, IconSend, IconSparkle, IconBolt } from "@/components/comic/comic-icons";

interface Message {
  role: "user" | "coach";
  content: string;
  action_word?: string;
  suggested_actions?: Array<{ label: string; action_type: string }>;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "I'm avoiding my homework, help!",
  "I keep getting distracted by my phone",
  "I have a huge project due tomorrow, panic!",
  "I just don't feel motivated today",
  "I'm overwhelmed with too many tasks",
  "How do I beat perfectionism?",
];

export function AICoach() {
  const { user } = useBamStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message
    setMessages([{
      role: "coach",
      content: `Hey there, ${user?.display_name || "hero"}! I'm BAM!, your comic-book anti-procrastination coach. I can see you're a ${user?.procrastination_type.replace("_", " ") || "mystery"} type. What's blocking you today? I'm here to help you POW through it!`,
      action_word: "POW!",
      timestamp: new Date().toISOString(),
    }]);
  }, [user?.id, user?.procrastination_type]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    playSound("whoosh");
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const resp: AICoachResponse = await api.aiCoach({
        message: text,
        context: {
          procrastination_type: user?.procrastination_type,
          level: user?.level,
          xp: user?.xp,
          streak: user?.current_streak,
        },
      });
      playSound("achievement");
      triggerBang({ variant: "pow", word: resp.action_word || "BAM!", x: 50, y: 30, size: 180 });
      setMessages((m) => [...m, {
        role: "coach",
        content: resp.reply,
        action_word: resp.action_word,
        suggested_actions: resp.suggested_actions,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err: any) {
      playSound("error");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative">
        <BurstRays animate className="opacity-15" />
        <ComicPanel color="green" tilt="3r" className="relative">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center bg-white border-3 border-black rounded-full shadow-[3px_3px_0_#0A0A0A]">
              <IconCoach size={40} />
            </div>
            <div>
              <ActionWord word="BAM! COACH" color="yellow" size="md" />
              <p className="font-comic-neue font-bold text-sm">
                Your AI-powered anti-procrastination sidekick. Real AI, real advice, POW!
              </p>
            </div>
          </div>
        </ComicPanel>
      </div>

      {/* Chat area */}
      <ComicPanel color="white" className="p-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-[400px] md:h-[500px] overflow-y-auto p-4 space-y-3 bg-[#FFF8DC]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(10,10,10,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.role === "coach" && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 flex items-center justify-center bg-[#06D6A0] border-2 border-black rounded-full"><IconCoach size={18} /></div>
                    <span className="font-bangers text-sm">BAM! Coach</span>
                    {msg.action_word && (
                      <ActionWord word={msg.action_word} color="yellow" size="sm" className="ml-1" />
                    )}
                  </div>
                )}
                <SpeechBubble
                  color={msg.role === "user" ? "blue" : "white"}
                  tilt={msg.role === "user" ? "right" : "left"}
                >
                  <p className="font-comic-neue font-bold text-sm md:text-base whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </SpeechBubble>
                {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.suggested_actions.map((a, j) => (
                      <ComicBadge key={j} color="yellow">→ {a.label}</ComicBadge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 flex items-center justify-center bg-[#06D6A0] border-2 border-black rounded-full"><IconCoach size={18} /></div>
                  <span className="font-bangers text-sm">BAM! Coach is thinking...</span>
                </div>
                <div className="speech-bubble bg-white tilt-left">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="p-3 bg-[#FFD23F] border-t-2 border-black">
            <div className="font-bangers text-sm mb-2 flex items-center gap-1"><IconSparkle size={16} /> TRY ASKING:</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="px-3 py-1 bg-white border-2 border-black rounded-md font-comic-neue text-xs font-bold shadow-[2px_2px_0_#0A0A0A] hover:shadow-[1px_1px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="p-3 bg-white border-t-2 border-black flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell BAM! what's blocking you..."
            className="comic-input flex-1"
            disabled={loading}
          />
          <ComicButton type="submit" color="red" sound="bam" disabled={loading || !input.trim()}>
            <span className="flex items-center gap-1">
              {loading ? "..." : <>POW! <IconSend size={18} /></>}
            </span>
          </ComicButton>
        </form>
      </ComicPanel>
    </div>
  );
}
