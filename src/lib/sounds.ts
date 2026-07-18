/**
 * BAM! Sound Effects System
 * Uses Web Audio API to procedurally generate comic-book-style sound effects.
 * No external audio files needed — works on any platform including Windows.
 */

type SoundType =
  | "click"
  | "pop"
  | "pow"
  | "bam"
  | "zap"
  | "boom"
  | "wham"
  | "success"
  | "achievement"
  | "levelup"
  | "error"
  | "ding"
  | "whoosh"
  | "drag"
  | "complete"
  | "tick";

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(v: boolean) {
  soundEnabled = v;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  startGain: number = 0.3,
  endFreq?: number,
  delay: number = 0,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + duration);
  }

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(startGain, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function playNoise(
  ctx: AudioContext,
  duration: number,
  startGain: number = 0.2,
  filterFreq: number = 1000,
  delay: number = 0,
) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;

  const gain = ctx.createGain();
  const t0 = ctx.currentTime + delay;
  gain.gain.setValueAtTime(startGain, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(t0);
  noise.stop(t0 + duration);
}

export function playSound(type: SoundType) {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  switch (type) {
    case "click":
      playTone(ctx, 600, 0.05, "square", 0.15);
      break;
    case "pop":
      playTone(ctx, 800, 0.08, "sine", 0.25, 400);
      playTone(ctx, 1200, 0.04, "sine", 0.15, 800, 0.02);
      break;
    case "tick":
      playTone(ctx, 1000, 0.03, "square", 0.08);
      break;
    case "whoosh":
      playNoise(ctx, 0.2, 0.15, 2000);
      playTone(ctx, 200, 0.2, "sine", 0.1, 600);
      break;
    case "drag":
      playNoise(ctx, 0.1, 0.08, 800);
      break;
    case "pow":
      // Big punchy POW! — low thud + bright pop
      playTone(ctx, 80, 0.15, "sine", 0.4, 40);
      playTone(ctx, 300, 0.1, "square", 0.3, 100);
      playNoise(ctx, 0.15, 0.2, 500);
      break;
    case "bam":
      // BAM! — explosive
      playTone(ctx, 60, 0.2, "sine", 0.5, 30);
      playTone(ctx, 200, 0.12, "square", 0.35, 80);
      playNoise(ctx, 0.25, 0.3, 800);
      playTone(ctx, 800, 0.08, "sine", 0.2, 1200, 0.05);
      break;
    case "zap":
      // ZAP! — sharp electric
      playTone(ctx, 1500, 0.08, "sawtooth", 0.25, 200);
      playTone(ctx, 2000, 0.05, "square", 0.15, 400, 0.02);
      break;
    case "boom":
      // BOOM! — deep explosion
      playTone(ctx, 50, 0.3, "sine", 0.5, 25);
      playNoise(ctx, 0.35, 0.4, 400);
      playTone(ctx, 100, 0.2, "triangle", 0.3, 50, 0.05);
      break;
    case "wham":
      // WHAM! — heavy impact
      playTone(ctx, 70, 0.2, "sine", 0.45, 35);
      playTone(ctx, 150, 0.15, "square", 0.3, 70);
      playNoise(ctx, 0.2, 0.35, 600);
      break;
    case "success":
      // Bright ascending arpeggio
      playTone(ctx, 523, 0.1, "sine", 0.25);          // C5
      playTone(ctx, 659, 0.1, "sine", 0.25, undefined, 0.08); // E5
      playTone(ctx, 784, 0.15, "sine", 0.3, undefined, 0.16); // G5
      playTone(ctx, 1047, 0.2, "sine", 0.3, undefined, 0.24); // C6
      break;
    case "complete":
      playTone(ctx, 659, 0.1, "sine", 0.25);
      playTone(ctx, 880, 0.15, "sine", 0.3, undefined, 0.08);
      playTone(ctx, 1319, 0.2, "sine", 0.3, undefined, 0.18);
      break;
    case "achievement":
      // Triumphant fanfare
      playTone(ctx, 523, 0.12, "sawtooth", 0.2);
      playTone(ctx, 659, 0.12, "sawtooth", 0.2, undefined, 0.1);
      playTone(ctx, 784, 0.12, "sawtooth", 0.2, undefined, 0.2);
      playTone(ctx, 1047, 0.3, "sawtooth", 0.3, undefined, 0.3);
      playTone(ctx, 523, 0.3, "triangle", 0.15, undefined, 0.3);
      break;
    case "levelup":
      // Bigger fanfare
      playTone(ctx, 392, 0.15, "sawtooth", 0.2);   // G4
      playTone(ctx, 523, 0.15, "sawtooth", 0.2, undefined, 0.12); // C5
      playTone(ctx, 659, 0.15, "sawtooth", 0.2, undefined, 0.24); // E5
      playTone(ctx, 784, 0.15, "sawtooth", 0.25, undefined, 0.36); // G5
      playTone(ctx, 1047, 0.4, "sawtooth", 0.3, undefined, 0.48);  // C6
      playNoise(ctx, 0.3, 0.1, 3000, 0.48);
      break;
    case "error":
      playTone(ctx, 200, 0.15, "sawtooth", 0.3, 150);
      playTone(ctx, 150, 0.2, "square", 0.2, 100, 0.05);
      break;
    case "ding":
      playTone(ctx, 880, 0.3, "sine", 0.3);
      playTone(ctx, 1319, 0.4, "sine", 0.2, undefined, 0.05);
      break;
  }
}

/** Play a sound on an HTML element interaction (for click handlers) */
export function withSound<T extends (...args: any[]) => any>(fn: T, sound: SoundType = "click"): T {
  return ((...args: any[]) => {
    playSound(sound);
    return fn(...args);
  }) as T;
}

/** Auto-enable sounds after first user interaction (browser autoplay policy) */
export function initSoundOnFirstInteraction() {
  if (typeof window === "undefined") return;
  const handler = () => {
    getCtx(); // resume/create context
    window.removeEventListener("click", handler);
    window.removeEventListener("keydown", handler);
    window.removeEventListener("touchstart", handler);
  };
  window.addEventListener("click", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
  window.addEventListener("touchstart", handler, { once: true });
}
