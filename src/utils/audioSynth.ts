/**
 * Native Web Audio API Sound Synthesizer for Anime Jeopardy
 * Includes authentic Jeopardy Think Music, Daily Double laser fanfare,
 * correct chimes, and iconic triple buzzers. 100% offline & zero external audio files.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled = true;
  private thinkMusicInterval: NodeJS.Timeout | null = null;
  private thinkMusicOscillators: OscillatorNode[] = [];
  public isThinkMusicPlaying = false;

  public initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play a single synthesized tone
  public playTone(freq: number, duration: number, type: OscillatorType = "sine", gainVal = 0.3) {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Classic Jeopardy Board Clue Ping
  public playCluePing() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Resonant bell chime (two frequencies: base and harmonic)
    this.playTone(784, 0.25, "triangle", 0.35); // G5
    setTimeout(() => {
      this.playTone(1568, 0.35, "sine", 0.25); // G6
    }, 60);
  }

  // Celebratory Correct Answer Chime (Ascending C Major chord)
  public playCorrect() {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.35, "triangle", 0.35), idx * 80);
    });
  }

  // Classic Jeopardy Triple Buzz (Time's Up / Wrong Answer)
  public playTripleBuzz() {
    if (!this.enabled) return;
    this.stopThinkMusic();
    const ctx = this.initCtx();
    if (!ctx) return;

    // 3 rapid harsh buzzes (110Hz sawtooth)
    const buzzTimes = [0, 140, 280];
    buzzTimes.forEach((delay, idx) => {
      setTimeout(() => {
        this.playTone(110, idx === 2 ? 0.35 : 0.12, "sawtooth", 0.4);
        this.playTone(116, idx === 2 ? 0.35 : 0.12, "square", 0.2);
      }, delay);
    });
  }

  // Alias for wrong answer
  public playWrong() {
    this.playTripleBuzz();
  }

  // Authentic Daily Double Laser Fanfare
  public playDailyDouble() {
    if (!this.enabled) return;
    this.stopThinkMusic();
    const ctx = this.initCtx();
    if (!ctx) return;

    // Classic arpeggiated synth laser sound
    const notes = [
      { f: 293.66, d: 0.08 }, // D4
      { f: 369.99, d: 0.08 }, // F#4
      { f: 440.00, d: 0.08 }, // A4
      { f: 587.33, d: 0.14 }, // D5
      { f: 440.00, d: 0.08 }, // A4
      { f: 587.33, d: 0.08 }, // D5
      { f: 739.99, d: 0.08 }, // F#5
      { f: 880.00, d: 0.38 }  // A5
    ];

    notes.forEach((n, idx) => {
      setTimeout(() => {
        this.playTone(n.f, n.d, "square", 0.25);
      }, idx * 95);
    });
  }

  // Authentic Jeopardy "Think Music" (Merv Griffin Theme Song)
  // Synthesizes the iconic melody:
  // C4, F4, C4, F3, C4, F4, C4 - C4, F4, C4, A4, G4, F4, E4, D4, C#4
  // C4, F4, C4, F3, C4, F4, C4 - F4, D4, C4, Bb3, A3, G3, F3
  public playThinkMusic() {
    if (!this.enabled) return;
    this.stopThinkMusic();
    const ctx = this.initCtx();
    if (!ctx) return;

    this.isThinkMusicPlaying = true;

    // Note frequencies in Hz
    const F3 = 174.61;
    const G3 = 196.00;
    const A3 = 220.00;
    const Bb3 = 233.08;
    const C4 = 261.63;
    const Db4 = 277.18;
    const D4 = 293.66;
    const E4 = 329.63;
    const F4 = 349.23;
    const G4 = 392.00;
    const A4 = 440.00;
    const C5 = 523.25;

    // Jeopardy theme sequence: [frequency, duration (sec), delay (sec)]
    const melody: Array<{ f: number; d: number; t: number }> = [
      // Measure 1
      { f: C4, d: 0.3, t: 0.0 },
      { f: F4, d: 0.3, t: 0.4 },
      { f: C4, d: 0.3, t: 0.8 },
      { f: F3, d: 0.3, t: 1.2 },
      { f: C4, d: 0.3, t: 1.6 },
      { f: F4, d: 0.3, t: 2.0 },
      { f: C4, d: 0.6, t: 2.4 },

      // Measure 2
      { f: C4, d: 0.3, t: 3.2 },
      { f: F4, d: 0.3, t: 3.6 },
      { f: C4, d: 0.3, t: 4.0 },
      { f: A4, d: 0.3, t: 4.4 },
      { f: G4, d: 0.3, t: 4.8 },
      { f: F4, d: 0.3, t: 5.2 },
      { f: E4, d: 0.3, t: 5.6 },
      { f: D4, d: 0.3, t: 6.0 },
      { f: Db4, d: 0.3, t: 6.4 },

      // Measure 3
      { f: C4, d: 0.3, t: 6.8 },
      { f: F4, d: 0.3, t: 7.2 },
      { f: C4, d: 0.3, t: 7.6 },
      { f: F3, d: 0.3, t: 8.0 },
      { f: C4, d: 0.3, t: 8.4 },
      { f: F4, d: 0.3, t: 8.8 },
      { f: C4, d: 0.6, t: 9.2 },

      // Measure 4
      { f: F4, d: 0.4, t: 10.0 },
      { f: D4, d: 0.4, t: 10.5 },
      { f: C4, d: 0.4, t: 11.0 },
      { f: Bb3, d: 0.4, t: 11.5 },
      { f: A3, d: 0.4, t: 12.0 },
      { f: G3, d: 0.4, t: 12.5 },
      { f: F3, d: 0.8, t: 13.0 },

      // Final Big Hits
      { f: C5, d: 0.15, t: 14.0 },
      { f: C5, d: 0.15, t: 14.3 },
      { f: C5, d: 0.5,  t: 14.6 }
    ];

    melody.forEach((note) => {
      const timer = setTimeout(() => {
        if (!this.isThinkMusicPlaying) return;
        // Warm retro synthesizer sound (triangle + slight sine)
        this.playTone(note.f, note.d, "triangle", 0.28);
        this.playTone(note.f * 2, note.d * 0.7, "sine", 0.12);
      }, note.t * 1000);

      this.thinkMusicOscillators.push(timer as unknown as OscillatorNode);
    });

    // Auto-loop after 15.5 seconds if still running
    this.thinkMusicInterval = setTimeout(() => {
      if (this.isThinkMusicPlaying) {
        this.playThinkMusic();
      }
    }, 15500);
  }

  // Stop the think music immediately
  public stopThinkMusic() {
    this.isThinkMusicPlaying = false;
    if (this.thinkMusicInterval) {
      clearTimeout(this.thinkMusicInterval);
      this.thinkMusicInterval = null;
    }
    this.thinkMusicOscillators.forEach((t) => clearTimeout(t as unknown as number));
    this.thinkMusicOscillators = [];
  }

  // Ticking sound for countdown seconds
  public playTimerTick() {
    if (!this.enabled) return;
    this.playTone(880, 0.04, "square", 0.1);
  }
}

export const soundFx = new SoundSynthesizer();
