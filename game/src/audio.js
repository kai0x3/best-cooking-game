// audio.js — tiny WebAudio synth: clicks, sizzle bursts, dings, coin
// arpeggios and a sad strike tone. No audio files, everything generated.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  ensure() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }
  tone(freq, dur = 0.12, type = 'sine', gain = 0.16, when = 0, slideTo = null) {
    if (this.muted) return;
    const ctx = this.ensure(); if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  click() { this.tone(660, 0.06, 'square', 0.07); }
  pop() { this.tone(420, 0.09, 'sine', 0.14, 0, 760); }
  trash() { this.tone(220, 0.16, 'sawtooth', 0.1, 0, 110); }
  ding() { this.tone(1046, 0.22, 'sine', 0.16); this.tone(1568, 0.3, 'sine', 0.1, 0.07); }
  golden() { this.tone(880, 0.12, 'triangle', 0.14); this.tone(1174, 0.18, 'triangle', 0.12, 0.08); }
  strike() { this.tone(196, 0.4, 'sawtooth', 0.13, 0, 98); }
  win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.24, 'triangle', 0.15, i * 0.13)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.13, i * 0.15)); }
  coins() { [1318, 1568, 2093].forEach((f, i) => this.tone(f, 0.14, 'square', 0.07, i * 0.06)); }
  // Short filtered-noise burst that reads as a sizzle when food lands.
  sizzle() {
    if (this.muted) return;
    const ctx = this.ensure(); if (!ctx) return;
    const dur = 0.35;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 3200;
    const g = ctx.createGain(); g.gain.value = 0.12;
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start();
  }
}
