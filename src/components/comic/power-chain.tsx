"use client";

import { useEffect, useState } from "react";
import { api, type PowerChain, type ChainLink } from "@/lib/api";
import {
  ComicPanel, ComicButton, ActionWord, ComicBadge, SpeechBubble,
} from "@/components/comic/comic-ui";
import {
  IconChain, IconPlus, IconTrash, IconBolt, IconStar, IconTarget,
  IconHeart, IconBreathe, IconFlame, IconCheck, IconSnap, IconShield,
  IconArrowRight, IconClose, IconEdit,
} from "@/components/comic/comic-icons";
import { triggerBang } from "@/components/comic/bang-effect";
import { playSound } from "@/lib/sounds";

const LINK_ICON_OPTIONS = [
  { code: "bolt", label: "Bolt", Icon: IconBolt },
  { code: "star", label: "Star", Icon: IconStar },
  { code: "target", label: "Target", Icon: IconTarget },
  { code: "heart", label: "Heart", Icon: IconHeart },
  { code: "breathe", label: "Breathe", Icon: IconBreathe },
  { code: "flame", label: "Flame", Icon: IconFlame },
];

function getLinkIcon(code: string, size = 28) {
  const found = LINK_ICON_OPTIONS.find((o) => o.code === code);
  if (!found) return <IconBolt size={size} />;
  const Icon = found.Icon;
  return <Icon size={size} />;
}

const CHAIN_COLORS = ["yellow", "red", "blue", "green", "orange", "pink", "purple"];

