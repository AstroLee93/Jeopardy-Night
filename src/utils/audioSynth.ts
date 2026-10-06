/**
 * Native Web Audio API Sound Synthesizer for Anime Jeopardy
 * Includes authentic Jeopardy Think Music, Daily Double laser fanfare,
 * correct chimes, buzzer lock-in, and Web Speech API clue reader.
 * 100% offline & zero external audio files.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public volume = 0.8; // 0.0 to 1.0
  private thinkMusicInterval: NodeJS.Timeout | null = null;
  private thinkMusicOscillators: OscillatorNode[] = [];
  public isThinkMusicPlaying = false;
  public isSpeaking = false;

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

  // Play a single synthesized tone with master volume scaling
  public playTone(freq: number, duration: number, type: OscillatorType = "sine", gainVal = 0.3) {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const effectiveGain = gainVal * this.volume;
      gain.gain.setValueAtTime(effectiveGain, ctx.currentTime);
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

  // Team Buzzer In Sound (Electric game-show ring/lock-in)
  public playBuzzer() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Dual-tone high impact bell ring
    this.playTone(880, 0.18, "sawtooth", 0.3); // A5
    this.playTone(1760, 0.25, "triangle", 0.4); // A6
    setTimeout(() => {
      this.playTone(1320, 0.3, "sine", 0.35); // E6
    }, 40);
  }

  // Classic Jeopardy Triple Buzz (Time's Up / Wrong Answer)
  public playTripleBuzz() {
    if (!this.enabled) return;
    this.stopThinkMusic();

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

  // ===========================================================================
  // Family Feud Sound Effects (100% Native Web Audio API)
  // ===========================================================================

  // Iconic Family Feud Low Electric Strike Buzz ("EH-ERRNT!")
  public playFeudStrike() {
    if (!this.enabled || this.volume <= 0) return;
    this.stopThinkMusic();
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // Dual detuned low harsh square oscillators
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(138.59, ctx.currentTime); // C#3

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(130.81, ctx.currentTime); // C3 (Dissonant minor 2nd beat)

      const masterVol = 0.5 * this.volume;
      gain.gain.setValueAtTime(masterVol, ctx.currentTime);
      gain.gain.setValueAtTime(masterVol, ctx.currentTime + 0.32);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio fallback
    }
  }

  // Iconic Family Feud Answer Reveal ("CLACK - DING!")
  public playFeudReveal() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // 1. Mechanical slat click
      this.playTone(320, 0.04, 'triangle', 0.25);

      // 2. Bright crystal game-show bell chime ("DING!")
      setTimeout(() => {
        this.playTone(1480, 0.4, 'triangle', 0.45); // F#6
        this.playTone(2217, 0.35, 'sine', 0.35);    // C#7
      }, 35);
    } catch {
      // Audio fallback
    }
  }

  // Fast Money 20s Countdown Clock Tick
  public playFeudTick() {
    if (!this.enabled || this.volume <= 0) return;
    this.playTone(1200, 0.03, 'sine', 0.2);
  }

  // Round Won / Family Feud Win Fanfare
  public playFeudWin() {
    if (!this.enabled || this.volume <= 0) return;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'triangle', 0.35);
      }, idx * 75);
    });
  }

  // Authentic High-Impact Daily Double Laser Fanfare
  // Triggers distinct cinematic arpeggios + punchy TV speaker bass impact
  public playDailyDouble(isTvDisplay = true) {
    if (!this.enabled || this.volume <= 0) return;
    this.stopThinkMusic();
    const ctx = this.initCtx();
    if (!ctx) return;

    // 1. Sub-bass punch (especially satisfying on living room TV / home theater soundbars)
    if (isTvDisplay) {
      try {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(140, ctx.currentTime);
        subOsc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.35);
        subGain.gain.setValueAtTime(0.45 * this.volume, ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start();
        subOsc.stop(ctx.currentTime + 0.35);
      } catch {}
    }

    // 2. Rapid arpeggiated synth laser sequence (Iconic Jeopardy signature)
    const notes = [
      { f: 293.66, d: 0.07 }, // D4
      { f: 369.99, d: 0.07 }, // F#4
      { f: 440.00, d: 0.07 }, // A4
      { f: 587.33, d: 0.12 }, // D5
      { f: 440.00, d: 0.07 }, // A4
      { f: 587.33, d: 0.07 }, // D5
      { f: 739.99, d: 0.08 }, // F#5
      { f: 880.00, d: 0.18 }, // A5
      { f: 1174.66, d: 0.45 } // D6 (Big bright climax)
    ];

    notes.forEach((n, idx) => {
      setTimeout(() => {
        // Dual-tone layered synthesizer (bright square + rich triangle)
        this.playTone(n.f, n.d, "square", isTvDisplay ? 0.35 : 0.25);
        this.playTone(n.f * 1.5, n.d * 0.7, "triangle", isTvDisplay ? 0.2 : 0.12);
      }, idx * 85);
    });

    // 3. Shimmering Golden Chime trail on TV display
    if (isTvDisplay) {
      setTimeout(() => {
        this.playTone(1760, 0.4, "sine", 0.25); // A6
        this.playTone(2349.32, 0.5, "triangle", 0.3); // D7
      }, notes.length * 85 + 20);
    }
  }

  // Victory / Final Podium Fanfare
  public playFanfare() {
    if (!this.enabled) return;
    const fanfareNotes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.45 }, // E5
      { f: 587.33, d: 0.15 }, // D5
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.7 }   // G5
    ];
    let offset = 0;
    fanfareNotes.forEach((n) => {
      setTimeout(() => {
        this.playTone(n.f, n.d, "triangle", 0.4);
      }, offset);
      offset += n.d * 1000 + 40;
    });
  }

  // Authentic Jeopardy "Think Music" (Merv Griffin Theme Song)
  public playThinkMusic() {
    if (!this.enabled) return;
    this.stopThinkMusic();
    const ctx = this.initCtx();
    if (!ctx) return;

    this.isThinkMusicPlaying = true;

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

    const melody: Array<{ f: number; d: number; t: number }> = [
      { f: C4, d: 0.3, t: 0.0 },
      { f: F4, d: 0.3, t: 0.4 },
      { f: C4, d: 0.3, t: 0.8 },
      { f: F3, d: 0.3, t: 1.2 },
      { f: C4, d: 0.3, t: 1.6 },
      { f: F4, d: 0.3, t: 2.0 },
      { f: C4, d: 0.6, t: 2.4 },

      { f: C4, d: 0.3, t: 3.2 },
      { f: F4, d: 0.3, t: 3.6 },
      { f: C4, d: 0.3, t: 4.0 },
      { f: A4, d: 0.3, t: 4.4 },
      { f: G4, d: 0.3, t: 4.8 },
      { f: F4, d: 0.3, t: 5.2 },
      { f: E4, d: 0.3, t: 5.6 },
      { f: D4, d: 0.3, t: 6.0 },
      { f: Db4, d: 0.3, t: 6.4 },

      { f: C4, d: 0.3, t: 6.8 },
      { f: F4, d: 0.3, t: 7.2 },
      { f: C4, d: 0.3, t: 7.6 },
      { f: F3, d: 0.3, t: 8.0 },
      { f: C4, d: 0.3, t: 8.4 },
      { f: F4, d: 0.3, t: 8.8 },
      { f: C4, d: 0.6, t: 9.2 },

      { f: F4, d: 0.4, t: 10.0 },
      { f: D4, d: 0.4, t: 10.5 },
      { f: C4, d: 0.4, t: 11.0 },
      { f: Bb3, d: 0.4, t: 11.5 },
      { f: A3, d: 0.4, t: 12.0 },
      { f: G3, d: 0.4, t: 12.5 },
      { f: F3, d: 0.8, t: 13.0 },

      { f: C5, d: 0.15, t: 14.0 },
      { f: C5, d: 0.15, t: 14.3 },
      { f: C5, d: 0.5,  t: 14.6 }
    ];

    melody.forEach((note) => {
      const timer = setTimeout(() => {
        if (!this.isThinkMusicPlaying) return;
        this.playTone(note.f, note.d, "triangle", 0.28);
        this.playTone(note.f * 2, note.d * 0.7, "sine", 0.12);
      }, note.t * 1000);

      this.thinkMusicOscillators.push(timer as unknown as OscillatorNode);
    });

    this.thinkMusicInterval = setTimeout(() => {
      if (this.isThinkMusicPlaying) {
        this.playThinkMusic();
      }
    }, 15500);
  }

  // Stop think music immediately
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

  // Web Speech API: Host Reads Clue Aloud
  public speak(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    this.stopSpeaking();

    try {
      const cleanText = text.replace(/_/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = this.volume;

      // Try selecting an English voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith("en-") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")));
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };
      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
    }
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
  }
}

export const soundFx = new SoundSynthesizer();
