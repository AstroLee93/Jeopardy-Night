/**
 * ANIME JEOPARDY - CORE GAME ENGINE (VANILLA JS)
 * ==============================================================================
 * Self-contained, lightweight game controller with zero external dependencies.
 * Includes authentic Jeopardy Think Music, Daily Double laser, Triple Buzzers,
 * live countdown timers, and full TV touch/hotkey controls.
 * ==============================================================================
 */

(function () {
  "use strict";

  // Synthesized Web Audio Sound Engine
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.thinkMusicInterval = null;
      this.thinkMusicOscillators = [];
      this.isThinkMusicPlaying = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    playTone(freq, duration, type = "sine", gainVal = 0.3) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Fallback
      }
    }

    playCorrect() {
      if (!this.enabled) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 0.35, "triangle", 0.3), idx * 75);
      });
    }

    playTripleBuzz() {
      if (!this.enabled) return;
      this.stopThinkMusic();
      this.init();
      const buzzTimes = [0, 140, 280];
      buzzTimes.forEach((delay, idx) => {
        setTimeout(() => {
          this.playTone(110, idx === 2 ? 0.35 : 0.12, "sawtooth", 0.4);
          this.playTone(116, idx === 2 ? 0.35 : 0.12, "square", 0.2);
        }, delay);
      });
    }

    playWrong() {
      this.playTripleBuzz();
    }

    playDailyDouble(isTv = true) {
      if (!this.enabled) return;
      this.stopThinkMusic();
      this.init();
      if (!this.ctx) return;

      // Sub-bass thump for TV speakers
      if (isTv) {
        try {
          const subOsc = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          subOsc.type = "sine";
          subOsc.frequency.setValueAtTime(140, this.ctx.currentTime);
          subOsc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.35);
          subGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
          subGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
          subOsc.connect(subGain);
          subGain.connect(this.ctx.destination);
          subOsc.start();
          subOsc.stop(this.ctx.currentTime + 0.35);
        } catch {}
      }

      const notes = [
        { f: 293.66, d: 0.07 },
        { f: 369.99, d: 0.07 },
        { f: 440.00, d: 0.07 },
        { f: 587.33, d: 0.12 },
        { f: 440.00, d: 0.07 },
        { f: 587.33, d: 0.07 },
        { f: 739.99, d: 0.08 },
        { f: 880.00, d: 0.18 },
        { f: 1174.66, d: 0.45 }
      ];
      notes.forEach((n, i) => {
        setTimeout(() => {
          this.playTone(n.f, n.d, "square", isTv ? 0.35 : 0.25);
          this.playTone(n.f * 1.5, n.d * 0.7, "triangle", isTv ? 0.2 : 0.12);
        }, i * 85);
      });

      if (isTv) {
        setTimeout(() => {
          this.playTone(1760, 0.4, "sine", 0.25);
          this.playTone(2349.32, 0.5, "triangle", 0.3);
        }, notes.length * 85 + 20);
      }
    }

    playClueReveal() {
      if (!this.enabled) return;
      this.init();
      this.playTone(784, 0.22, "triangle", 0.3);
      setTimeout(() => this.playTone(1568, 0.3, "sine", 0.2), 60);
    }

    playThinkingTimer() {
      if (!this.enabled) return;
      this.playTone(880, 0.04, "square", 0.1);
    }

    // Authentic Jeopardy "Think Music" synthesizer
    playThinkMusic() {
      if (!this.enabled) return;
      this.stopThinkMusic();
      this.init();
      if (!this.ctx) return;

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

      const melody = [
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
          this.playTone(note.f, note.d, "triangle", 0.3);
          this.playTone(note.f * 2, note.d * 0.7, "sine", 0.12);
        }, note.t * 1000);

        this.thinkMusicOscillators.push(timer);
      });

      this.thinkMusicInterval = setTimeout(() => {
        if (this.isThinkMusicPlaying) {
          this.playThinkMusic();
        }
      }, 15500);
    }

    stopThinkMusic() {
      this.isThinkMusicPlaying = false;
      if (this.thinkMusicInterval) {
        clearTimeout(this.thinkMusicInterval);
        this.thinkMusicInterval = null;
      }
      this.thinkMusicOscillators.forEach((t) => clearTimeout(t));
      this.thinkMusicOscillators = [];
    }
  }

  // Team Colors
  const TEAM_COLORS = [
    { name: "Team Luffy", bg: "#dc2626", border: "#f87171" },
    { name: "Team Goku", bg: "#ea580c", border: "#fb923c" },
    { name: "Team Naruto", bg: "#ca8a04", border: "#facc15" },
    { name: "Team Tanjiro", bg: "#16a34a", border: "#4ade80" },
    { name: "Team Deku", bg: "#0284c7", border: "#38bdf8" },
    { name: "Team Ghibli", bg: "#7c3aed", border: "#c084fc" }
  ];

  // Game Engine State
  const Game = {
    data: window.ANIME_JEOPARDY_DATA || {},
    sounds: new SoundEngine(),
    teams: [],
    usedClues: new Set(),
    activeClue: null,
    isAnswerShown: false,
    role: "host",
    channel: null,
    
    // Live Clue Timer
    clueTimeLeft: 15,
    clueTimerRunning: false,
    clueTimerInterval: null,
    thinkMusicActive: false,

    finalWagers: {},
    finalStage: "WAGER",

    init() {
      // Detect role from URL query param (?role=tv or ?role=host)
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get("role");
      if (urlRole === "tv" || urlRole === "host") {
        this.role = urlRole;
      } else {
        this.role = localStorage.getItem("pi_jeopardy_role") || "host";
      }

      // Initialize cross-screen BroadcastChannel
      try {
        if ("BroadcastChannel" in window) {
          this.channel = new BroadcastChannel("anime_jeopardy_pi_sync");
          this.channel.onmessage = (e) => {
            const action = e.data;
            if (!action) return;
            if (action.type === "OPEN_CLUE") {
              this.activeClue = action.clue;
              this.renderClueModal();
            } else if (action.type === "DAILY_DOUBLE_REVEAL") {
              this.activeClue = action.clue;
              this.sounds.playDailyDouble(true);
              this.renderDailyDoubleModal();
            } else if (action.type === "REVEAL_ANSWER") {
              const ansBox = document.getElementById("answer-container");
              if (ansBox) {
                ansBox.style.display = "block";
                this.sounds.playCorrect();
              }
            } else if (action.type === "CLOSE_CLUE") {
              const existing = document.getElementById("clue-modal-root");
              if (existing) existing.remove();
              this.activeClue = null;
            } else if (action.type === "SYNC_TIMER") {
              this.clueTimeLeft = action.timeLeft;
              this.clueTimerRunning = action.isRunning;
              this.clueTimerEndTime = action.endTime;
              if (window.updateStandaloneTimerUI) {
                window.updateStandaloneTimerUI();
              }
            }
          };
        }
      } catch {}

      this.setupEventListeners();
      this.renderSetup();

      // Audio unlock on click
      window.addEventListener("click", () => this.sounds.init(), { once: true });
    },

    setupEventListeners() {
      // Fullscreen button
      const fsBtn = document.getElementById("btn-fullscreen");
      if (fsBtn) {
        fsBtn.addEventListener("click", () => this.toggleFullscreen());
      }

      // Audio toggle button
      const audioBtn = document.getElementById("btn-audio-toggle");
      if (audioBtn) {
        audioBtn.addEventListener("click", () => {
          this.sounds.enabled = !this.sounds.enabled;
          audioBtn.innerHTML = this.sounds.enabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        });
      }

      // Audio test button
      const testAudioBtn = document.getElementById("btn-test-audio");
      if (testAudioBtn) {
        testAudioBtn.addEventListener("click", () => {
          this.sounds.init();
          this.sounds.playClueReveal();
          setTimeout(() => this.sounds.playCorrect(), 200);
        });
      }

      // Host Answer Sheet button
      const hostSheetBtn = document.getElementById("btn-host-sheet");
      if (hostSheetBtn) {
        hostSheetBtn.addEventListener("click", () => this.renderHostSheetModal());
      }

      // Screen Role Toggle button (TV Display vs Host Controller)
      const roleBtn = document.getElementById("btn-screen-role");
      if (roleBtn) {
        const updateRoleBtn = () => {
          roleBtn.textContent = this.role === "tv" ? "📺 TV Mode" : "👑 Host Mode";
          roleBtn.style.background = this.role === "tv" ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 204, 0, 0.2)";
          roleBtn.style.borderColor = this.role === "tv" ? "#38bdf8" : "#ffcc00";
          roleBtn.style.color = this.role === "tv" ? "#38bdf8" : "#ffcc00";
        };
        updateRoleBtn();
        roleBtn.addEventListener("click", () => {
          this.role = this.role === "host" ? "tv" : "host";
          localStorage.setItem("pi_jeopardy_role", this.role);
          updateRoleBtn();
        });
      }

      // Reset game
      const resetBtn = document.getElementById("btn-reset-game");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (confirm("Reset current game and return to team setup?")) {
            this.sounds.stopThinkMusic();
            this.usedClues.clear();
            this.activeClue = null;
            this.renderSetup();
          }
        });
      }

      // Keyboard hotkeys for host
      window.addEventListener("keydown", (e) => {
        if (e.key === "f" || e.key === "F") {
          if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
            this.toggleFullscreen();
          }
        }
        if (e.key === "h" || e.key === "H") {
          if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
            const existingSheet = document.getElementById("host-sheet-modal-root");
            if (existingSheet) existingSheet.remove();
            else this.renderHostSheetModal();
          }
        }
        if (!this.activeClue) return;
        if (e.key === " " && !this.isAnswerShown) {
          e.preventDefault();
          this.revealAnswer();
        } else if (e.key === "Escape") {
          this.closeClue();
        }
      });
    },

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    },

    // -------------------------------------------------------------------------
    // SETUP SCREEN
    // -------------------------------------------------------------------------
    renderSetup() {
      const container = document.getElementById("app-root");
      container.innerHTML = `
        <div class="setup-screen">
          <div class="setup-card">
            <h1>${this.data.title || "ANIME JEOPARDY"}</h1>
            <p class="subtitle">${this.data.subtitle || "Raspberry Pi & Family Game Night Edition"}</p>
            
            <p style="margin-bottom: 8px; font-weight: 700; color: #ffcc00; text-transform: uppercase; font-size: 13px;">Select Number of Teams</p>
            <div class="team-count-selector" id="team-selector">
              ${[2, 3, 4, 5, 6].map(n => `
                <button class="team-count-btn ${n === 3 ? 'active' : ''}" data-count="${n}">${n}</button>
              `).join("")}
            </div>

            <div class="teams-inputs-grid" id="teams-inputs">
              <!-- Rendered dynamically -->
            </div>

            <button class="start-btn" id="start-game-btn">START GAME NIGHT</button>
          </div>
        </div>
      `;

      let selectedCount = 3;
      const renderTeamInputs = (count) => {
        const grid = document.getElementById("teams-inputs");
        grid.innerHTML = "";
        for (let i = 0; i < count; i++) {
          const colorDef = TEAM_COLORS[i % TEAM_COLORS.length];
          const div = document.createElement("div");
          div.className = "team-input-group";
          div.innerHTML = `
            <label style="color: ${colorDef.border}">Team ${i + 1} Name</label>
            <input type="text" id="team-name-${i}" value="${colorDef.name}" />
          `;
          grid.appendChild(div);
        }
      };

      renderTeamInputs(selectedCount);

      // Bind count button clicks
      const btns = container.querySelectorAll(".team-count-btn");
      btns.forEach(b => {
        b.addEventListener("click", () => {
          btns.forEach(x => x.classList.remove("active"));
          b.classList.add("active");
          selectedCount = parseInt(b.dataset.count, 10);
          renderTeamInputs(selectedCount);
        });
      });

      // Start game
      document.getElementById("start-game-btn").addEventListener("click", () => {
        this.sounds.init();
        this.teams = [];
        for (let i = 0; i < selectedCount; i++) {
          const nameInput = document.getElementById(`team-name-${i}`);
          const name = (nameInput && nameInput.value.trim()) || `Team ${i + 1}`;
          this.teams.push({
            id: i,
            name: name,
            score: 0,
            color: TEAM_COLORS[i % TEAM_COLORS.length]
          });
        }
        this.renderBoardScreen();
      });
    },

    // -------------------------------------------------------------------------
    // MAIN BOARD SCREEN
    // -------------------------------------------------------------------------
    renderBoardScreen() {
      const container = document.getElementById("app-root");
      container.innerHTML = `
        <div class="game-screen">
          <div class="jeopardy-board" id="jeopardy-board"></div>
          <div class="scoreboard" id="scoreboard"></div>
          <div style="display: flex; justify-content: center; gap: 12px; margin-top: 6px;">
            <button class="btn-header" id="btn-final-jeopardy">🏆 Jump to Final Jeopardy</button>
          </div>
        </div>
      `;

      this.renderBoardCells();
      this.renderScoreboard();

      document.getElementById("btn-final-jeopardy").addEventListener("click", () => {
        this.sounds.stopThinkMusic();
        this.startFinalJeopardy();
      });

      this.checkAllCluesCompleted();
    },

    renderBoardCells() {
      const board = document.getElementById("jeopardy-board");
      board.innerHTML = "";

      const categories = this.data.categories || [];

      // 1. Header row
      categories.forEach(cat => {
        const header = document.createElement("div");
        header.className = "category-header-cell";
        header.textContent = cat.title;
        board.appendChild(header);
      });

      // 2. Clue rows ($200 to $1000)
      for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
        categories.forEach((cat, colIdx) => {
          const clue = cat.clues[rowIdx];
          const clueKey = `${colIdx}-${rowIdx}`;
          const isUsed = this.usedClues.has(clueKey);

          const cell = document.createElement("div");
          cell.className = `clue-cell ${isUsed ? "used" : ""}`;
          
          if (!isUsed && clue) {
            cell.innerHTML = `
              <span class="clue-value">$${clue.value}</span>
              ${clue.image ? '<span class="clue-has-image">🖼️</span>' : ''}
            `;
            cell.addEventListener("click", () => {
              this.openClue(colIdx, rowIdx);
            });
          }
          board.appendChild(cell);
        });
      }
    },

    renderScoreboard() {
      const board = document.getElementById("scoreboard");
      if (!board) return;
      board.innerHTML = "";

      this.teams.forEach(team => {
        const card = document.createElement("div");
        card.className = "team-card";
        card.style.borderTopColor = team.color.border;
        card.innerHTML = `
          <div class="team-name" title="${team.name}">${team.name}</div>
          <div class="team-score ${team.score < 0 ? 'negative' : ''}">
            $${team.score.toLocaleString()}
          </div>
          <div class="team-score-controls">
            <button class="score-adj-btn" title="Add $200" data-team="${team.id}" data-val="200">+$</button>
            <button class="score-adj-btn" title="Deduct $200" data-team="${team.id}" data-val="-200">-$</button>
          </div>
        `;

        card.querySelectorAll(".score-adj-btn").forEach(b => {
          b.addEventListener("click", (e) => {
            e.stopPropagation();
            const val = parseInt(b.dataset.val, 10);
            team.score += val;
            this.renderScoreboard();
          });
        });

        board.appendChild(card);
      });
    },

    // -------------------------------------------------------------------------
    // CLUE MODAL WITH LIVE COUNTDOWN TIMER & THINK MUSIC
    // -------------------------------------------------------------------------
    openClue(colIdx, rowIdx) {
      const cat = this.data.categories[colIdx];
      const clue = cat.clues[rowIdx];
      const clueKey = `${colIdx}-${rowIdx}`;

      this.activeClue = {
        colIdx,
        rowIdx,
        key: clueKey,
        category: cat.title,
        ...clue
      };
      this.isAnswerShown = false;

      if (clue.isDailyDouble) {
        this.sounds.playDailyDouble(this.role === "tv");
        this.renderDailyDoubleModal();
        if (this.channel) {
          this.channel.postMessage({ type: "DAILY_DOUBLE_REVEAL", clue: this.activeClue });
        }
      } else {
        this.sounds.playClueReveal();
        this.renderClueModal();
        if (this.channel) {
          this.channel.postMessage({ type: "OPEN_CLUE", clue: this.activeClue });
        }
      }
    },

    renderDailyDoubleModal() {
      const modal = document.createElement("div");
      modal.className = "modal-backdrop";
      modal.id = "clue-modal-root";

      const maxScore = Math.max(1000, ...this.teams.map(t => t.score));

      modal.innerHTML = `
        <div class="clue-modal daily-double-card">
          <div class="daily-double-title">⚡ DAILY DOUBLE! ⚡</div>
          <p style="font-size: 18px; color: #c7d2fe; margin-bottom: 14px;">
            Category: <strong>${this.activeClue.category}</strong>
          </p>

          <p style="font-size: 14px; color: #ffcc00; font-weight: 700;">WAGER AMOUNT (Max $${maxScore}):</p>
          <div class="wager-input-wrapper">
            <span style="font-size: 28px; color: #ffcc00;">$</span>
            <input type="number" id="dd-wager" value="${Math.min(1000, maxScore)}" min="5" max="${maxScore}" />
          </div>

          <div style="margin-top: 16px;">
            <button class="start-btn" id="btn-dd-confirm">REVEAL CLUE</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById("btn-dd-confirm").addEventListener("click", () => {
        const wagerInput = document.getElementById("dd-wager");
        let wager = parseInt(wagerInput.value, 10) || 500;
        if (wager < 5) wager = 5;
        if (wager > maxScore) wager = maxScore;
        this.activeClue.value = wager;

        modal.remove();
        this.sounds.playClueReveal();
        this.renderClueModal();
      });
    },

    renderClueModal() {
      const existing = document.getElementById("clue-modal-root");
      if (existing) existing.remove();

      // Reset timer for new clue
      this.clueTimeLeft = 15;
      this.clueTimerRunning = false;
      this.thinkMusicActive = false;
      if (this.clueTimerInterval) {
        clearInterval(this.clueTimerInterval);
        this.clueTimerInterval = null;
      }

      const modal = document.createElement("div");
      modal.className = "modal-backdrop";
      modal.id = "clue-modal-root";

      const clue = this.activeClue;

      modal.innerHTML = `
        <div class="clue-modal">
          <!-- Top bar with Category, Interactive Countdown Timer, Value -->
          <div class="modal-top-bar" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div class="modal-category-title">${clue.category}</div>

            <!-- Jeopardy Timer Widget -->
            <div class="timer-widget" style="display: flex; align-items: center; gap: 8px; background: #02052c; border: 1px solid rgba(255,204,0,0.5); border-radius: 8px; padding: 4px 12px;">
              <span id="clue-timer-text" style="font-family: var(--font-display); font-size: 22px; color: #ffcc00; min-width: 60px; text-align: center;">
                15s
              </span>
              <button id="btn-timer-toggle" class="btn-header primary" style="padding: 4px 8px; font-size: 11px;">▶ Start</button>
              <button id="btn-think-music" class="btn-header" style="padding: 4px 8px; font-size: 11px;" title="Play Jeopardy Theme">🎵 Theme</button>
              <button id="btn-read-aloud" class="btn-header" style="padding: 4px 8px; font-size: 11px;" title="Read Clue Aloud">🗣️ Read</button>
              <button id="btn-timer-add5" class="btn-header" style="padding: 4px 6px; font-size: 11px;">+5s</button>
              <button id="btn-timer-reset" class="btn-header" style="padding: 4px 6px; font-size: 11px;">🔄</button>
            </div>

            <div class="modal-value-pill">$${clue.value}</div>
          </div>

          <!-- Progress bar -->
          <div style="width: 100%; height: 6px; background: #02052c; border-radius: 3px; overflow: hidden; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1);">
            <div id="clue-timer-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 1s linear;"></div>
          </div>

          <!-- Buzzer Lockout Prompt & Buttons -->
          <div id="buzzer-container" style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
            <span style="font-size: 11px; font-weight: 700; color: #ffcc00; text-transform: uppercase;">⚡ Buzzers Active:</span>
            ${this.teams.map((t, idx) => `
              <button class="btn-team-buzz" data-team="${t.id}" style="padding: 3px 10px; border-radius: 12px; background: rgba(255,204,0,0.1); border: 1px solid rgba(255,204,0,0.4); color: #ffcc00; font-size: 11px; font-weight: 700; cursor: pointer;">
                ${t.name} [${idx + 1}]
              </button>
            `).join("")}
          </div>

          <div id="buzzer-lockout-banner" style="display: none; background: linear-gradient(90deg, #dc2626, #f59e0b, #dc2626); color: #000; font-family: var(--font-display); font-size: 18px; font-weight: 900; padding: 8px 16px; border-radius: 8px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
            🚨 <span id="buzzer-team-name"></span> BUZZED IN!
          </div>

          <div class="modal-content-area">
            ${clue.image ? `
              <div class="clue-image-container">
                <img src="${clue.image}" 
                     alt="${clue.imageAlt || 'Anime Clue Image'}"
                     onerror="this.onerror=null; ${clue.fallbackImage ? `this.src='${clue.fallbackImage}';` : "this.parentElement.innerHTML='<div class=\\'clue-image-fallback\\'><span>🎌</span><strong>Image: ${clue.image}</strong><span>(Drop file into ./images folder)</span></div>';"}" />
              </div>
            ` : ''}

            <div class="clue-text">${clue.clue}</div>

            <div id="answer-container" style="display: none; width: 100%;">
              <div class="answer-box">
                <div class="answer-label">Correct Response</div>
                <div class="answer-text">${clue.answer}</div>
              </div>
            </div>
          </div>

          ${this.role === "host" ? `
          <div class="host-controls-panel">
            <div class="host-section-title">Host Controls (Host Eyes Only)</div>

            <!-- Host Private Answer Key -->
            <div style="background: #01041f; border: 1px solid rgba(255,204,0,0.5); border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; text-align: left;">
              <div>
                <span style="font-size: 11px; font-weight: 700; color: #ffcc00; text-transform: uppercase;">
                  🔒 Host Private Answer (For Judging):
                </span>
                <div id="host-private-answer" style="font-family: var(--font-serif); font-size: 17px; font-weight: 700; color: #4ade80;">
                  ${clue.answer}
                </div>
              </div>
              <button id="btn-toggle-private-ans" class="btn-header" style="font-size: 11px; padding: 4px 8px; cursor: pointer;">Hide</button>
            </div>

            <div class="host-actions-row">
              <button class="btn-host-action btn-show-answer" id="btn-show-answer">Reveal Answer to Players (TV)</button>
              <button class="btn-close-clue" id="btn-pass-clue">Skip / No Score</button>
            </div>

            <div class="team-scoring-buttons">
              ${this.teams.map(team => `
                <div class="team-score-award-group">
                  <button class="btn-award-correct" data-team="${team.id}" data-val="${clue.value}">
                    + ${team.name}
                  </button>
                  <button class="btn-award-wrong" data-team="${team.id}" data-val="${-clue.value}">
                    -
                  </button>
                </div>
              `).join("")}
            </div>
          </div>
          ` : `
          <!-- TV Display Screen Footer (Answers strictly hidden) -->
          <div style="background: rgba(3, 8, 82, 0.8); border: 1px solid rgba(56, 189, 248, 0.5); border-radius: 8px; padding: 10px; text-align: center; color: #38bdf8; font-size: 13px; font-weight: 700; margin-top: 10px;">
            📺 TV Screen Display · Answers are strictly hidden until Host reveals them
          </div>
          `}
        </div>
      `;

      document.body.appendChild(modal);

      // Timer Controls Binding
      const timerText = document.getElementById("clue-timer-text");
      const timerBar = document.getElementById("clue-timer-bar");
      const timerToggle = document.getElementById("btn-timer-toggle");
      const thinkMusicBtn = document.getElementById("btn-think-music");
      const add5Btn = document.getElementById("btn-timer-add5");
      const resetBtn = document.getElementById("btn-timer-reset");

      const updateTimerUI = () => {
        if (timerText) {
          timerText.textContent = this.clueTimeLeft === 0 ? "TIME'S UP!" : `${this.clueTimeLeft}s`;
          timerText.style.color = this.clueTimeLeft === 0 ? "#ef4444" : (this.clueTimeLeft <= 5 ? "#f59e0b" : "#ffcc00");
        }
        if (timerBar) {
          const percent = Math.max(0, Math.min(100, (this.clueTimeLeft / 15) * 100));
          timerBar.style.width = `${percent}%`;
          timerBar.style.background = this.clueTimeLeft <= 3 ? "#ef4444" : (this.clueTimeLeft <= 6 ? "#f59e0b" : "#22c55e");
        }
        if (timerToggle) {
          timerToggle.textContent = this.clueTimerRunning ? "⏸ Pause" : "▶ Start";
        }
      };
      window.updateStandaloneTimerUI = updateTimerUI;

      const broadcastTimer = (isRunning, end) => {
        if (this.channel) {
          this.channel.postMessage({
            type: "SYNC_TIMER",
            isRunning,
            timeLeft: this.clueTimeLeft,
            endTime: end
          });
        }
      };

      const startTimer = () => {
        this.clueTimerRunning = true;
        const end = Date.now() + this.clueTimeLeft * 1000;
        this.clueTimerEndTime = end;
        updateTimerUI();
        broadcastTimer(true, end);

        if (this.thinkMusicActive) {
          this.sounds.playThinkMusic();
        }
        if (this.clueTimerInterval) clearInterval(this.clueTimerInterval);

        this.clueTimerInterval = setInterval(() => {
          const now = Date.now();
          if (this.clueTimerEndTime) {
            const diff = this.clueTimerEndTime - now;
            const remaining = Math.max(0, Math.ceil(diff / 1000));
            this.clueTimeLeft = remaining;

            if (remaining <= 5 && remaining > 0) {
              this.sounds.playThinkingTimer();
            }
            updateTimerUI();

            if (diff <= 0) {
              clearInterval(this.clueTimerInterval);
              this.clueTimerInterval = null;
              this.clueTimerRunning = false;
              this.clueTimeLeft = 0;
              this.sounds.stopThinkMusic();
              this.sounds.playTripleBuzz();
              updateTimerUI();
              broadcastTimer(false, null);
            }
          }
        }, 100);
      };

      const pauseTimer = () => {
        this.clueTimerRunning = false;
        if (this.clueTimerInterval) {
          clearInterval(this.clueTimerInterval);
          this.clueTimerInterval = null;
        }
        this.clueTimerEndTime = null;
        this.sounds.stopThinkMusic();
        updateTimerUI();
        broadcastTimer(false, null);
      };

      timerToggle.addEventListener("click", () => {
        if (!this.clueTimerRunning) {
          if (this.clueTimeLeft === 0) this.clueTimeLeft = 15;
          startTimer();
        } else {
          pauseTimer();
        }
      });

      thinkMusicBtn.addEventListener("click", () => {
        if (this.thinkMusicActive) {
          this.thinkMusicActive = false;
          this.sounds.stopThinkMusic();
          thinkMusicBtn.style.background = "";
        } else {
          this.thinkMusicActive = true;
          thinkMusicBtn.style.background = "#7c3aed";
          if (!this.clueTimerRunning) {
            startTimer();
          } else {
            this.sounds.playThinkMusic();
          }
        }
      });

      add5Btn.addEventListener("click", () => {
        this.clueTimeLeft += 5;
        if (this.clueTimerRunning) {
          this.clueTimerEndTime = Date.now() + this.clueTimeLeft * 1000;
        }
        updateTimerUI();
        broadcastTimer(this.clueTimerRunning, this.clueTimerEndTime);
      });

      resetBtn.addEventListener("click", () => {
        pauseTimer();
        this.clueTimeLeft = 15;
        this.clueTimerEndTime = null;
        updateTimerUI();
        broadcastTimer(false, null);
      });

      // Read Aloud Speech Synthesis
      const readBtn = document.getElementById("btn-read-aloud");
      if (readBtn) {
        let isSpeaking = false;
        readBtn.addEventListener("click", () => {
          if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
            readBtn.style.background = "";
          } else if (window.speechSynthesis) {
            isSpeaking = true;
            readBtn.style.background = "#0284c7";
            const u = new SpeechSynthesisUtterance(clue.clue);
            u.onend = () => {
              isSpeaking = false;
              readBtn.style.background = "";
            };
            window.speechSynthesis.speak(u);
          }
        });
      }

      // Buzzer Lockout
      const banner = document.getElementById("buzzer-lockout-banner");
      const buzzedName = document.getElementById("buzzer-team-name");
      let activeBuzzerTeam = null;

      const triggerBuzz = (teamId) => {
        if (activeBuzzerTeam !== null) return;
        activeBuzzerTeam = teamId;
        pauseTimer();
        this.sounds.init();
        this.sounds.playClueReveal(); // sharp ring
        const t = this.teams.find(x => x.id === teamId);
        if (banner && buzzedName && t) {
          buzzedName.textContent = t.name;
          banner.style.display = "block";
        }
      };

      modal.querySelectorAll(".btn-team-buzz").forEach(btn => {
        btn.addEventListener("click", () => {
          const tid = parseInt(btn.dataset.team, 10);
          triggerBuzz(tid);
        });
      });

      // Number key buzzer listener
      const keyBuzzerHandler = (e) => {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= this.teams.length) {
          triggerBuzz(this.teams[num - 1].id);
        }
      };
      window.addEventListener("keydown", keyBuzzerHandler);

      // Toggle Private Host Answer Key
      const togglePrivBtn = document.getElementById("btn-toggle-private-ans");
      const privAnsDiv = document.getElementById("host-private-answer");
      if (togglePrivBtn && privAnsDiv) {
        let isShown = true;
        togglePrivBtn.addEventListener("click", () => {
          isShown = !isShown;
          privAnsDiv.style.display = isShown ? "block" : "none";
          togglePrivBtn.textContent = isShown ? "Hide" : "👁️ Peek";
        });
      }

      // Show answer button
      const showAnsBtn = document.getElementById("btn-show-answer");
      if (showAnsBtn) {
        showAnsBtn.addEventListener("click", () => {
          pauseTimer();
          this.revealAnswer();
          if (this.channel) this.channel.postMessage({ type: "REVEAL_ANSWER" });
        });
      }

      // Pass/Skip button
      const passBtn = document.getElementById("btn-pass-clue");
      if (passBtn) {
        passBtn.addEventListener("click", () => {
          pauseTimer();
          this.closeClue();
          if (this.channel) this.channel.postMessage({ type: "CLOSE_CLUE" });
        });
      }

      // Score buttons
      modal.querySelectorAll(".btn-award-correct").forEach(btn => {
        btn.addEventListener("click", () => {
          pauseTimer();
          const teamId = parseInt(btn.dataset.team, 10);
          const val = parseInt(btn.dataset.val, 10);
          this.awardScore(teamId, val);
          this.sounds.playCorrect();
          this.revealAnswer();
          setTimeout(() => this.closeClue(), 900);
        });
      });

      modal.querySelectorAll(".btn-award-wrong").forEach(btn => {
        btn.addEventListener("click", () => {
          const teamId = parseInt(btn.dataset.team, 10);
          const val = parseInt(btn.dataset.val, 10);
          this.awardScore(teamId, val);
          this.sounds.playWrong();
          this.renderScoreboard();
        });
      });
    },

    revealAnswer() {
      this.sounds.stopThinkMusic();
      if (this.clueTimerInterval) {
        clearInterval(this.clueTimerInterval);
        this.clueTimerInterval = null;
      }
      this.isAnswerShown = true;
      const ansBox = document.getElementById("answer-container");
      if (ansBox) ansBox.style.display = "block";
      const btn = document.getElementById("btn-show-answer");
      if (btn) {
        btn.textContent = "Close Clue (Esc)";
        btn.onclick = () => this.closeClue();
      }
    },

    awardScore(teamId, delta) {
      const team = this.teams.find(t => t.id === teamId);
      if (team) {
        team.score += delta;
        this.renderScoreboard();
      }
    },

    closeClue() {
      this.sounds.stopThinkMusic();
      if (this.clueTimerInterval) {
        clearInterval(this.clueTimerInterval);
        this.clueTimerInterval = null;
      }
      if (this.activeClue) {
        this.usedClues.add(this.activeClue.key);
        this.activeClue = null;
      }
      const modal = document.getElementById("clue-modal-root");
      if (modal) modal.remove();
      this.renderBoardCells();
      this.renderScoreboard();
      this.checkAllCluesCompleted();
    },

    checkAllCluesCompleted() {
      const totalClues = (this.data.categories || []).length * 5;
      if (this.usedClues.size >= totalClues) {
        setTimeout(() => {
          alert("All regular clues completed! Proceeding to Final Jeopardy!");
          this.startFinalJeopardy();
        }, 600);
      }
    },

    // -------------------------------------------------------------------------
    // FINAL JEOPARDY
    // -------------------------------------------------------------------------
    startFinalJeopardy() {
      this.sounds.stopThinkMusic();
      const finalData = this.data.finalJeopardy;
      if (!finalData) return;

      const container = document.getElementById("app-root");
      container.innerHTML = `
        <div class="setup-screen">
          <div class="setup-card" style="max-width: 840px;">
            <h1>FINAL JEOPARDY</h1>
            <p class="subtitle" style="font-size: 20px; color: #ffcc00; font-weight: 700;">
              CATEGORY: ${finalData.category}
            </p>

            <div id="final-step-container">
              <p style="margin-bottom: 12px; color: #c7d2fe;">
                Each team must submit their secret wager based on the category!
              </p>
              
              <div class="teams-inputs-grid" id="final-wager-grid">
                ${this.teams.map(t => `
                  <div class="team-input-group">
                    <label style="color: ${t.color.border}">${t.name} (Score: $${t.score})</label>
                    <input type="number" id="final-wager-${t.id}" min="0" max="${Math.max(0, t.score)}" value="${Math.max(0, Math.floor(t.score / 2))}" />
                  </div>
                `).join("")}
              </div>

              <button class="start-btn" id="btn-reveal-final-clue">LOCK WAGERS & REVEAL CLUE</button>
            </div>
          </div>
        </div>
      `;

      document.getElementById("btn-reveal-final-clue").addEventListener("click", () => {
        this.finalWagers = {};
        this.teams.forEach(t => {
          const input = document.getElementById(`final-wager-${t.id}`);
          const wager = parseInt(input.value, 10) || 0;
          this.finalWagers[t.id] = Math.max(0, Math.min(wager, Math.max(0, t.score)));
        });

        this.renderFinalClueScreen();
      });
    },

    renderFinalClueScreen() {
      const finalData = this.data.finalJeopardy;
      const stepContainer = document.getElementById("final-step-container");
      this.sounds.playClueReveal();

      let timeLeft = 30;
      stepContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
          ${finalData.image ? `
            <div class="clue-image-container" style="margin: 0 auto 16px auto;">
              <img src="${finalData.image}" 
                   alt="Final Clue" 
                   onerror="this.onerror=null; ${finalData.fallbackImage ? `this.src='${finalData.fallbackImage}';` : "this.style.display='none';"}" />
            </div>
          ` : ''}
          <div class="clue-text" style="margin: 0 auto; text-align: center;">
            ${finalData.clue}
          </div>
        </div>

        <div style="font-family: var(--font-display); font-size: 38px; color: #ffcc00; margin: 12px 0;" id="final-countdown">
          ⏳ ${timeLeft}s
        </div>

        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 12px;">
          <button class="btn-header primary" id="btn-final-theme">🎵 Play Jeopardy Theme</button>
        </div>

        <button class="start-btn" id="btn-final-show-answer">SHOW ANSWER & SCORE TEAMS</button>
      `;

      const themeBtn = document.getElementById("btn-final-theme");
      themeBtn.addEventListener("click", () => {
        this.sounds.playThinkMusic();
      });

      const timerId = setInterval(() => {
        timeLeft--;
        const el = document.getElementById("final-countdown");
        if (el) el.textContent = `⏳ ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(timerId);
          this.sounds.stopThinkMusic();
          this.sounds.playTripleBuzz();
          if (el) el.textContent = "⏰ TIME'S UP!";
        } else if (timeLeft <= 5) {
          this.sounds.playThinkingTimer();
        }
      }, 1000);

      document.getElementById("btn-final-show-answer").addEventListener("click", () => {
        clearInterval(timerId);
        this.sounds.stopThinkMusic();
        this.renderFinalScoringScreen();
      });
    },

    renderFinalScoringScreen() {
      const finalData = this.data.finalJeopardy;
      const stepContainer = document.getElementById("final-step-container");

      stepContainer.innerHTML = `
        <div class="answer-box" style="margin-bottom: 24px;">
          <div class="answer-label">Correct Response</div>
          <div class="answer-text">${finalData.answer}</div>
        </div>

        <p style="font-weight: 700; color: #ffcc00; text-transform: uppercase; margin-bottom: 12px;">
          Host: Grade Each Team's Written Answer
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
          ${this.teams.map(t => `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(3, 8, 82, 0.7); border: 1px solid var(--jeopardy-gold); border-radius: 8px; padding: 10px 16px;">
              <div>
                <strong style="color: ${t.color.border}; font-size: 16px;">${t.name}</strong>
                <span style="margin-left: 8px; color: #c7d2fe; font-size: 13px;">Wager: $${(this.finalWagers[t.id] || 0).toLocaleString()}</span>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn-award-correct" id="final-correct-${t.id}">✔ Correct (+$${this.finalWagers[t.id] || 0})</button>
                <button class="btn-award-wrong" id="final-wrong-${t.id}">✖ Wrong (-$${this.finalWagers[t.id] || 0})</button>
              </div>
            </div>
          `).join("")}
        </div>

        <button class="start-btn" id="btn-conclude-game">DECLARE WINNER 👑</button>
      `;

      this.teams.forEach(t => {
        const correctBtn = document.getElementById(`final-correct-${t.id}`);
        const wrongBtn = document.getElementById(`final-wrong-${t.id}`);
        const wager = this.finalWagers[t.id] || 0;

        correctBtn.addEventListener("click", () => {
          t.score += wager;
          correctBtn.style.outline = "3px solid #4ade80";
          wrongBtn.style.opacity = "0.4";
          this.sounds.playCorrect();
        });

        wrongBtn.addEventListener("click", () => {
          t.score -= wager;
          wrongBtn.style.outline = "3px solid #f87171";
          correctBtn.style.opacity = "0.4";
          this.sounds.playWrong();
        });
      });

      document.getElementById("btn-conclude-game").addEventListener("click", () => {
        this.renderPodium();
      });
    },

    renderPodium() {
      const sorted = [...this.teams].sort((a, b) => b.score - a.score);
      const winner = sorted[0];

      const container = document.getElementById("app-root");
      container.innerHTML = `
        <div class="setup-screen">
          <div class="setup-card" style="max-width: 800px;">
            <div style="font-size: 64px;">🏆</div>
            <h1>CHAMPION: ${winner.name}!</h1>
            <p class="subtitle" style="font-size: 22px; color: #ffcc00; font-weight: 700;">
              Final Score: $${winner.score.toLocaleString()}
            </p>

            <div class="podium-container">
              ${sorted[1] ? `
                <div class="podium-pillar rank-2">
                  <div style="font-size: 24px;">🥈 2nd</div>
                  <div style="font-weight: 700; margin-top: 6px;">${sorted[1].name}</div>
                  <div style="color: #ffcc00; font-family: var(--font-display); font-size: 20px;">$${sorted[1].score.toLocaleString()}</div>
                </div>
              ` : ''}

              <div class="podium-pillar rank-1">
                <div style="font-size: 32px;">👑 1st</div>
                <div style="font-weight: 700; margin-top: 6px;">${winner.name}</div>
                <div style="color: #ffcc00; font-family: var(--font-display); font-size: 24px;">$${winner.score.toLocaleString()}</div>
              </div>

              ${sorted[2] ? `
                <div class="podium-pillar rank-3">
                  <div style="font-size: 20px;">🥉 3rd</div>
                  <div style="font-weight: 700; margin-top: 6px;">${sorted[2].name}</div>
                  <div style="color: #ffcc00; font-family: var(--font-display); font-size: 18px;">$${sorted[2].score.toLocaleString()}</div>
                </div>
              ` : ''}
            </div>

            <div style="display: flex; justify-content: center; gap: 12px;">
              <button class="start-btn" id="btn-play-again">PLAY AGAIN</button>
            </div>
          </div>
        </div>
      `;

      this.sounds.playCorrect();

      document.getElementById("btn-play-again").addEventListener("click", () => {
        this.usedClues.clear();
        this.activeClue = null;
        this.renderSetup();
      });
    },

    // -------------------------------------------------------------------------
    // HOST ADMIN ANSWER SHEET MODAL
    // -------------------------------------------------------------------------
    renderHostSheetModal() {
      const existing = document.getElementById("host-sheet-modal-root");
      if (existing) {
        existing.remove();
        return;
      }

      const modal = document.createElement("div");
      modal.className = "modal-backdrop";
      modal.id = "host-sheet-modal-root";

      const categories = this.data.categories || [];
      const finalData = this.data.finalJeopardy || {};

      modal.innerHTML = `
        <div class="clue-modal" style="max-width: 1100px; max-height: 94vh; padding: 24px; text-align: left;">
          <div class="modal-top-bar" style="margin-bottom: 14px;">
            <div>
              <div style="font-family: var(--font-display); font-size: 24px; color: #ffcc00; text-transform: uppercase;">
                👑 Host Admin Answer Sheet
              </div>
              <span style="font-size: 12px; color: #c7d2fe;">
                Keep this open on your host device to verify team answers without showing the board
              </span>
            </div>
            <button class="btn-header" id="btn-close-host-sheet" style="font-size: 14px;">✕ Close</button>
          </div>

          <div style="margin-bottom: 14px;">
            <input type="text" id="host-sheet-filter" placeholder="Filter clues or answers..." 
                   style="width: 100%; padding: 8px 12px; background: #02052c; border: 1px solid #ffcc00; border-radius: 6px; color: #fff; font-size: 14px;" />
          </div>

          <div id="host-sheet-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; max-height: 60vh; overflow-y: auto; padding-right: 4px;">
            ${categories.map((cat, cIdx) => `
              <div class="host-cat-card" style="background: #02052c; border: 1px solid rgba(255,204,0,0.4); border-radius: 8px; padding: 12px;">
                <div style="font-family: var(--font-display); font-size: 15px; color: #ffcc00; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 8px; text-transform: uppercase;">
                  ${cat.title}
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${cat.clues.map((clue, rIdx) => `
                    <div style="background: rgba(3, 8, 82, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; font-size: 12px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: #ffcc00;">$${clue.value}</span>
                        ${clue.isDailyDouble ? '<span style="color: #ffcc00; font-weight: 700; font-size: 10px;">⚡ DAILY DOUBLE</span>' : ''}
                      </div>
                      <div style="color: #e2e8f0; margin-bottom: 6px;">${clue.clue}</div>
                      <div style="background: rgba(22, 101, 52, 0.7); border: 1px solid #16a34a; border-radius: 4px; padding: 4px 8px; color: #fff; font-weight: 700;">
                        Ans: ${clue.answer}
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>

          <!-- Final Jeopardy -->
          <div style="margin-top: 14px; background: rgba(3, 8, 82, 0.9); border: 2px solid #ffcc00; border-radius: 8px; padding: 12px;">
            <div style="font-family: var(--font-display); font-size: 16px; color: #ffcc00; text-transform: uppercase; margin-bottom: 4px;">
              🏆 Final Jeopardy: ${finalData.category || ''}
            </div>
            <div style="color: #fff; font-size: 13px; margin-bottom: 6px;">${finalData.clue || ''}</div>
            <div style="background: rgba(22, 101, 52, 0.9); border: 1px solid #22c55e; border-radius: 6px; padding: 6px 12px; color: #fff; font-weight: 700; display: inline-block;">
              Correct Response: ${finalData.answer || ''}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById("btn-close-host-sheet").addEventListener("click", () => {
        modal.remove();
      });

      // Filter functionality
      const filterInput = document.getElementById("host-sheet-filter");
      filterInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const cards = modal.querySelectorAll(".host-cat-card");
        cards.forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(query) ? "block" : "none";
        });
      });
    }
  };

  // Launch on DOM ready
  window.addEventListener("DOMContentLoaded", () => {
    Game.init();
  });
})();
