/**
 * A soft, generated pad that sits under the voice: an open D chord of detuned
 * sine partials, each swelling at its own slow rate, through a low-pass filter
 * and a long feedback delay. Nothing is downloaded and it never repeats.
 */
const PARTIALS = [73.42, 110, 146.83, 185, 220, 329.63]; // D2 A2 D3 F#3 A3 E4
const LEVEL = 0.085;

export class SoundBed {
  private ctx?: AudioContext;
  private master?: GainNode;

  /** Must be called from a tap, or the browser will keep the audio context suspended. */
  start() {
    if (!this.ctx) this.build();
    const { ctx, master } = this;
    if (!ctx || !master) return;
    void ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(LEVEL, ctx.currentTime, 1.6);
  }

  stop() {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
  }

  destroy() {
    this.stop();
    const ctx = this.ctx;
    this.ctx = undefined;
    this.master = undefined;
    if (ctx) setTimeout(() => void ctx.close().catch(() => {}), 2500);
  }

  private build() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 780;
    filter.Q.value = 0.4;

    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.61;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.42;
    delay.connect(feedback).connect(delay);

    filter.connect(master);
    filter.connect(delay);
    delay.connect(master);
    master.connect(ctx.destination);

    PARTIALS.forEach((frequency, i) => {
      for (const detune of [-5, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        osc.detune.value = detune;

        const gain = ctx.createGain();
        const level = 0.22 / (1 + i * 0.55);
        gain.gain.value = level;

        // Each partial breathes on its own cycle, so the chord never sits still.
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.035 + i * 0.011 + (detune > 0 ? 0.006 : 0);
        const depth = ctx.createGain();
        depth.gain.value = level * 0.7;
        lfo.connect(depth).connect(gain.gain);

        osc.connect(gain).connect(filter);
        osc.start();
        lfo.start();
      }
    });

    this.ctx = ctx;
    this.master = master;
  }
}
