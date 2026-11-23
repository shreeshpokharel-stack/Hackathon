import type { Timeline } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  public muted = false;
  public volume = 0.65;
  private ambientTimer = 0;

  init(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.unlocked = true;
      }).catch(() => {});
    } else if (this.ctx && this.ctx.state === 'running') {
      this.unlocked = true;
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.14,
    slideTo: number | null = null
  ): void {
    if (this.muted || !this.ctx || !this.unlocked || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitchJitter = 0.94 + Math.random() * 0.12;
    osc.type = type;
    osc.frequency.setValueAtTime(freq * pitchJitter, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo * pitchJitter), now + duration);
    }
    const vol = gainVal * this.volume;
    gain.gain.setValueAtTime(Math.max(0.001, vol), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  jump(): void {
    this.playTone(250, 0.14, 'triangle', 0.13, 500);
  }

  land(): void {
    this.playTone(125, 0.08, 'sine', 0.09, 65);
  }

  shift(toFuture: boolean): void {
    if (toFuture) {
      this.playTone(520, 0.24, 'sawtooth', 0.09, 190);
      setTimeout(() => this.playTone(340, 0.2, 'sine', 0.11, 680), 65);
    } else {
      this.playTone(280, 0.24, 'triangle', 0.12, 560);
    }
  }

  interact(): void {
    this.playTone(440, 0.12, 'sine', 0.13, 660);
    setTimeout(() => this.playTone(660, 0.18, 'triangle', 0.11, 880), 75);
  }

  freeze(): void {
    this.playTone(880, 0.34, 'sine', 0.12, 220);
  }

  collect(): void {
    this.playTone(587, 0.1, 'sine', 0.14);
    setTimeout(() => this.playTone(880, 0.2, 'sine', 0.14), 75);
  }

  hazard(): void {
    this.playTone(160, 0.24, 'sawtooth', 0.15, 65);
  }

  victory(): void {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.32, 'triangle', 0.14), i * 110);
    });
  }

  updateAmbient(dt: number, anchor: Timeline): void {
    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0) {
      this.ambientTimer = anchor === 'past' ? 2.4 : 2.8;
      if (anchor === 'past') {
        const notes = [392, 440, 523, 587];
        this.playTone(notes[Math.floor(Math.random() * notes.length)], 0.9, 'sine', 0.024);
      } else {
        const notes = [130, 146, 164, 196];
        this.playTone(notes[Math.floor(Math.random() * notes.length)], 1.2, 'triangle', 0.022);
      }
    }
  }
}

export const SFX = new SoundEngine();
