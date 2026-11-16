import type { SceneId } from "./types";

/**
 * Background music, composed as it plays.
 *
 * Three quiet layers under the voice: a slow pad that moves through a four-chord
 * progression, a soft felt-piano voice that places a note every few seconds from
 * the chord of the moment, and a low root note at each chord change. Everything
 * passes through a long synthetic reverb. Nothing is downloaded, it never loops,
 * and each scene has its own key and pace.
 *
 * The music is written against the audio clock (`scheduleUntil`), so the same
 * code can be rendered offline to check its levels.
 */

interface Mood {
  /** Semitones above D for the home key. */
  key: number;
  /** Seconds each chord lasts. */
  bar: number;
  /** Average seconds between piano notes. */
  space: number;
  /** Octave shift for the piano: 0 is around middle C. */
  lift: number;
}

const MOODS: Record<SceneId, Mood> = {
  dawn: { key: 0, bar: 18, space: 3.4, lift: 0 }, // D: open and hopeful
  honey: { key: 5, bar: 16, space: 2.9, lift: 0 }, // G: brighter, a little quicker
  ember: { key: -2, bar: 19, space: 3.6, lift: 0 }, // C: warm and steady
  dusk: { key: -5, bar: 22, space: 4.4, lift: -1 }, // A: lower and slower, for evening
};

/** I – vi – IV – V(sus): each chord as semitones above the key note. Gentle, unresolved, never sad. */
const PROGRESSION = [
  [0, 4, 7, 14], // I add9
  [9, 12, 16, 19], // vi
  [5, 9, 12, 16], // IV
  [7, 12, 14, 19], // V sus4
];

/** The major pentatonic: any of these sounds right over any chord above. */
const PENTATONIC = [0, 2, 4, 7, 9];

const D3 = 146.83;
const LEVEL = 0.2;

const hz = (semitones: number) => D3 * 2 ** (semitones / 12);

/** A small deterministic random source, so an offline render is repeatable. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A long, dark, smooth tail: decaying noise, low-passed by averaging. */
function impulse(ctx: BaseAudioContext, seconds: number, random: () => number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      smooth += (random() * 2 - 1 - smooth) * (0.5 - 0.42 * t); // darker as it decays
      data[i] = smooth * (1 - t) ** 2.6;
    }
  }
  return buffer;
}

export class Score {
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private mood: Mood;
  private random: () => number;
  private dry: GainNode;
  private wet: GainNode;
  private pad: { osc: OscillatorNode; gain: GainNode }[] = [];
  private barStart: number;
  private bar = 0;
  private nextNote: number;
  private lastDegree = 2;

  constructor(ctx: BaseAudioContext, scene: SceneId, seed = Date.now()) {
    this.ctx = ctx;
    this.mood = MOODS[scene];
    this.random = seeded(seed);

    this.output = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2400;
    tone.connect(this.output);

    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 5.5, this.random);
    this.dry = ctx.createGain();
    this.dry.gain.value = 0.55;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.9;
    this.dry.connect(tone);
    this.wet.connect(reverb).connect(tone);

