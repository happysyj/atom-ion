/**
 * Web Audio API based procedural synthesizer for stage-specific bright ambient BGM
 * and game sound effects. Completely self-contained, no external mp3 assets needed.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private currentStage: number = 0;
  private isBgmPlaying: boolean = false;
  private isMuted: boolean = false;
  private timerId: number | null = null;
  private step: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // Soft, non-intrusive background volume
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  // --- Sound Effects ---

  public playCardSelect() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.06); // E5

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // AudioContext gestures
    }
  }

  public playCorrect() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Bright cheerful chime)

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } catch {
      // ignore
    }
  }

  public playWrong() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(174.61, now + 0.2); // A3 to F3

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  public playBonus() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major triumphant fanfare
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.3, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
    } catch {
      // ignore
    }
  }

  public playVictory() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const chords = [
        [523.25, 659.25, 783.99], // C
        [587.33, 739.99, 880.0],  // D
        [659.25, 830.61, 987.77], // E
        [1046.5, 1318.51, 1567.98] // High C
      ];

      chords.forEach((chord, i) => {
        const time = now + i * 0.22;
        chord.forEach((freq) => {
          if (!this.ctx || !this.sfxGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(0.25, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + (i === 3 ? 0.9 : 0.35));

          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(time);
          osc.stop(time + (i === 3 ? 0.9 : 0.35));
        });
      });
    } catch {
      // ignore
    }
  }

  // --- Background Music System (Procedural Lo-Fi Synthesizer) ---

  public startStageBgm(stageNum: number) {
    this.stopBgm();
    this.currentStage = stageNum;
    this.step = 0;
    this.isBgmPlaying = true;

    try {
      this.initContext();
      this.scheduleNextBgmLoop();
    } catch {
      // user interaction might be pending
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleNextBgmLoop() {
    if (!this.isBgmPlaying) return;

    // Tempo depends on stage
    // Stage 1: 105 BPM (interval ~285ms)
    // Stage 2: 92 BPM (interval ~326ms)
    // Stage 3: 110 BPM (interval ~272ms)
    // Stage 4: 88 BPM (interval ~340ms)
    let interval = 300;
    if (this.currentStage === 1) interval = 285;
    else if (this.currentStage === 2) interval = 326;
    else if (this.currentStage === 3) interval = 270;
    else if (this.currentStage === 4) interval = 340;

    this.playStageNote(this.currentStage, this.step);
    this.step = (this.step + 1) % 32;

    this.timerId = window.setTimeout(() => {
      this.scheduleNextBgmLoop();
    }, interval);
  }

  private playStageNote(stage: number, step: number) {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Stage 1: Playful, Bright C Major Pentatonic Marimba / Celeste
    if (stage === 1) {
      const melody = [
        261.63, 0, 329.63, 392.0, 523.25, 0, 392.0, 329.63,
        293.66, 0, 349.23, 440.0, 523.25, 440.0, 349.23, 293.66,
        329.63, 392.0, 523.25, 659.25, 523.25, 392.0, 329.63, 261.63,
        392.0, 0, 523.25, 659.25, 783.99, 659.25, 523.25, 392.0
      ];
      const bass = [
        130.81, 0, 0, 0, 130.81, 0, 0, 0,
        146.83, 0, 0, 0, 146.83, 0, 0, 0,
        164.81, 0, 0, 0, 164.81, 0, 0, 0,
        196.00, 0, 0, 0, 196.00, 0, 0, 0
      ];

      const freq = melody[step];
      if (freq > 0) {
        this.synthChime(freq, now, 0.08, 'sine');
      }
      const bassFreq = bass[step];
      if (bassFreq > 0) {
        this.synthBass(bassFreq, now, 0.12);
      }
    }
    // Stage 2: Periodic Table - Crystal Chords & Sparkling Arpeggio
    else if (stage === 2) {
      const melody = [
        349.23, 440.0, 523.25, 659.25, 440.0, 523.25, 659.25, 783.99,
        392.00, 493.88, 587.33, 783.99, 493.88, 587.33, 783.99, 987.77,
        329.63, 392.00, 493.88, 659.25, 392.00, 493.88, 659.25, 880.00,
        293.66, 349.23, 440.00, 587.33, 349.23, 440.00, 523.25, 659.25
      ];
      const pad = [
        174.61, 0, 0, 0, 0, 0, 0, 0,
        196.00, 0, 0, 0, 0, 0, 0, 0,
        164.81, 0, 0, 0, 0, 0, 0, 0,
        146.83, 0, 0, 0, 0, 0, 0, 0
      ];

      const freq = melody[step];
      if (freq > 0) {
        this.synthChime(freq, now, 0.06, 'triangle');
      }
      const padFreq = pad[step];
      if (padFreq > 0) {
        this.synthWarmPad(padFreq, now, 1.8);
      }
    }
    // Stage 3: Ionic Bonding - Upbeat, Crisp Electro-Acoustic Groove
    else if (stage === 3) {
      const melody = [
        523.25, 0, 659.25, 0, 587.33, 523.25, 0, 440.0,
        493.88, 0, 587.33, 0, 523.25, 493.88, 0, 392.0,
        440.00, 0, 523.25, 0, 659.25, 0, 783.99, 0,
        659.25, 587.33, 523.25, 440.0, 493.88, 0, 523.25, 0
      ];
      const bass = [
        130.81, 0, 130.81, 0, 146.83, 0, 146.83, 0,
        164.81, 0, 164.81, 0, 196.00, 0, 196.00, 0,
        110.00, 0, 110.00, 0, 130.81, 0, 130.81, 0,
        146.83, 0, 146.83, 0, 196.00, 0, 196.00, 0
      ];

      const freq = melody[step];
      if (freq > 0) {
        this.synthChime(freq, now, 0.07, 'sine');
      }
      const bassFreq = bass[step];
      if (bassFreq > 0) {
        this.synthBass(bassFreq, now, 0.1);
      }
    }
    // Stage 4: Mastery Challenge - Deep Focus Calming Piano / Bell
    else if (stage === 4) {
      const melody = [
        293.66, 0, 369.99, 0, 440.0, 0, 587.33, 0,
        0, 440.0, 0, 369.99, 0, 293.66, 0, 0,
        246.94, 0, 293.66, 0, 369.99, 0, 493.88, 0,
        0, 369.99, 0, 293.66, 0, 246.94, 0, 0
      ];
      const warmChord = [
        146.83, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        123.47, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
      ];

      const freq = melody[step];
      if (freq > 0) {
        this.synthChime(freq, now, 0.09, 'sine');
      }
      const chordFreq = warmChord[step];
      if (chordFreq > 0) {
        this.synthWarmPad(chordFreq, now, 2.4);
      }
    }
  }

  private synthChime(freq: number, time: number, vol: number, type: OscillatorType) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.36);
  }

  private synthBass(freq: number, time: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.23);
  }

  private synthWarmPad(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.045, time + 0.3);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}

export const audioEngine = new SoundEngine();
