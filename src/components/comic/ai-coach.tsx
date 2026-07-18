"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { api, type AICoachResponse, type AIInteraction } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge, BurstRays,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";
import { triggerBang } from "@/components/comic/bang-effect";
import {
  IconCoach, IconSend, IconSparkle, IconBolt, IconClock, IconRefresh,
} from "@/components/comic/comic-icons";

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

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AICoach() {
  const { user } = useBamStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AIInteraction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build the initial welcome bubble
  const buildWelcome = useCallback((): Message => ({
    role: "coach",
    content: `Hey there, ${user?.display_name || "hero"}! I'm BAM!, your comic-book anti-procrastination coach. I can see you're a ${user?.procrastination_type?.replace("_", " ") || "mystery"} type. What's blocking you today? I'm here to help you POW through it!`,
    action_word: "POW!",
    timestamp: new Date().toISOString(),
  }), [user?.id, user?.display_name, user?.procrastination_type]);

  useEffect(() => {
    setMessages([buildWelcome()]);
  }, [buildWelcome]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const rows = await api.listAIInteractions("coach", 50);
      setHistory(rows);
      setHistoryLoaded(true);
    } catch (e: any) {
      // Silent fail — history is a secondary surface
      console.warn("Failed to load coach history:", e?.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Lazy-load history the first time the user opens the panel
  useEffect(() => {
    if (showHistory && !historyLoaded) {
      loadHistory();
    }
  }, [showHistory, historyLoaded, loadHistory]);

  // After a successful coach reply, prepend the new interaction to history
  const refreshHistoryIfLoaded = useCallback(() => {
    if (historyLoaded) loadHistory();
  }, [historyLoaded, loadHistory]);

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
      refreshHistoryIfLoaded();
    } catch (err: any) {
      playSound("error");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPastChat = (row: AIInteraction) => {
    playSound("pop");
    const userText = (row.input_data?.message as string) || "(empty message)";
    const coachReply = (row.output_data?.reply as string) || "";
    const aw = (row.output_data?.action_word as string) || "BAM!";
    const actions = (row.output_data?.suggested_actions as Array<{ label: string; action_type: string }>) || [];
    const ts = row.created_at;

    setMessages([
      { role: "user", content: userText, timestamp: ts },
      {
        role: "coach",
        content: coachReply,
        action_word: aw,
        suggested_actions: actions,
        timestamp: ts,
      },
    ]);
    setShowHistory(false);
    triggerBang({ variant: "pow", word: "REPLAY!", x: 50, y: 30, size: 140 });
  };

  const handleClearCurrent = () => {
    playSound("wham");
    setMessages([buildWelcome()]);
    triggerBang({ variant: "bam", word: "RESET!", x: 50, y: 35, size: 140 });
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
            <div className="flex-1 min-w-0">
              <ActionWord word="BAM! COACH" color="yellow" size="md" />
              <p className="font-comic-neue font-bold text-sm">
                Your AI-powered anti-procrastination sidekick. Real AI, real advice, POW!
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <ComicButton
                color={showHistory ? "red" : "yellow"}
                size="sm"
                sound="pop"
                onClick={() => setShowHistory((v) => !v)}
                title="Toggle past conversations"
              >
                <span className="flex items-center gap-1">
                  <IconClock size={18} /> {showHistory ? "Hide History" : "History"}
                  {history.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 bg-black text-white rounded-full font-bangers text-xs">
                      {history.length}
                    </span>
                  )}
                </span>
              </ComicButton>
              <ComicButton
                color="white"
                size="sm"
                sound="click"
                onClick={handleClearCurrent}
                title="Reset the current chat"
              >
                <span className="flex items-center gap-1">
                  <IconRefresh size={18} /> Reset
                </span>
              </ComicButton>
            </div>
          </div>
        </ComicPanel>
      </div>

      {/* History panel */}
      {showHistory && (
        <ComicPanel color="yellow">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-bangers text-2xl flex items-center gap-2">
              <IconClock size={26} /> COACH HISTORY
            </h2>
            <div className="flex items-center gap-2">
              <ComicBadge color="orange">
                {history.length} {history.length === 1 ? "chat" : "chats"}
              </ComicBadge>
              <ComicButton
                color="white"
                size="sm"
                sound="click"
                onClick={loadHistory}
                disabled={historyLoading}
              >
                <span className="flex items-center gap-1">
                  <IconRefresh size={16} /> {historyLoading ? "Loading..." : "Refresh"}
                </span>
              </ComicButton>
            </div>
          </div>

          {historyLoading && history.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-2"><IconSparkle size={36} /></div>
              <p className="font-comic-neue font-bold">Digging through the archives...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-2"><IconBolt size={36} /></div>
              <p className="font-comic-neue font-bold">
                No past chats yet — your first conversation will be saved here automatically.
              </p>
            </div>
          ) : (
            <ol className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {history.map((row) => {
                const userText = (row.input_data?.message as string) || "(no message)";
                const reply = (row.output_data?.reply as string) || "";
                const aw = (row.output_data?.action_word as string) || "BAM!";
                const ts = new Date(row.created_at);
                return (
                  <li key={row.id}>
                    <button
                      onClick={() => handleLoadPastChat(row)}
                      className="w-full text-left bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0_#0A0A0A] hover:shadow-[1px_1px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <div className="flex items-center gap-2">
                          <ActionWord word={aw} color="yellow" size="sm" />
                          <span className="font-comic-neue text-xs font-bold text-black/60 flex items-center gap-1">
                            <IconClock size={12} /> {timeAgo(ts)}
                          </span>
                        </div>
                        <ComicBadge color="blue">{row.model_used}</ComicBadge>
                      </div>
                      <div className="font-comic-neue font-bold text-sm text-black line-clamp-1">
                        <span className="text-[#FF4757]">You:</span> {userText}
                      </div>
                      {reply && (
                        <div className="font-comic-neue text-xs text-black/70 mt-1 line-clamp-2">
                          <span className="text-[#06D6A0] font-bold">Coach:</span> {reply}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="font-comic-neue text-xs font-bold text-black/60 mt-3 flex items-center gap-1">
            <IconSparkle size={14} />
            Click any past chat to replay it in the conversation view. New chats are saved automatically.
          </p>
        </ComicPanel>
      )}

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
                    <span className="font-comic-neue text-[10px] font-bold text-black/50 flex items-center gap-1">
                      <IconClock size={11} /> {timeAgo(new Date(msg.timestamp))}
                    </span>
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