    // The pad: four voices that glide to each new chord, each breathing at its own rate.
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 700;
    padFilter.connect(this.dry);
    padFilter.connect(this.wet);
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? "triangle" : "sine";
      osc.detune.value = i % 2 ? 4 : -4;
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.04 + i * 0.013;
      const depth = ctx.createGain();
      depth.gain.value = 0.028;
      lfo.connect(depth).connect(gain.gain);
      osc.connect(gain).connect(padFilter);
      osc.start();
      lfo.start();
      this.pad.push({ osc, gain });
    }

    this.barStart = ctx.currentTime;
    this.nextNote = ctx.currentTime + 1.5;
    this.voiceChord(ctx.currentTime, true);
  }

  private chord(): number[] {
    return PROGRESSION[this.bar % PROGRESSION.length].map((n) => n + this.mood.key);
  }

  /** Move the pad to the current chord and sound its root, low and soft. */
  private voiceChord(at: number, immediately = false) {
    const chord = this.chord();
    this.pad.forEach(({ osc }, i) => {
      const target = hz(chord[i] - (i === 0 ? 12 : 0));
      if (immediately) osc.frequency.setValueAtTime(target, at);
      else osc.frequency.setTargetAtTime(target, at, 1.6); // a slow glide, so chords melt into each other
    });
    if (!immediately) this.note(hz(chord[0] - 12), at + 0.4, 0.5, 6);
  }

  /** One felt-piano note: a few decaying partials, soft attack, most of it sent to the reverb. */
  private note(frequency: number, at: number, velocity: number, decay: number) {
    const ctx = this.ctx;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.16 * velocity, at + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

    const mute = ctx.createBiquadFilter(); // the felt: brightness falls away as the note rings
    mute.type = "lowpass";
    mute.frequency.setValueAtTime(900 + 1700 * velocity, at);
    mute.frequency.exponentialRampToValueAtTime(420, at + decay * 0.7);
    mute.connect(env);
    env.connect(this.dry);
    env.connect(this.wet);

    [
      [1, 1],
      [2, 0.32],
      [3, 0.1],
      [4.02, 0.04],
    ].forEach(([ratio, level]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency * ratio;
      const gain = ctx.createGain();
      gain.gain.value = level;
      osc.connect(gain).connect(mute);
      osc.start(at);
      osc.stop(at + decay + 0.1);
    });
  }

  /** Write the music up to `time` on the audio clock. Call it a little ahead of now, repeatedly. */
  scheduleUntil(time: number) {
    const { bar: barLength, space, lift, key } = this.mood;

    while (this.barStart + barLength <= time) {
      this.barStart += barLength;
      this.bar++;
      this.voiceChord(this.barStart);
    }

    while (this.nextNote <= time) {
      const at = this.nextNote;
      // Melody walks by step through the pentatonic most of the time, so it sings rather than jumps.
      const step = this.random() < 0.72 ? (this.random() < 0.5 ? -1 : 1) : Math.floor(this.random() * 5) - 2;
      this.lastDegree = Math.max(0, Math.min(9, this.lastDegree + step));
      const semitone = PENTATONIC[this.lastDegree % 5] + 12 * Math.floor(this.lastDegree / 5) + key + 12 + 12 * lift;
      const velocity = 0.45 + this.random() * 0.4;
      this.note(hz(semitone), at, velocity, 4.5 + this.random() * 2);

      // Now and then, a second note a moment later from the chord, like a hand settling.
      if (this.random() < 0.3) {
        const chord = this.chord();
        const tone = chord[1 + Math.floor(this.random() * (chord.length - 1))] + 12 * lift;
        this.note(hz(tone + (this.random() < 0.5 ? 12 : 0)), at + 0.28 + this.random() * 0.4, velocity * 0.7, 5);
      }

      // Uneven spacing, and sometimes a longer silence, so it breathes.
      this.nextNote = at + space * (0.55 + this.random() * 0.9) + (this.random() < 0.18 ? space : 0);
    }
  }
}

/** The live player: owns the audio context, keeps the score written a second ahead, and fades in and out. */
export class Music {
  private ctx?: AudioContext;
  private score?: Score;
  private master?: GainNode;
  private timer = 0;
  private scene: SceneId;

  constructor(scene: SceneId) {
    this.scene = scene;
  }

  /** Must be called from a tap the first time, or the browser keeps the audio context suspended. */
  start() {
    if (!this.ctx) this.build();
    const { ctx, master } = this;
    if (!ctx || !master) return;
    void ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(LEVEL, ctx.currentTime, 1.4);
    clearInterval(this.timer);
    const write = () => this.score?.scheduleUntil(ctx.currentTime + 1.2);
    write();
    this.timer = window.setInterval(write, 250);
  }

  /** Fade out. The notes already ringing finish under the fade. */
  stop() {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.7);
    clearInterval(this.timer);
  }

  destroy() {
    this.stop();
    const ctx = this.ctx;
    this.ctx = undefined;
    this.score = undefined;
    this.master = undefined;
    if (ctx) setTimeout(() => void ctx.close().catch(() => {}), 3500);
  }

  private build() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    // A gentle limiter, in case several notes and the pad swell together.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.4;
    const score = new Score(ctx, this.scene);
    score.output.connect(limiter).connect(master).connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.score = score;
  }
}
