"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type Task, type AIBreakdownResponse } from "@/lib/api";
import { useBamStore } from "@/lib/store";
import {
  ComicPanel, ComicButton, ActionWord, SpeechBubble, ComicBadge,
} from "@/components/comic/comic-ui";
import { playSound } from "@/lib/sounds";

const CATEGORIES = [
  { id: "study",    label: "Study",    emoji: "📚", color: "#4361EE" },
  { id: "work",     label: "Work",     emoji: "💼", color: "#FF4757" },
  { id: "personal", label: "Personal", emoji: "🏠", color: "#06D6A0" },
  { id: "health",   label: "Health",   emoji: "💪", color: "#FF6B35" },
  { id: "creative", label: "Creative", emoji: "🎨", color: "#FF69B4" },
  { id: "general",  label: "General",  emoji: "⭐", color: "#FFD23F" },
];

const PRIORITIES = [
  { id: "low",    label: "Low",    color: "green" as const },
  { id: "medium", label: "Medium", color: "yellow" as const },
  { id: "high",   label: "High",   color: "orange" as const },
  { id: "urgent", label: "Urgent", color: "red" as const },
];

export function TaskManager() {
  const { user } = useBamStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [difficulty, setDifficulty] = useState(2);

  const load = () => {
    setLoading(true);
    api.listTasks(filter === "all" ? undefined : filter)
      .then(setTasks)
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playSound("whoosh");
    try {
      await api.createTask({
        title,
        description,
        category,
        priority,
        estimated_minutes: estimatedMinutes,
        difficulty,
        energy_required: difficulty,
      });
      playSound("bam");
      toast.success("BAM! Task created! 💥");
      setTitle("");
      setDescription("");
      setShowCreate(false);
      load();
    } catch (err: any) {
      playSound("error");
      toast.error(err.message);
    }
  };

  const handleComplete = async (task: Task) => {
    playSound("achievement");
    try {
      await api.updateTask(task.id, { status: "completed", actual_minutes: task.estimated_minutes });
      toast.success(`POW! Task smashed! +${25 + task.difficulty * 10 + task.estimated_minutes} XP 💥`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (task: Task) => {
    playSound("wham");
    try {
      await api.deleteTask(task.id);
      toast.success("Task demolished!");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBreakdown = async (task: Task) => {
    setBreakdownTask(task);
    playSound("pow");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <ActionWord word="MISSIONS!" color="red" size="lg" />
          <p className="font-comic-neue font-bold text-sm">
            Break big scary tasks into tiny doable steps with AI. POW!
          </p>
        </div>
        <ComicButton color="yellow" sound="pop" size="lg" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "✕ Close" : "+ New Mission"}
        </ComicButton>
      </div>

      {/* Procrastination type hint */}
      {user?.procrastination_type && (
        <SpeechBubble color="yellow" tilt="right">
          <p className="font-comic-neue font-bold text-black">
            🦸 You're a <strong>{user.procrastination_type.replace("_", " ").toUpperCase()}</strong>.
            AI breakdowns are tuned to your style. Tap "AI Breakdown" on any task to see the magic!
          </p>
        </SpeechBubble>
      )}

      {/* Create form */}
      {showCreate && (
        <ComicPanel color="cream" tilt="3l" className="animate-bam-pop">
          <form onSubmit={handleCreate} className="space-y-3">
            <h3 className="font-bangers text-2xl">CREATE NEW MISSION</h3>
            <div>
              <label className="font-bangers text-lg block mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Finish the design presentation"
                className="comic-input"
              />
            </div>
            <div>
              <label className="font-bangers text-lg block mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Need to design 5 slides for Friday's meeting..."
                className="comic-input min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bangers text-sm block mb-1">Category</label>
                <div className="grid grid-cols-3 gap-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCategory(c.id); playSound("click"); }}
                      className={`p-2 border-2 border-black rounded-md text-xs font-bangers ${
                        category === c.id ? "shadow-[2px_2px_0_#0A0A0A] -translate-y-0.5" : ""
                      }`}
                      style={{ background: category === c.id ? c.color : "#FFFFFF" }}
                    >
                      <div className="text-base">{c.emoji}</div>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bangers text-sm block mb-1">Priority</label>
                <div className="grid grid-cols-2 gap-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setPriority(p.id); playSound("click"); }}
                      className={`p-2 border-2 border-black rounded-md text-xs font-bangers ${
                        priority === p.id ? "shadow-[2px_2px_0_#0A0A0A] -translate-y-0.5" : ""
                      }`}
                      style={{
                        background: priority === p.id
                          ? ["#06D6A0", "#FFD23F", "#FF6B35", "#FF4757"][PRIORITIES.findIndex(x => x.id === p.id)]
                          : "#FFFFFF",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bangers text-sm block mb-1">Estimated Minutes: {estimatedMinutes}</label>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="font-bangers text-sm block mb-1">Difficulty: {difficulty}/5</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <ComicButton type="submit" color="red" sound="bam" size="lg">
                BAM! Create It 💥
              </ComicButton>
              <ComicButton type="button" color="white" sound="click" size="lg" onClick={() => setShowCreate(false)}>
                Cancel
              </ComicButton>
            </div>
          </form>
        </ComicPanel>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 p-1 bg-[#FFF8DC] border-2 border-black rounded-lg w-fit">
        {(["all", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); playSound("pop"); }}
            className={`px-4 py-1.5 font-bangers text-base rounded-md transition-all ${
              filter === f
                ? "bg-[#FFD23F] border-2 border-black shadow-[2px_2px_0_#0A0A0A]"
                : "hover:bg-yellow-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="text-center py-10">
          <ActionWord word="LOADING..." size="md" />
        </div>
      ) : tasks.length === 0 ? (
        <ComicPanel color="white" className="text-center py-12">
          <div className="text-6xl mb-3">🎯</div>
          <h3 className="font-bangers text-2xl">NO MISSIONS HERE!</h3>
          <p className="font-comic-neue font-bold mt-2">
            Tap "+ New Mission" to add your first task and start your hero journey!
          </p>
        </ComicPanel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map((task, idx) => (
            <TaskCard
              key={task.id}
              task={task}
              idx={idx}
              onComplete={() => handleComplete(task)}
              onDelete={() => handleDelete(task)}
              onBreakdown={() => handleBreakdown(task)}
            />
          ))}
        </div>
      )}

      {/* AI Breakdown modal */}
      {breakdownTask && (
        <AIBreakdownModal
          task={breakdownTask}
          onClose={() => setBreakdownTask(null)}
          onApply={async (substeps) => {
            try {
              await api.updateTask(breakdownTask.id, { breakdown: substeps });
              toast.success("Breakdown applied! 💥");
              setBreakdownTask(null);
              load();
            } catch (err: any) {
              toast.error(err.message);
            }
          }}
        />
      )}
    </div>
  );
}

function TaskCard({
  task, idx, onComplete, onDelete, onBreakdown,
}: {
  task: Task; idx: number;
  onComplete: () => void; onDelete: () => void; onBreakdown: () => void;
}) {
  const cat = CATEGORIES.find(c => c.id === task.category) || CATEGORIES[5];
  const isCompleted = task.status === "completed";
  const tilt = idx % 2 === 0 ? "3l" : "3r";

  return (
    <div
      className={`comic-panel-flat p-4 ${tilt === "3l" ? "tilt-3l" : "tilt-3r"}`}
      style={{ background: isCompleted ? "#FFF8DC" : "#FFFFFF", opacity: isCompleted ? 0.85 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 flex items-center justify-center text-2xl border-2 border-black rounded-lg shadow-[2px_2px_0_#0A0A0A]"
          style={{ background: cat.color }}
        >
          {cat.emoji}
        </div>
        <div className="flex-1">
          <h3 className={`font-bangers text-xl ${isCompleted ? "line-through" : ""}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="font-comic-neue text-sm text-black/70 mt-1">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <ComicBadge color={task.priority === "urgent" ? "red" : task.priority === "high" ? "orange" : task.priority === "medium" ? "yellow" : "green"}>
              {task.priority}
            </ComicBadge>
            <ComicBadge color="blue">{task.estimated_minutes}m</ComicBadge>
            <ComicBadge color="pink">Difficulty: {task.difficulty}/5</ComicBadge>
            {task.breakdown && task.breakdown.length > 0 && (
              <ComicBadge color="green">🤖 AI Broke Down</ComicBadge>
            )}
          </div>
          {task.breakdown && task.breakdown.length > 0 && (
            <div className="mt-3 p-2 bg-[#FFF8DC] border-2 border-black rounded-md">
              <div className="font-bangers text-sm mb-1">🤖 AI BREAKDOWN:</div>
              <ol className="font-comic-neue text-sm list-decimal pl-5 space-y-1">
                {task.breakdown.map((step, i) => (
                  <li key={i}>
                    <strong>{step.title}</strong> ({step.estimated_minutes}m)
                    <div className="text-xs text-black/60">{step.description}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        {!isCompleted && (
          <>
            <ComicButton color="green" size="sm" sound="achievement" onClick={onComplete}>
              ✓ Done
            </ComicButton>
            <ComicButton color="blue" size="sm" sound="pow" onClick={onBreakdown}>
              🤖 AI Breakdown
            </ComicButton>
          </>
        )}
        <ComicButton color="red" size="sm" sound="wham" onClick={onDelete}>
          🗑 Delete
        </ComicButton>
      </div>
    </div>
  );
}

function AIBreakdownModal({
  task, onClose, onApply,
}: {
  task: Task;
  onClose: () => void;
  onApply: (substeps: any[]) => void;
}) {
  const { user } = useBamStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AIBreakdownResponse | null>(null);

  useEffect(() => {
    api.aiBreakdown({
      task_title: task.title,
      task_description: task.description,
      estimated_minutes: task.estimated_minutes,
      user_procrastination_type: user?.procrastination_type,
    })
      .then((r) => {
        setResult(r);
        playSound("achievement");
      })
      .catch((e) => {
        toast.error(e.message);
        onClose();
      })
      .finally(() => setLoading(false));
  }, [task.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="comic-panel-flat max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 bg-[#FFFEF7]"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="text-center py-10">
            <ActionWord word="ZAP! AI WORKING..." size="lg" color="blue" />
            <p className="font-comic-neue font-bold mt-2">Breaking down your task into POW-erful steps...</p>
            <div className="mt-4 flex justify-center gap-2">
              <ComicBadge color="yellow">Analyzing</ComicBadge>
              <ComicBadge color="red">Decomposing</ComicBadge>
              <ComicBadge color="blue">Energizing</ComicBadge>
            </div>
          </div>
        ) : result ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bangers text-3xl text-[#4361EE]" style={{
                WebkitTextStroke: "1.5px #0A0A0A",
                textShadow: "3px 3px 0 #0A0A0A",
              }}>
                🤖 AI BREAKDOWN
              </h2>
              <ActionWord word={result.action_word} color="yellow" size="md" />
            </div>
            <SpeechBubble color="yellow" tilt="right" className="mb-4">
              <p className="font-comic-neue font-bold text-black">{result.motivational_hook}</p>
            </SpeechBubble>
            <div className="space-y-2">
              {result.substeps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#FFF8DC] border-2 border-black rounded-md">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#FF4757] text-white border-2 border-black rounded-md font-bangers">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bangers text-base">{step.title}</div>
                    <div className="font-comic-neue text-sm">{step.description}</div>
                    <ComicBadge color="blue" className="mt-1">{step.estimated_minutes} min</ComicBadge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <ComicButton color="green" sound="achievement" size="lg" onClick={() => onApply(result.substeps)}>
                ✓ Apply Breakdown
              </ComicButton>
              <ComicButton color="white" sound="click" size="lg" onClick={onClose}>
                Cancel
              </ComicButton>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
