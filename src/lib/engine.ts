import { speakSegment } from "./api";
import type { Session, VoiceId } from "./types";

export interface Line {
  seg: number;
  text: string;
  /** True for the words of Scripture themselves, which are set in the serif. */
  verse: boolean;
  start: number;
  end: number;
}

export interface SegmentSpan {
  first: number;
  count: number;
  start: number;
  speechEnd: number;
  end: number;
}

export type Status = "loading" | "ready" | "playing" | "paused" | "buffering" | "ended";

export interface Snapshot {
  status: Status;
  line: number;
  seg: number;
  time: number;
  duration: number;
  /** "voice" is studio narration from the server; "device" is the phone's own speech. */
  mode: "voice" | "device";
}

interface Loaded {
  url: string;
  starts: number[];
  duration: number;
  /** How loud the voice is across the segment, 0–1, sampled ENVELOPE_RATE times a second. Filled in once decoded. */
  envelope?: Float32Array;
}

const ENVELOPE_RATE = 40;

/**
 * Measures the loudness of narration over time by decoding it once, rather
 * than routing live playback through an analyser. That keeps the audio element
 * simple (which iOS needs) and still lets the screen move with the voice.
 */
async function measure(bytes: Uint8Array): Promise<Float32Array | undefined> {
  const Ctor = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Ctor) return undefined;
  try {
    const audio = await new Ctor(1, 1, 22050).decodeAudioData(bytes.slice().buffer);
    const data = audio.getChannelData(0);
    const hop = Math.floor(audio.sampleRate / ENVELOPE_RATE);
    const envelope = new Float32Array(Math.ceil(data.length / hop));
    let peak = 0.0001;
    for (let i = 0; i < envelope.length; i++) {
      let sum = 0;
      const end = Math.min(data.length, (i + 1) * hop);
      for (let j = i * hop; j < end; j++) sum += data[j] * data[j];
      envelope[i] = Math.sqrt(sum / hop);
      peak = Math.max(peak, envelope[i]);
    }
    for (let i = 0; i < envelope.length; i++) envelope[i] = Math.min(1, (envelope[i] / peak) ** 0.7);
    return envelope;
  } catch {
    return undefined;
  }
}