export function PowerChainView() {
  const [chains, setChains] = useState<PowerChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    api.listChains()
      .then(setChains)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggleLink = async (chainId: number, link: ChainLink) => {
    try {
      const result = await api.toggleChainLink(chainId, link.id);
      playSound(result.link.completed_today ? "pop" : "click");

      if (result.chain_broken) {
        // Chain broke — trigger SNAP!
        triggerBang({ variant: "wham", word: "SNAP!", x: 50, y: 40, size: 280 });
        playSound("wham");
      } else if (result.chain_completed_today) {
        // Full chain day complete — bigger BANG!
        triggerBang({ variant: "boom", word: "CHAIN!", x: 50, y: 35, size: 280 });
        playSound("achievement");
      } else if (result.link.completed_today) {
        triggerBang({ variant: "pow", word: "LINK!", x: 50, y: 50, size: 180 });
      }

      if (result.new_shield_earned) {
        setTimeout(() => {
          triggerBang({ variant: "kapow", word: "SHIELD!", x: 50, y: 50, size: 260 });
          playSound("levelup");
        }, 800);
      }

      load();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleRestart = async (id: number) => {
    try {
      await api.restartChain(id);
      playSound("whoosh");
      triggerBang({ variant: "pow", word: "RESET!", x: 50, y: 50, size: 200 });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this power chain? This cannot be undone.")) return;
    try {
      await api.deleteChain(id);
      playSound("wham");
      load();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <ActionWord word="LOADING CHAINS..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <ComicPanel color="yellow" tilt="3r" burst>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-bangers text-4xl text-[#FF4757]" style={{
              WebkitTextStroke: "1.5px #0A0A0A",
              textShadow: "3px 3px 0 #0A0A0A",
            }}>
              POWER CHAINS!
            </h1>
            <p className="font-comic-neue font-bold mt-1 max-w-2xl">
              Link small habits into unbreakable chains. Complete every link each day to extend your chain.
              Miss a link and the chain SNAPS — start fresh, but the longest chain is yours forever.
            </p>
          </div>
          <ComicButton color="green" sound="pop" size="lg" onClick={() => setShowCreate(true)}>
            <span className="flex items-center gap-2">
              <IconPlus size={22} />
              NEW CHAIN
            </span>
          </ComicButton>
        </div>
      </ComicPanel>

      {/* Empty state */}
      {chains.length === 0 && (
        <ComicPanel color="cream">
          <div className="text-center py-12">
            <div className="flex justify-center mb-3">
              <IconChain size={80} />
            </div>
            <h2 className="font-bangers text-2xl mb-2">NO CHAINS YET</h2>
            <p className="font-comic-neue font-bold text-black/70 mb-4 max-w-md mx-auto">
              Create your first power chain to start stacking habits. The more links, the more XP per completion — and every 3-day streak earns a Streak Shield.
            </p>
            <ComicButton color="green" sound="whoosh" size="lg" onClick={() => setShowCreate(true)}>
              CREATE FIRST CHAIN
            </ComicButton>
          </div>
        </ComicPanel>
      )}

      {/* Chain list */}
      {chains.length > 0 && (
        <div className="space-y-4">
          {chains.map((chain) => (
            <ChainCard
              key={chain.id}
              chain={chain}
              onToggleLink={(link) => handleToggleLink(chain.id, link)}
              onRestart={() => handleRestart(chain.id)}
              onDelete={() => handleDelete(chain.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateChainModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

/* ---------- Single chain card ---------- */
function ChainCard({
  chain, onToggleLink, onRestart, onDelete,
}: {
  chain: PowerChain;
  onToggleLink: (link: ChainLink) => void;
  onRestart: () => void;
  onDelete: () => void;
}) {
  const requiredLinks = chain.links.filter((l) => l.is_required);
  const completedToday = requiredLinks.filter((l) => l.completed_today).length;
  const allCompleteToday = completedToday === requiredLinks.length && requiredLinks.length > 0;
  const isBroken = !chain.is_active && chain.broken_at;

  return (
    <ComicPanel color="white" tilt="3l">
      {/* Chain header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <IconChain size={40} />
          </div>
          <div>
            <h3 className="font-bangers text-2xl">{chain.title}</h3>
            {chain.description && (
              <p className="font-comic-neue text-sm text-black/70">{chain.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ComicBadge color={allCompleteToday ? "green" : isBroken ? "red" : "yellow"}>
            {allCompleteToday ? "DAY DONE!" : isBroken ? "BROKEN" : `${completedToday}/${requiredLinks.length} TODAY`}
          </ComicBadge>
          <button onClick={onDelete} className="hover:scale-110 transition-transform" title="Delete">
            <IconTrash size={26} />
          </button>
        </div>
      </div>

      {/* KPIs strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#FFD23F] border-2 border-black rounded-md p-2 text-center shadow-[2px_2px_0_#0A0A0A]">
          <div className="font-comic-neue text-[10px] font-bold uppercase">Current</div>
          <div className="font-bangers text-xl">{chain.current_chain_days}d</div>
        </div>
        <div className="bg-[#06D6A0] border-2 border-black rounded-md p-2 text-center shadow-[2px_2px_0_#0A0A0A]">
          <div className="font-comic-neue text-[10px] font-bold uppercase">Longest</div>
          <div className="font-bangers text-xl">{chain.longest_chain_days}d</div>
        </div>
        <div className="bg-[#4361EE] text-white border-2 border-black rounded-md p-2 text-center shadow-[2px_2px_0_#0A0A0A]">
          <div className="font-comic-neue text-[10px] font-bold uppercase">Total Dones</div>
          <div className="font-bangers text-xl">{chain.total_completions}</div>
        </div>
      </div>

      {/* Broken banner */}
      {isBroken && (
        <div className="mb-4 bg-[#FF4757] text-white border-2 border-black rounded-md p-3 shadow-[2px_2px_0_#0A0A0A] flex items-center gap-3">
          <IconSnap size={40} />
          <div className="flex-1">
            <div className="font-bangers text-lg">CHAIN SNAPPED!</div>
            <div className="font-comic-neue text-xs">
              This chain broke on {new Date(chain.broken_at!).toLocaleDateString()}.
              Restart to begin a fresh streak.
            </div>
          </div>
          <ComicButton color="yellow" size="sm" sound="whoosh" onClick={onRestart}>
            RESTART
          </ComicButton>
        </div>
      )}

      {/* Chain links visualization */}
      <div className="flex flex-wrap items-center gap-2">
        {chain.links.map((link, i) => (
          <div key={link.id} className="flex items-center gap-2">
            <button
              onClick={() => onToggleLink(link)}
              disabled={isBroken}
              className={`relative p-3 border-2 border-black rounded-lg transition-all shadow-[3px_3px_0_#0A0A0A] ${
                link.completed_today
                  ? "bg-[#06D6A0] hover:shadow-[1px_1px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5"
                  : "bg-white hover:bg-[#FFF8DC] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0A0A0A]"
              } ${isBroken ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={link.completed_today ? "Mark incomplete" : "Mark complete"}
            >
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div className={link.completed_today ? "opacity-100" : "opacity-60"}>
                  {getLinkIcon(link.icon_code, 32)}
                </div>
                <div className="font-bangers text-xs text-center leading-tight">
                  {link.title.toUpperCase()}
                </div>
                {link.completed_today && (
                  <div className="absolute -top-2 -right-2 bg-[#FFD23F] border-2 border-black rounded-full p-0.5">
                    <IconCheck size={16} />
                  </div>
                )}
              </div>
            </button>
            {/* Connector between links */}
            {i < chain.links.length - 1 && (
              <div className="flex-shrink-0">
                <svg width="32" height="20" viewBox="0 0 32 20">
                  <path
                    d="M 2 10 L 30 10"
                    stroke={link.completed_today ? "#06D6A0" : "#0A0A0A"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={link.completed_today ? "none" : "4 3"}
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reward info */}
      {allCompleteToday && !isBroken && (
        <div className="mt-4">
          <SpeechBubble color="yellow" tilt="right">
            <p className="font-comic-neue font-bold text-black">
              Chain day {chain.current_chain_days} complete!
              {chain.current_chain_days > 0 && chain.current_chain_days % 3 === 0 && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <IconShield size={18} /> Bonus shield earned!
                </span>
              )}
              {" "}Come back tomorrow to extend the chain.
            </p>
          </SpeechBubble>
        </div>
      )}
    </ComicPanel>
  );
}

/* ---------- Create Chain Modal ---------- */
function CreateChainModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("yellow");
  const [links, setLinks] = useState<Array<{ title: string; icon_code: string; is_required: boolean }>>([
    { title: "", icon_code: "bolt", is_required: true },
    { title: "", icon_code: "star", is_required: true },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addLink = () => {
    if (links.length >= 10) return;
    setLinks([...links, { title: "", icon_code: "bolt", is_required: true }]);
    playSound("pop");
  };

  const removeLink = (i: number) => {
    if (links.length <= 2) return;
    setLinks(links.filter((_, idx) => idx !== i));
    playSound("click");
  };

  const updateLink = (i: number, field: string, value: any) => {
    const next = [...links];
    (next[i] as any)[field] = value;
    setLinks(next);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert("Chain needs a title."); return; }
    if (links.some((l) => !l.title.trim())) { alert("Every link needs a title."); return; }
    setSubmitting(true);
    try {
      await api.createChain({
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        links: links.map((l) => ({
          title: l.title.trim(),
          is_required: l.is_required,
          icon_code: l.icon_code,
          color,
        })),
      });
      playSound("achievement");
      triggerBang({ variant: "boom", word: "CHAIN!", x: 50, y: 40, size: 280 });
      onCreated();
    } catch (e: any) {
      alert(e.message || "Failed to create chain");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(4px)" }}
    >
      <ComicPanel color="cream" className="w-full max-w-2xl !p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 hover:scale-110 transition-transform">
          <IconClose size={32} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <IconChain size={48} />
          <div>
            <h2 className="font-bangers text-3xl text-[#FF4757]" style={{
              WebkitTextStroke: "1.5px #0A0A0A",
              textShadow: "2px 2px 0 #0A0A0A",
            }}>
              FORGE A NEW CHAIN
            </h2>
            <p className="font-comic-neue text-sm font-bold text-black/70">Link 2-10 habits. Each day, complete all required links to extend the chain.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="font-bangers text-sm block mb-1">CHAIN TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Power Routine"
              className="comic-input"
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-bangers text-sm block mb-1">DESCRIPTION (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this chain for?"
              className="comic-input"
              maxLength={255}
            />
          </div>

          {/* Color */}
          <div>
            <label className="font-bangers text-sm block mb-2">CHAIN COLOR</label>
            <div className="flex gap-2 flex-wrap">
              {CHAIN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); playSound("pop"); }}
                  className={`w-10 h-10 border-2 border-black rounded-md shadow-[2px_2px_0_#0A0A0A] transition-all ${
                    color === c ? "ring-4 ring-[#FFD23F] -translate-y-0.5" : ""
                  } comic-textured-${c}`}
                  style={{ background: `var(--color-bam-${c === "yellow" ? "yellow" : c})` }}
                />
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bangers text-sm">LINKS ({links.length}/10)</label>
              <ComicButton color="green" size="sm" sound="pop" onClick={addLink} disabled={links.length >= 10}>
                <span className="flex items-center gap-1">
                  <IconPlus size={16} /> ADD LINK
                </span>
              </ComicButton>
            </div>

            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="bg-white border-2 border-black rounded-md p-3 shadow-[2px_2px_0_#0A0A0A]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bangers text-lg w-8 text-center">{i + 1}</div>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => updateLink(i, "title", e.target.value)}
                      placeholder={`Habit ${i + 1} (e.g. Drink water, Stretch, Read 10 min)`}
                      className="comic-input flex-1"
                      maxLength={120}
                    />
                    {links.length > 2 && (
                      <button
                        onClick={() => removeLink(i)}
                        className="text-[#FF4757] hover:scale-110 transition-transform p-1"
                        title="Remove"
                      >
                        <IconTrash size={22} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-comic-neue text-xs font-bold">ICON:</span>
                    {LINK_ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => { updateLink(i, "icon_code", opt.code); playSound("click"); }}
                        className={`p-1 border-2 border-black rounded-md transition-all ${
                          link.icon_code === opt.code ? "bg-[#FFD23F] shadow-[2px_2px_0_#0A0A0A]" : "bg-white hover:bg-[#FFF8DC]"
                        }`}
                        title={opt.label}
                      >
                        <opt.Icon size={22} />
                      </button>
                    ))}
                    <label className="ml-auto flex items-center gap-2 font-comic-neue text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={link.is_required}
                        onChange={(e) => updateLink(i, "is_required", e.target.checked)}
                        className="w-4 h-4 accent-[#FF4757]"
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <ComicButton color="white" size="md" sound="click" onClick={onClose}>
              Cancel
            </ComicButton>
            <ComicButton color="red" size="md" sound="bam" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Forging..." : "FORGE CHAIN"}
            </ComicButton>
          </div>
        </div>
      </ComicPanel>
    </div>
  );
}
