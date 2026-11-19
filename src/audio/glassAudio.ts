import { BottleSpec, WallStyle } from '../types/game';

const INHARMONIC_GLASS_RATIOS = [
  0.78, 1.0, 1.29, 1.63, 1.97, 2.38, 2.81, 3.27, 3.79, 4.35, 5.04, 5.82, 6.65, 7.42,
];

const SHATTER_SAMPLE_URLS = [
  '/assets/audio/shatter_1.mp3',
  '/assets/audio/shatter_2.mp3',
  '/assets/audio/shatter_3.mp3',
  '/assets/audio/shatter_4.mp3',
  '/assets/audio/shatter_5.mp3',
];

class GlassAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private wetBus: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private rawBuffers: ArrayBuffer[] = [];
  private rawFetchPromise: Promise<void> | null = null;
  private shatterBuffers: AudioBuffer[] = [];
  private samplesLoadingPromise: Promise<void> | null = null;
  private lastSampleIndex = -1;
  private muted = false;

  // Rain ambience loop
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainActive = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      void this.prefetchRawSamples();
    }
  }

  private async prefetchRawSamples(): Promise<void> {
    if (this.rawFetchPromise || this.rawBuffers.length > 0) return;
    this.rawFetchPromise = (async () => {
      const results = await Promise.allSettled(
        SHATTER_SAMPLE_URLS.map(async (url) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${url}`);
          }
          return response.arrayBuffer();
        }),
      );
      const bytes: ArrayBuffer[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.byteLength > 0) {
          bytes.push(r.value);
        }
      }
      if (bytes.length > 0) {
        this.rawBuffers = bytes;
      }
    })();

    try {
      await this.rawFetchPromise;
    } finally {
      if (this.rawBuffers.length === 0) {
        this.rawFetchPromise = null;
      }
    }
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -10;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.002;
      this.compressor.release.value = 0.15;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.92;

      this.dryBus = this.ctx.createGain();
      this.dryBus.gain.value = 0.9;

      this.wetBus = this.ctx.createGain();
      this.wetBus.gain.value = 0.28;

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.buildRoomImpulse(this.ctx, 0.78);

      this.dryBus.connect(this.compressor);
      this.wetBus.connect(this.convolver);
      this.convolver.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.noiseBuffer = this.buildNoiseBuffer(this.ctx, 2.0);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    if (this.ctx && this.shatterBuffers.length === 0 && !this.samplesLoadingPromise) {
      void this.loadShatterSamples();
    }

    if (this.rainActive && !this.rainSource) {
      this.startRainNodes();
    }
  }

  private async loadShatterSamples(): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.samplesLoadingPromise = (async () => {
      if (this.rawBuffers.length === 0) {
        await this.prefetchRawSamples();
      }
      if (this.rawBuffers.length === 0) return;

      const results = await Promise.allSettled(
        this.rawBuffers.map((buf) => ctx.decodeAudioData(buf.slice(0))),
      );

      const loaded: AudioBuffer[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          loaded.push(result.value);
        }
      }

      if (loaded.length > 0) {
        this.shatterBuffers = loaded;
      }
    })();

    try {
      await this.samplesLoadingPromise;
    } finally {
      if (this.shatterBuffers.length === 0) {
        this.samplesLoadingPromise = null;
      }
    }
  }

  private pickShatterBuffer(): AudioBuffer | null {
    const count = this.shatterBuffers.length;
    if (count === 0) return null;
    if (count === 1) return this.shatterBuffers[0];

    let idx = Math.floor(Math.random() * count);
    if (idx === this.lastSampleIndex) {
      idx = (idx + 1 + Math.floor(Math.random() * (count - 1))) % count;
    }
    this.lastSampleIndex = idx;
    return this.shatterBuffers[idx];
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.92, this.ctx.currentTime, 0.02);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setRainAmbience(enabled: boolean): void {
    this.rainActive = enabled;
    if (enabled) {
      if (this.ctx && !this.rainSource) {
        this.startRainNodes();
      } else if (this.ctx && this.rainGain) {
        this.rainGain.gain.setTargetAtTime(0.085, this.ctx.currentTime, 0.35);
      }
    } else if (this.ctx && this.rainGain) {
      this.rainGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  }

  private startRainNodes(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.rainSource) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1450;
    bp.Q.value = 0.55;

    const hs = this.ctx.createBiquadFilter();
    hs.type = 'highshelf';
    hs.frequency.value = 3800;
    hs.gain.value = -5;

    const gain = this.ctx.createGain();
    gain.gain.value = this.rainActive ? 0.085 : 0.0001;

    src.connect(bp);
    bp.connect(hs);
    hs.connect(gain);
    gain.connect(this.dryBus);
    src.start();

    this.rainSource = src;
    this.rainGain = gain;
  }

  private buildNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private buildRoomImpulse(ctx: AudioContext, durationSec: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 5.6);
        const raw = (Math.random() * 2 - 1) * decay;
        lp = lp * 0.42 + raw * 0.58;
        data[i] = lp;
      }
      const tap1 = Math.floor(0.014 * sampleRate);
      const tap2 = Math.floor(0.026 * sampleRate);
      const tap3 = Math.floor(0.044 * sampleRate);
      if (tap1 < length) data[tap1] += ch === 0 ? 0.34 : 0.24;
      if (tap2 < length) data[tap2] += ch === 0 ? 0.21 : 0.32;
      if (tap3 < length) data[tap3] += 0.14;
    }
    return buffer;
  }

  public playThrowWhoosh(powerRatio: number, slowMo = false): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.dryBus || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const dur = slowMo ? 0.28 : 0.15;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.6;
    const startFreq = slowMo ? 180 : 280;
    const peakFreq = (slowMo ? 520 : 850) + powerRatio * 650;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(peakFreq, now + dur * 0.55);
    filter.frequency.exponentialRampToValueAtTime(220, now + dur);

    const gain = this.ctx.createGain();
    const peak = 0.08 + powerRatio * 0.14;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.dryBus);

    src.start(now);
    src.stop(now + dur + 0.02);
  }

  public playBottlePickup(pitchBaseHz: number): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.dryBus || !this.wetBus) return;

    const now = this.ctx.currentTime;
    const freq = Math.min(8000, pitchBaseHz * (0.95 + Math.random() * 0.1));

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.dryBus);
    gain.connect(this.wetBus);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playBottleBounce(bottle: BottleSpec, panX: number): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.dryBus || !this.wetBus) return;

    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.85, Math.min(0.85, panX));
    panner.connect(this.dryBus);
    panner.connect(this.wetBus);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bottle.pitchBaseHz * 0.38, now);
    osc.frequency.exponentialRampToValueAtTime(bottle.pitchBaseHz * 0.22, now + 0.09);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(g);
    g.connect(panner);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playWallShatter(
    bottle: BottleSpec,
    impactSpeed: number,
    panX: number,
    wallStyle: WallStyle,
    slowMo = false,
  ): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.dryBus || !this.wetBus || !this.noiseBuffer) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const intensity = Math.min(1.4, Math.max(0.48, impactSpeed / 15));
    const timeStretch = slowMo ? 2.0 : 1.0;
    const pitchShift = slowMo ? 0.78 : 1.0;

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.85, Math.min(0.85, panX));
    panner.connect(this.dryBus);
    panner.connect(this.wetBus);

    // ---------------------------------------------------------
    // 1. SURFACE-SPECIFIC IMPACT BODY (natural wall thwack/clang)
    // ---------------------------------------------------------
    if (wallStyle === 'metal') {
      const metalPartials = [235, 372, 588, 845];
      for (let m = 0; m < metalPartials.length; m++) {
        const osc = ctx.createOscillator();
        osc.type = m === 0 ? 'triangle' : 'sine';
        const f = metalPartials[m] * (0.96 + Math.random() * 0.08) * pitchShift;
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.94, now + 0.45 * timeStretch);

        const mg = ctx.createGain();
        const amp = (0.22 / (m + 1)) * intensity;
        mg.gain.setValueAtTime(amp, now);
        mg.gain.exponentialRampToValueAtTime(0.0001, now + (0.46 - m * 0.07) * timeStretch);

        osc.connect(mg);
        mg.connect(panner);
        osc.start(now);
        osc.stop(now + 0.5 * timeStretch);
      }
    } else if (wallStyle === 'glass_window') {
      const paneModes = [680, 1140, 1780, 2650];
      for (let p = 0; p < paneModes.length; p++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(paneModes[p] * pitchShift, now);
        const pg = ctx.createGain();
        pg.gain.setValueAtTime(0.075 * intensity, now);
        pg.gain.exponentialRampToValueAtTime(0.0001, now + (0.24 + p * 0.05) * timeStretch);
        osc.connect(pg);
        pg.connect(panner);
        osc.start(now);
        osc.stop(now + 0.38 * timeStretch);
      }
    } else {
      // Tight stony/masonry wall thwack (noise transient + subtle damped thump)
      const slapSrc = ctx.createBufferSource();
      slapSrc.buffer = this.noiseBuffer;
      const slapFilter = ctx.createBiquadFilter();
      slapFilter.type = 'bandpass';
      slapFilter.frequency.value = (wallStyle === 'concrete' ? 460 : 340) * pitchShift;
      slapFilter.Q.value = 1.25;

      const slapGain = ctx.createGain();
      const slapAmp = Math.min(0.45, 0.28 * intensity * Math.sqrt(bottle.massKg));
      slapGain.gain.setValueAtTime(slapAmp, now);
      slapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.036 * timeStretch);

      slapSrc.connect(slapFilter);
      slapFilter.connect(slapGain);
      slapGain.connect(panner);
      slapSrc.start(now, Math.random() * 0.5);
      slapSrc.stop(now + 0.045 * timeStretch);

      const thudOsc = ctx.createOscillator();
      thudOsc.type = 'triangle';
      const thudStart =
        (wallStyle === 'concrete' ? 165 : 132) * (1 / Math.sqrt(bottle.massKg)) * pitchShift;
      thudOsc.frequency.setValueAtTime(Math.min(280, thudStart), now);
      thudOsc.frequency.exponentialRampToValueAtTime(52 * pitchShift, now + 0.042 * timeStretch);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(Math.min(0.28, 0.18 * intensity * Math.sqrt(bottle.massKg)), now);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048 * timeStretch);

      thudOsc.connect(thudGain);
      thudGain.connect(panner);
      thudOsc.start(now);
      thudOsc.stop(now + 0.055 * timeStretch);
    }

    // Champagne pressurized cork pop!
    if (bottle.id === 'champagne') {
      const popOsc = ctx.createOscillator();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(320 * pitchShift, now);
      popOsc.frequency.exponentialRampToValueAtTime(85 * pitchShift, now + 0.045 * timeStretch);
      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.38 * intensity, now);
      popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 * timeStretch);
      popOsc.connect(popGain);
      popGain.connect(panner);
      popOsc.start(now);
      popOsc.stop(now + 0.06 * timeStretch);
    }

    // ---------------------------------------------------------
    // 2. REAL VIDEO SHATTER RECORDING (TRANSIENT-CLEAN)
    // ---------------------------------------------------------
    const realSample = this.pickShatterBuffer();
    if (realSample) {
      const bottleRate = Math.pow(bottle.pitchBaseHz / 3600, 0.2);
      const microVar = 0.96 + Math.random() * 0.08;
      const slowRate = slowMo ? 0.56 : 1.0;
      const playbackRate = Math.max(0.45, Math.min(1.55, bottleRate * microVar * slowRate));

      const src = ctx.createBufferSource();
      src.buffer = realSample;
      src.playbackRate.value = playbackRate;

      const sampleGain = ctx.createGain();
      const baseVol = Math.min(1.38, 1.05 * intensity * (0.9 + bottle.thicknessFactor * 0.1));
      sampleGain.gain.setValueAtTime(baseVol, now);

      src.connect(sampleGain);
      sampleGain.connect(panner);
      src.start(now);

      // Tempered glass window triggers a second staggered real shatter pane burst
      if (wallStyle === 'glass_window') {
        const secondSample = this.pickShatterBuffer() ?? realSample;
        const src2 = ctx.createBufferSource();
        src2.buffer = secondSample;
        src2.playbackRate.value = Math.min(1.65, playbackRate * 1.12);

        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.58 * intensity, now + 0.026 * timeStretch);
        src2.connect(g2);
        g2.connect(panner);
        src2.start(now + 0.026 * timeStretch);
      } else if (bottle.massKg >= 0.9) {
        const trailSample = this.pickShatterBuffer() ?? realSample;
        const srcTrail = ctx.createBufferSource();
        srcTrail.buffer = trailSample;
        srcTrail.playbackRate.value = Math.max(0.45, playbackRate * 0.88);

        const gTrail = ctx.createGain();
        gTrail.gain.setValueAtTime(0.36 * intensity, now + 0.055 * timeStretch);
        srcTrail.connect(gTrail);
        gTrail.connect(panner);
        srcTrail.start(now + 0.055 * timeStretch);
      }

      // Staggered real-shard scatter tail (skips the initial impact so there is no double-hit)
      const scatterSample = this.pickShatterBuffer() ?? realSample;
      if (scatterSample.duration > 0.22) {
        const scatterStart = now + 0.18 * timeStretch;
        const scatterOffset = Math.min(0.16, scatterSample.duration * 0.24);
        const srcScatter = ctx.createBufferSource();
        srcScatter.buffer = scatterSample;
        srcScatter.playbackRate.value = Math.max(0.45, Math.min(1.55, playbackRate * 0.92));

        const scatterHp = ctx.createBiquadFilter();
        scatterHp.type = 'highpass';
        scatterHp.frequency.value = 2600;

        const gScatter = ctx.createGain();
        gScatter.gain.setValueAtTime(0.0001, scatterStart);
        gScatter.gain.linearRampToValueAtTime(0.42 * intensity, scatterStart + 0.025 * timeStretch);
        gScatter.gain.exponentialRampToValueAtTime(
          0.0001,
          scatterStart + (scatterSample.duration - scatterOffset) * timeStretch + 0.05,
        );

        srcScatter.connect(scatterHp);
        scatterHp.connect(gScatter);
        gScatter.connect(panner);
        srcScatter.start(scatterStart, scatterOffset);
      }

      // Subtle 3D floor-scatter glass shard tinkles extending as shards settle
      const tinkleCount = Math.min(20, 10 + Math.floor(bottle.shardCount * 0.15));
      for (let k = 0; k < tinkleCount; k++) {
        const progress = k / tinkleCount;
        const delay = (0.14 + Math.pow(progress, 1.3) * 0.9 + Math.random() * 0.05) * timeStretch;
        const start = now + delay;

        const shardPan = ctx.createStereoPanner();
        shardPan.pan.value = Math.max(-0.9, Math.min(0.9, panX * 0.6 + (Math.random() - 0.5) * 0.9));
        shardPan.connect(this.dryBus);
        shardPan.connect(this.wetBus);

        const f1 = Math.min(12500, (3100 + Math.random() * 5400) * bottleRate * pitchShift);
        const shardDecay = (0.028 + Math.random() * 0.055) * timeStretch;
        const shardAmp = (1 - progress * 0.68) * 0.036 * intensity;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f1, start);

        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.0001, start);
        sg.gain.linearRampToValueAtTime(shardAmp, start + 0.0008);
        sg.gain.exponentialRampToValueAtTime(0.0001, start + shardDecay);

        osc.connect(sg);
        sg.connect(shardPan);
        osc.start(start);
        osc.stop(start + shardDecay + 0.008);
      }
      return;
    }

    // ---------------------------------------------------------
    // 3. PROCEDURAL FALLBACK (if sample buffer still decoding)
    // ---------------------------------------------------------
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = this.noiseBuffer;
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.value =
      (wallStyle === 'concrete' ? 2400 : wallStyle === 'glass_window' ? 3200 : 1800) * pitchShift;
    crackFilter.Q.value = 0.9;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.75 * intensity, now);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026 * timeStretch);
    crackSrc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(panner);
    crackSrc.start(now);
    crackSrc.stop(now + 0.032 * timeStretch);

    const burstOffsets = [0, 0.007 * timeStretch, 0.017 * timeStretch];
    const burstCutoffs = wallStyle === 'glass_window' ? [2800, 5000, 7400] : [2400, 4200, 6200];
    const glassBoost = wallStyle === 'glass_window' ? 1.28 : 1.0;

    for (let b = 0; b < burstOffsets.length; b++) {
      const start = now + burstOffsets[b];
      const dur = (0.095 + b * 0.035) * timeStretch;

      const nSrc = ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      nSrc.playbackRate.value = (0.9 + Math.random() * 0.25) * pitchShift;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = burstCutoffs[b] * pitchShift;

      const bp = ctx.createBiquadFilter();
      bp.type = 'peaking';
      bp.frequency.value = Math.min(12000, bottle.pitchBaseHz * (1.1 + b * 0.35) * pitchShift);
      bp.Q.value = 2.4;
      bp.gain.value = 7;

      const nGain = ctx.createGain();
      const peak = (0.48 - b * 0.1) * intensity * glassBoost;
      nGain.gain.setValueAtTime(0.0001, start);
      nGain.gain.linearRampToValueAtTime(peak, start + 0.0015);
      nGain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      nSrc.connect(hp);
      hp.connect(bp);
      bp.connect(nGain);
      nGain.connect(panner);

      nSrc.start(start, Math.random() * 0.5);
      nSrc.stop(start + dur + 0.01);
    }

    const basePitch = bottle.pitchBaseHz * (0.94 + Math.random() * 0.12) * pitchShift;
    for (let i = 0; i < INHARMONIC_GLASS_RATIOS.length; i++) {
      const ratio = INHARMONIC_GLASS_RATIOS[i];
      const freq = basePitch * ratio * (0.95 + Math.random() * 0.1);
      if (freq > 14500) continue;

      const delay = Math.random() * 0.024 * timeStretch;
      const start = now + delay;
      const decay = (0.055 + Math.random() * 0.12) * bottle.thicknessFactor * timeStretch;

      const osc = ctx.createOscillator();
      osc.type = i % 3 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      const g = ctx.createGain();
      const amp = (0.085 / (1 + i * 0.22)) * intensity * glassBoost;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(amp, start + 0.0012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + decay);

      osc.connect(g);
      g.connect(panner);

      osc.start(start);
      osc.stop(start + decay + 0.01);
    }

    const extraWindowShards = wallStyle === 'glass_window' ? 8 : 0;
    const tinkleCount = Math.min(34, Math.floor(18 + bottle.shardCount * 0.24) + extraWindowShards);
    for (let k = 0; k < tinkleCount; k++) {
      const progress = k / tinkleCount;
      const delay =
        (0.055 + Math.pow(progress, 1.45) * 0.85 + (Math.random() - 0.5) * 0.04) * timeStretch;
      const start = now + Math.max(0.03, delay);

      const shardPan = ctx.createStereoPanner();
      const spread = (Math.random() - 0.5) * 0.95;
      shardPan.pan.value = Math.max(-0.9, Math.min(0.9, panX * 0.65 + spread));
      shardPan.connect(this.dryBus);
      shardPan.connect(this.wetBus);

      const f1 = (2900 + Math.random() * 6800) * pitchShift;
      const f2 = f1 * (1.14 + Math.random() * 0.16);
      const shardDecay = (0.022 + Math.random() * 0.055) * timeStretch;
      const shardAmp =
        (1 - progress * 0.72) * (0.045 + Math.random() * 0.055) * intensity * glassBoost;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(f1, start);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(Math.min(15500, f2), start);

      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, start);
      sg.gain.linearRampToValueAtTime(shardAmp, start + 0.0008);
      sg.gain.exponentialRampToValueAtTime(0.0001, start + shardDecay);

      osc1.connect(sg);
      osc2.connect(sg);
      sg.connect(shardPan);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + shardDecay + 0.008);
      osc2.stop(start + shardDecay + 0.008);

      if (k < 12) {
        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = this.noiseBuffer;
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.value = 4500 * pitchShift;
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(shardAmp * 1.4, start);
        cg.gain.exponentialRampToValueAtTime(0.0001, start + 0.006 * timeStretch);
        clickSrc.connect(clickFilter);
        clickFilter.connect(cg);
        cg.connect(shardPan);
        clickSrc.start(start, Math.random() * 0.4);
        clickSrc.stop(start + 0.01 * timeStretch);
      }
    }
  }

  public playTargetHit(combo: number, isCeramic = false): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.dryBus || !this.wetBus) return;

    const now = this.ctx.currentTime;
    const base = isCeramic ? 920 : 660;
    const f = Math.min(1600, base + Math.min(combo, 10) * 55);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.setValueAtTime(f * 1.25, now + 0.045);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(g);
    g.connect(this.dryBus);
    g.connect(this.wetBus);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playChallengeEnd(won: boolean): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.dryBus || !this.wetBus) return;

    const now = this.ctx.currentTime;
    const notes = won ? [523.25, 659.25, 783.99, 1046.5] : [392.0, 349.23, 293.66];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.dryBus || !this.wetBus) return;
      const start = now + i * 0.09;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.14, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

      osc.connect(g);
      g.connect(this.dryBus);
      g.connect(this.wetBus);
      osc.start(start);
      osc.stop(start + 0.38);
    });
  }

  public playSweepBroom(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.dryBus || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    for (let s = 0; s < 2; s++) {
      const start = now + s * 0.16;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(900, start);
      bp.frequency.linearRampToValueAtTime(2200, start + 0.12);
      bp.Q.value = 1.1;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(this.dryBus);

      src.start(start);
      src.stop(start + 0.17);
    }
  }
}

export const glassAudio = new GlassAudioEngine();