/** Device voices to prefer for each character, best first, then pitch and rate to shade the rest. */
const DEVICE_VOICES: Record<VoiceId, { names: string[]; pitch: number; rate: number }> = {
  naomi: { names: ["Samantha", "Ava", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Karen"], pitch: 0.95, rate: 0.86 },
  elodie: { names: ["Serena", "Kate", "Google UK English Female", "Microsoft Sonia", "Microsoft Libby", "Moira", "Tessa"], pitch: 1.08, rate: 0.88 },
  gideon: { names: ["Daniel", "Google UK English Male", "Microsoft Ryan", "Microsoft Guy", "Aaron", "Alex"], pitch: 0.82, rate: 0.84 },
};

const LINE_GAP = 0.25;

/** Rough spoken length of a phrase at a slow, calm pace. */
function estimate(text: string): number {
  return Math.max(1.8, text.split(/\s+/).length * 0.4 + 0.7);
}

/**
 * Plays a session and reports where it is, line by line.
 *
 * The position is a single clock in seconds across the whole session, so the
 * scrubber, the lyrics and the segment chips all read from one source whether
 * the sound is narration from the server or speech from the device.
 */
export class Engine {
  readonly session: Session;
  lines: Line[] = [];
  spans: SegmentSpan[] = [];

  private mode: "voice" | "device";
  private status: Status = "loading";
  private seg = 0;
  /** Seconds into the current segment, speech and trailing quiet together. */
  private offset = 0;
  private snapshot: Snapshot;
  private listeners = new Set<() => void>();
  private destroyed = false;

  // Narration
  private audio?: HTMLAudioElement;
  private loaded: (Loaded | undefined)[] = [];
  private loading: (Promise<void> | undefined)[] = [];
  private audioSeg = -1;

  // Quiet between segments, and the whole clock in device mode
  private frame = 0;
  private anchor = 0;
  private anchorOffset = 0;
  private lastEmit = 0;

  // Device speech
  private speechToken = 0;
  private utterance?: SpeechSynthesisUtterance;
  private timer = 0;

  constructor(session: Session, narration: boolean) {
    this.session = session;
    this.mode = narration ? "voice" : "device";
    this.layout();
    this.snapshot = this.read();

    if (this.mode === "voice") {
      this.audio = new Audio();
      this.audio.preload = "auto";
      this.audio.addEventListener("ended", this.onAudioEnded);
      this.audio.addEventListener("waiting", () => this.status === "playing" && this.setStatus("buffering"));
      this.audio.addEventListener("playing", () => this.status === "buffering" && this.setStatus("playing"));
      this.load(0).then(() => {
        if (this.status === "loading") this.setStatus("ready");
        void this.preloadFrom(1);
      });
    } else {
      // Asking for the list early gives the browser time to fetch its voices.
      window.speechSynthesis?.getVoices();
      queueMicrotask(() => this.setStatus("ready"));
    }
  }

  // ── Public ──────────────────────────────────────────────────────────────

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  async play() {
    if (this.destroyed || this.status === "playing" || this.status === "loading") return;
    if (this.status === "ended") {
      this.seg = 0;
      this.offset = 0;
    }
    await this.start();
  }

  pause() {
    if (this.status !== "playing" && this.status !== "buffering") return;
    this.halt();
    this.setStatus("paused");
  }

  toggle() {
    if (this.status === "playing" || this.status === "buffering") this.pause();
    else void this.play();
  }

  seekLine(index: number) {
    const line = this.lines[Math.max(0, Math.min(index, this.lines.length - 1))];
    this.jump(line.seg, line.start - this.spans[line.seg].start);
  }

  seekTime(time: number) {
    const clamped = Math.max(0, Math.min(time, this.duration - 0.05));
    let seg = this.spans.findIndex((s) => clamped < s.end);
    if (seg === -1) seg = this.spans.length - 1;
    if (this.mode === "device") {
      // Device speech can only begin at the start of a phrase.
      const index = this.lineAt(clamped);
      this.jump(this.lines[index].seg, this.lines[index].start - this.spans[this.lines[index].seg].start);
    } else {
      this.jump(seg, clamped - this.spans[seg].start);
    }
  }

  nextSegment() {
    if (this.seg < this.spans.length - 1) this.jump(this.seg + 1, 0);
  }

  /** Back to the top of this segment, or to the previous one if already near the top. */
  prevSegment() {
    this.jump(this.offset > 3 || this.seg === 0 ? this.seg : this.seg - 1, 0);
  }

  seekSegment(seg: number) {
    this.jump(Math.max(0, Math.min(seg, this.spans.length - 1)), 0);
  }

  /**
   * How loud the voice is at this instant, 0–1, for anything on screen that
   * should move with it. Read it every frame; it is cheap.
   */
  level(): number {
    if (this.status !== "playing") return 0;
    const span = this.spans[this.seg];
    if (!span || this.offset >= span.speechEnd - span.start) return 0; // the quiet between parts
    const item = this.mode === "voice" ? this.loaded[this.seg] : undefined;
    if (item?.envelope && this.audio) {
      const at = this.audio.currentTime * ENVELOPE_RATE;
      const i = Math.floor(at);
      const a = item.envelope[i] ?? 0;
      return a + ((item.envelope[i + 1] ?? a) - a) * (at - i);
    }
    // The device's own voice cannot be measured, so move in a speech-like rhythm instead.
    const t = performance.now() / 1000;
    return 0.32 + 0.3 * Math.abs(Math.sin(t * 6.1) * Math.sin(t * 2.3 + 1)) + 0.15 * Math.abs(Math.sin(t * 13.7));
  }

  destroy() {
    this.destroyed = true;
    this.halt();
    this.audio?.removeEventListener("ended", this.onAudioEnded);
    this.audio?.removeAttribute("src");
    for (const item of this.loaded) if (item) URL.revokeObjectURL(item.url);
    this.listeners.clear();
  }

  // ── Timeline ────────────────────────────────────────────────────────────

  private get duration() {
    return this.spans.at(-1)?.end ?? 0;
  }

  /** Lays every line out on the clock, using real timings where narration has loaded. */
  private layout() {
    const lines: Line[] = [];
    const spans: SegmentSpan[] = [];
    let clock = 0;
    this.session.segments.forEach((segment, seg) => {
      const first = lines.length;
      const real = this.loaded[seg];
      let cursor = 0;
      segment.lines.forEach((text, i) => {
        const start = real ? real.starts[i] : cursor;
        const end = real ? (real.starts[i + 1] ?? real.duration) : cursor + estimate(text);
        lines.push({ seg, text, verse: segment.kind === "scripture" && i > 0, start: clock + start, end: clock + end });
        cursor = end + (real ? 0 : LINE_GAP);
      });
      const speech = real ? real.duration : cursor - LINE_GAP;
      spans.push({ first, count: segment.lines.length, start: clock, speechEnd: clock + speech, end: clock + speech + segment.pauseAfter });
      clock += speech + segment.pauseAfter;
    });
    this.lines = lines;
    this.spans = spans;
  }

  private lineAt(time: number): number {
    let index = 0;
    for (let i = 0; i < this.lines.length; i++) if (this.lines[i].start <= time + 0.02) index = i;
    return index;
  }

  private read(): Snapshot {
    const time = Math.min((this.spans[this.seg]?.start ?? 0) + this.offset, this.duration);
    return { status: this.status, line: this.lineAt(time), seg: this.seg, time, duration: this.duration, mode: this.mode };
  }

  private emit(force = true) {
    const next = this.read();
    const prev = this.snapshot;
    const moved = next.line !== prev.line || next.status !== prev.status || next.seg !== prev.seg || next.duration !== prev.duration || next.mode !== prev.mode;
    const now = performance.now();
    // Line changes go out at once; the running clock only needs ~8 updates a second.
    if (!moved && !force && now - this.lastEmit < 120) return;
    this.lastEmit = now;
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }

  private setStatus(status: Status) {
    this.status = status;
    this.emit();
  }

  // ── Transport ───────────────────────────────────────────────────────────

  private jump(seg: number, offset: number) {
    const wasPlaying = this.status === "playing" || this.status === "buffering";
    this.halt();
    this.seg = seg;
    this.offset = Math.max(0, offset);
    if (this.status === "ended") this.status = "paused";
    this.emit();
    if (wasPlaying) void this.start();
  }

  /** Stops all sound and timers without changing where we are. */
  private halt() {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.timer);
    this.speechToken++;
    this.audio?.pause();
    if (this.utterance) {
      this.utterance.onend = null;
      this.utterance.onerror = null;
      this.utterance = undefined;
    }
    window.speechSynthesis?.cancel();
  }

  private async start() {
    const span = this.spans[this.seg];
    const speechLength = span.speechEnd - span.start;
    if (this.offset >= speechLength) {
      this.setStatus("playing");
      this.runQuiet();
      return;
    }
    if (this.mode === "voice") await this.startNarration();
    else this.startDevice();
  }

  private finishSegment() {
    if (this.seg >= this.spans.length - 1) {
      this.halt();
      this.offset = this.spans[this.seg].end - this.spans[this.seg].start;
      this.setStatus("ended");
      return;
    }
    this.seg++;
    this.offset = 0;
    this.emit();
    void this.start();
  }

  /** The stillness after a segment: nothing plays, the clock keeps walking. */
  private runQuiet() {
    const span = this.spans[this.seg];
    const total = span.end - span.start;
    this.anchor = performance.now();
    this.anchorOffset = this.offset;
    const tick = () => {
      this.offset = this.anchorOffset + (performance.now() - this.anchor) / 1000;
      if (this.offset >= total) return this.finishSegment();
      this.emit(false);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  // ── Narration (server voice) ────────────────────────────────────────────

  private load(seg: number): Promise<void> {
    // The neighbouring lines are sent as context so the voice flows from one segment into the next.
    const segments = this.session.segments;
    const context = { mode: this.session.mode, kind: segments[seg].kind, before: segments[seg - 1]?.lines.slice(-2).join(" "), after: segments[seg + 1]?.lines.slice(0, 2).join(" ") };
    this.loading[seg] ??= speakSegment(segments[seg].lines, this.session.voice, context)
      .then((spoken) => {
        if (this.destroyed) return;
        const bytes = Uint8Array.from(atob(spoken.audio), (c) => c.charCodeAt(0));
        const item: Loaded = { url: URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })), starts: spoken.starts, duration: spoken.duration };
        this.loaded[seg] = item;
        void measure(bytes).then((envelope) => (item.envelope = envelope));
        this.layout();
        this.emit();
      })
      .catch(() => this.fallBackToDevice());
    return this.loading[seg];
  }

  private async preloadFrom(seg: number) {
    for (let i = seg; i < this.session.segments.length && !this.destroyed && this.mode === "voice"; i++) await this.load(i);
  }

  /** If narration cannot be fetched, carry on with the device's voice rather than stopping the prayer. */
  private fallBackToDevice() {
    if (this.mode === "device" || this.destroyed) return;
    const wasPlaying = this.status === "playing" || this.status === "buffering";
    this.halt();
    this.mode = "device";
    const line = this.snapshot.line;
    this.loaded = [];
    this.layout();
    this.seg = this.lines[line].seg;
    this.offset = this.lines[line].start - this.spans[this.seg].start;
    this.status = this.status === "loading" ? "ready" : wasPlaying ? "paused" : this.status;
    this.emit();
    if (wasPlaying) void this.start();
  }

  private async startNarration() {
    const seg = this.seg;
    const token = ++this.speechToken;
    if (!this.loaded[seg]) {
      this.setStatus("buffering");
      await this.load(seg);
      if (token !== this.speechToken || this.mode !== "voice") return;
    }
    const audio = this.audio!;
    const item = this.loaded[seg]!;
    if (this.audioSeg !== seg) {
      audio.src = item.url;
      this.audioSeg = seg;
    }
    audio.currentTime = Math.min(this.offset, Math.max(0, item.duration - 0.05));
    try {
      await audio.play();
    } catch {
      // Autoplay was refused; wait for her to press play.
      if (token === this.speechToken) this.setStatus("paused");
      return;
    }
    if (token !== this.speechToken) return;
    this.setStatus("playing");
    const tick = () => {
      this.offset = audio.currentTime;
      this.emit(false);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private onAudioEnded = () => {
    cancelAnimationFrame(this.frame);
    const span = this.spans[this.seg];
    this.offset = span.speechEnd - span.start;
    this.runQuiet();
  };

  // ── Device speech ───────────────────────────────────────────────────────

  private deviceVoice(): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    const english = voices.filter((v) => v.lang.startsWith("en"));
    for (const name of DEVICE_VOICES[this.session.voice].names) {
      const match = english.find((v) => v.name.includes(name));
      if (match) return match;
    }
    return english.find((v) => v.default) ?? english[0];
  }

  private startDevice() {
    this.setStatus("playing");
    const time = this.spans[this.seg].start + this.offset;
    this.speakLine(this.lineAt(time));
  }

  private speakLine(index: number) {
    const line = this.lines[index];
    const span = this.spans[line.seg];
    const token = ++this.speechToken;
    this.seg = line.seg;
    this.offset = line.start - span.start;
    this.emit();

    // Walk the clock through the phrase while it is spoken; it holds at the end until the voice is done.
    cancelAnimationFrame(this.frame);
    this.anchor = performance.now();
    this.anchorOffset = this.offset;
    const ceiling = line.end - span.start - 0.05;
    const tick = () => {
      this.offset = Math.min(this.anchorOffset + (performance.now() - this.anchor) / 1000, ceiling);
      this.emit(false);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);

    const length = line.end - line.start;
    let held = false;
    const done = () => {
      if (token !== this.speechToken) return;
      clearTimeout(this.timer);
      // A device with no usable voice reports "finished" at once. Hold the line
      // for its natural length instead, so the words can still be read in time.
      const spoken = (performance.now() - this.anchor) / 1000;
      if (!held && spoken < length * 0.35) {
        held = true;
        this.timer = window.setTimeout(done, (length - spoken) * 1000);
        return;
      }
      cancelAnimationFrame(this.frame);
      const last = index === span.first + span.count - 1;
      if (last) {
        this.offset = span.speechEnd - span.start;
        this.runQuiet();
      } else {
        this.timer = window.setTimeout(() => token === this.speechToken && this.speakLine(index + 1), LINE_GAP * 1000);
      }
    };

    const synth = window.speechSynthesis;
    if (!synth) {
      // No speech at all on this device: keep time silently so the words can still be read.
      held = true;
      this.timer = window.setTimeout(done, length * 1000);
      return;
    }
    const character = DEVICE_VOICES[this.session.voice];
    const utterance = new SpeechSynthesisUtterance(line.text.replace(/[“”]/g, ""));
    const voice = this.deviceVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-US";
    utterance.rate = character.rate;
    utterance.pitch = character.pitch;
    utterance.onend = done;
    utterance.onerror = (event) => {
      if (token !== this.speechToken) return;
      if (event.error === "not-allowed") {
        cancelAnimationFrame(this.frame);
        this.setStatus("paused");
      } else done();
    };
    this.utterance = utterance; // held so it is not collected mid-sentence
    synth.speak(utterance);
    // Some devices accept speech and then never report that it finished. Don't let the prayer stall.
    this.timer = window.setTimeout(done, (length * 2.5 + 3) * 1000);
  }
}
