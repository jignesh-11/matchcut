import { SoundEffectType } from '../../types/editor';

export class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a real-time sound effect during canvas playback
   */
  public playCutSound(effect: SoundEffectType, volume: number = 0.8): void {
    if (effect === 'none') return;
    const ctx = this.getContext();
    if (!ctx) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    const now = ctx.currentTime;

    switch (effect) {
      case 'shutter':
        this.synthShutter(ctx, now, clampedVolume);
        break;
      case 'whoosh':
        this.synthWhoosh(ctx, now, clampedVolume);
        break;
      case 'thud':
        this.synthThud(ctx, now, clampedVolume);
        break;
      case 'glitch':
        this.synthGlitch(ctx, now, clampedVolume);
        break;
      case 'pop':
        this.synthPop(ctx, now, clampedVolume);
        break;
      case 'typewriter':
        this.synthTypewriter(ctx, now, clampedVolume);
        break;
      default:
        break;
    }
  }

  // ===================== REAL-TIME SYNTHESIS =====================

  private synthShutter(ctx: AudioContext | OfflineAudioContext, startTime: number, volume: number): void {
    // Shutter Click 1 (Mirror flip)
    this.createNoiseBurst(ctx, startTime, 0.02, 2800, volume * 0.9);
    this.createToneImpulse(ctx, startTime, 1800, 0.015, volume * 0.7);

    // Shutter Click 2 (Curtain close, 28ms later)
    this.createNoiseBurst(ctx, startTime + 0.028, 0.025, 3400, volume * 1.0);
    this.createToneImpulse(ctx, startTime + 0.028, 1200, 0.02, volume * 0.6);
  }

  private synthWhoosh(ctx: AudioContext | OfflineAudioContext, startTime: number, volume: number): void {
    const duration = 0.16;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.5;
    filter.frequency.setValueAtTime(350, startTime);
    filter.frequency.exponentialRampToValueAtTime(2600, startTime + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(400, startTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.85, startTime + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration);
  }

  private synthThud(ctx: AudioContext | OfflineAudioContext, startTime: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, startTime);
    osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.15);

    gain.gain.setValueAtTime(volume * 1.1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }

  private synthGlitch(ctx: AudioContext | OfflineAudioContext, startTime: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, startTime);
    osc.frequency.setValueAtTime(450, startTime + 0.012);
    osc.frequency.setValueAtTime(2200, startTime + 0.025);
    osc.frequency.setValueAtTime(800, startTime + 0.038);

    gain.gain.setValueAtTime(volume * 0.65, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.055);
  }

  private synthPop(ctx: AudioContext | OfflineAudioContext, startTime: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, startTime);
    osc.frequency.exponentialRampToValueAtTime(1400, startTime + 0.02);

    gain.gain.setValueAtTime(volume * 0.8, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.045);
  }

  private synthTypewriter(ctx: AudioContext | OfflineAudioContext, startTime: number, volume: number): void {
    this.createNoiseBurst(ctx, startTime, 0.015, 2200, volume * 0.7);
    this.createToneImpulse(ctx, startTime, 1600, 0.02, volume * 0.5);
  }

  // ===================== HELPER NOISE & IMPULSE NODES =====================

  private createNoiseBurst(
    ctx: AudioContext | OfflineAudioContext,
    startTime: number,
    duration: number,
    cutoff: number,
    volume: number
  ): void {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(cutoff, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration);
  }

  private createToneImpulse(
    ctx: AudioContext | OfflineAudioContext,
    startTime: number,
    freq: number,
    duration: number,
    volume: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, startTime + duration);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Renders an entire synced audio track for export using OfflineAudioContext
   */
  public async renderOfflineAudioTrack(
    totalDuration: number,
    cutTimestamps: number[],
    effect: SoundEffectType,
    volume: number = 0.8
  ): Promise<AudioBuffer | null> {
    if (effect === 'none' || totalDuration <= 0 || cutTimestamps.length === 0) {
      return null;
    }

    const sampleRate = 44100;
    const lengthInSamples = Math.ceil(totalDuration * sampleRate);
    const offlineCtx = new OfflineAudioContext(2, lengthInSamples, sampleRate);

    for (const time of cutTimestamps) {
      if (time >= totalDuration) continue;
      switch (effect) {
        case 'shutter':
          this.synthShutter(offlineCtx, time, volume);
          break;
        case 'whoosh':
          this.synthWhoosh(offlineCtx, time, volume);
          break;
        case 'thud':
          this.synthThud(offlineCtx, time, volume);
          break;
        case 'glitch':
          this.synthGlitch(offlineCtx, time, volume);
          break;
        case 'pop':
          this.synthPop(offlineCtx, time, volume);
          break;
        case 'typewriter':
          this.synthTypewriter(offlineCtx, time, volume);
          break;
        default:
          break;
      }
    }

    try {
      return await offlineCtx.startRendering();
    } catch (e) {
      console.warn('Offline audio rendering failed:', e);
      return null;
    }
  }
}

export const soundManager = new SoundManager();
