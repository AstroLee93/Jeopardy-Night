/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { INITIAL_ANIME_DATA, JeopardyGameData, ClueItem } from './data/animeJeopardyData';
import { JeopardyBoard } from './components/JeopardyBoard';
import { ScoreBoard, Team } from './components/ScoreBoard';
import { ClueModal } from './components/ClueModal';
import { DailyDoubleModal } from './components/DailyDoubleModal';
import { FinalJeopardyModal } from './components/FinalJeopardyModal';
import { PodiumScreen } from './components/PodiumScreen';
import { DeployHubModal } from './components/DeployHubModal';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { AiQuestionGeneratorModal } from './components/AiQuestionGeneratorModal';
import { HostSheetModal } from './components/HostSheetModal';
import { soundFx } from './utils/audioSynth';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  Server, 
  Edit3, 
  HelpCircle,
  Play,
  Trophy,
  Bell,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const DEFAULT_TEAMS_INFO = [
  { name: 'Team Straw Hat', bg: '#dc2626', border: '#f87171' },
  { name: 'Team Z-Fighters', bg: '#ea580c', border: '#fb923c' },
  { name: 'Team Hidden Leaf', bg: '#ca8a04', border: '#facc15' },
  { name: 'Team Demon Slayer', bg: '#16a34a', border: '#4ade80' },
  { name: 'Team Plus Ultra', bg: '#0284c7', border: '#38bdf8' },
  { name: 'Team Ghibli Spirits', bg: '#7c3aed', border: '#c084fc' }
];

type GamePhase = 'SETUP' | 'BOARD' | 'FINAL_JEOPARDY' | 'PODIUM';

export default function App() {
  const [gameData, setGameData] = useState<JeopardyGameData>(INITIAL_ANIME_DATA);
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  
  // Setup configuration
  const [teamCount, setTeamCount] = useState<number>(3);
  const [teamNames, setTeamNames] = useState<string[]>(
    DEFAULT_TEAMS_INFO.map(t => t.name)
  );

  // Active game state
  const [teams, setTeams] = useState<Team[]>([]);
  const [usedClues, setUsedClues] = useState<Set<string>>(new Set());
  const [activeClueData, setActiveClueData] = useState<{
    catIndex: number;
    clueIndex: number;
    clue: ClueItem;
    categoryTitle: string;
  } | null>(null);

  const [isDailyDoubleActive, setIsDailyDoubleActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [audioTestedFeedback, setAudioTestedFeedback] = useState<boolean>(false);

  // Secondary modals
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showAiQuestionModal, setShowAiQuestionModal] = useState<boolean>(false);
  const [showHostSheetModal, setShowHostSheetModal] = useState<boolean>(false);

  // Unlock audio on initial user interaction anywhere on the window
  useEffect(() => {
    const unlockAudio = () => {
      soundFx.initCtx();
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          setShowHostSheetModal(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const toggleSound = () => {
    soundFx.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  // Immediate Audio Test button to verify audio
  const handleTestAudio = () => {
    soundFx.initCtx();
    soundFx.playCluePing();
    setTimeout(() => soundFx.playCorrect(), 200);
    setAudioTestedFeedback(true);
    setTimeout(() => setAudioTestedFeedback(false), 2000);
  };

  // Start new game with configured teams
  const handleStartGame = () => {
    soundFx.initCtx();
    const initializedTeams: Team[] = [];
    for (let i = 0; i < teamCount; i++) {
      const colorDef = DEFAULT_TEAMS_INFO[i % DEFAULT_TEAMS_INFO.length];
      initializedTeams.push({
        id: i,
        name: teamNames[i]?.trim() || `Team ${i + 1}`,
        score: 0,
        color: colorDef
      });
    }
    setTeams(initializedTeams);
    setUsedClues(new Set());
    setActiveClueData(null);
    setPhase('BOARD');
    soundFx.playCluePing();
  };

  // Clue Selection
  const handleSelectClue = (catIndex: number, clueIndex: number) => {
    soundFx.initCtx();
    const category = gameData.categories[catIndex];
    const clue = category.clues[clueIndex];
    if (!clue) return;

    setActiveClueData({
      catIndex,
      clueIndex,
      clue,
      categoryTitle: category.title
    });

    if (clue.isDailyDouble) {
      soundFx.playDailyDouble();
      setIsDailyDoubleActive(true);
    } else {
      soundFx.playCluePing();
      setIsDailyDoubleActive(false);
    }
  };

  // Confirm Daily Double wager
  const handleConfirmDailyDoubleWager = (wagerAmount: number) => {
    if (!activeClueData) return;
    setActiveClueData({
      ...activeClueData,
      clue: {
        ...activeClueData.clue,
        value: wagerAmount
      }
    });
    setIsDailyDoubleActive(false);
    soundFx.playCluePing();
  };

  // Adjust score
  const handleAdjustScore = (teamId: number, delta: number) => {
    setTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, score: t.score + delta } : t))
    );
  };

  // Close clue
  const handleCloseClue = () => {
    soundFx.stopThinkMusic();
    if (activeClueData) {
      const key = `${gameData.categories[activeClueData.catIndex].id}-${activeClueData.clueIndex}`;
      setUsedClues(prev => new Set(prev).add(key));
      setActiveClueData(null);
    }
  };

  // Apply fresh board from AI Question Generator
  const handleApplyAiBoard = (newBoard: JeopardyGameData) => {
    setGameData(newBoard);
    setUsedClues(new Set());
    setActiveClueData(null);
    soundFx.playCorrect();
  };

  // Finish Final Jeopardy
  const handleFinishGame = (finalTeams: Team[]) => {
    soundFx.stopThinkMusic();
    setTeams(finalTeams);
    setPhase('PODIUM');
  };

  return (
    <div className="min-h-screen bg-[#02052c] text-white flex flex-col justify-between selection:bg-[#ffcc00] selection:text-[#030852]">
      {/* =====================================================================
          TOP NAVIGATION BAR (Strict 3-Zone Contract)
          ===================================================================== */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#030852]/90 border-b-2 border-[#ffcc00] shadow-xl z-20">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🎌</span>
          <span className="font-jeopardy-display text-xl sm:text-2xl text-[#ffcc00] uppercase tracking-wider drop-shadow-md">
            Anime Jeopardy
          </span>
        </div>

        {/* Zone 2: Navigation Links / Utility views */}
        <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-semibold text-slate-300">
          <button
            onClick={() => setPhase('BOARD')}
            className={`hover:text-[#ffcc00] transition-colors ${phase === 'BOARD' ? 'text-[#ffcc00]' : ''}`}
          >
            Game Board
          </button>
          
          {/* Host Admin Sheet Button */}
          <button
            onClick={() => setShowHostSheetModal(true)}
            className="hover:text-emerald-300 text-emerald-400 font-bold transition-colors flex items-center gap-1 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-1 rounded-lg"
            title="Open private host answer sheet on phone or host screen (H)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Host Answer Sheet
          </button>

          <button
            onClick={() => setShowAiQuestionModal(true)}
            className="hover:text-[#ffcc00] transition-colors flex items-center gap-1 text-[#ffcc00] font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ffcc00]" /> AI Trivia Generator
          </button>
          <button
            onClick={() => setShowDeployModal(true)}
            className="hover:text-[#ffcc00] transition-colors flex items-center gap-1 text-amber-300"
          >
            <Server className="w-3.5 h-3.5" /> Docker & Portainer
          </button>
          <button
            onClick={() => setShowEditorModal(true)}
            className="hover:text-[#ffcc00] transition-colors flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Clues
          </button>
          <button
            onClick={() => setShowRulesModal(true)}
            className="hover:text-[#ffcc00] transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Rules
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Host Answer Sheet for Mobile / Small Screens */}
          <button
            type="button"
            onClick={() => setShowHostSheetModal(true)}
            title="Open Host Answer Sheet"
            className="md:hidden px-2 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Host
          </button>

          {/* Audio Tester Button */}
          <button
            type="button"
            onClick={handleTestAudio}
            title="Test audio chime & unlock speakers"
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              audioTestedFeedback
                ? 'bg-emerald-600 text-white border-emerald-400 scale-105'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-[#ffcc00] border-[#ffcc00]/40'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{audioTestedFeedback ? 'Audio OK! 🔔' : 'Test Audio'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#ffcc00]" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>

          {/* Fullscreen TV Mode */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen TV Mode (F)"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">TV Mode</span>
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              if (confirm('Start a new game session and reset board?')) {
                soundFx.stopThinkMusic();
                setPhase('SETUP');
                setUsedClues(new Set());
                setActiveClueData(null);
              }
            }}
            title="Reset Game"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN BODY CONTAINER
          ===================================================================== */}
      <main className="flex-1 flex flex-col p-2 sm:p-5 max-w-7xl w-full mx-auto justify-center">
        {/* PHASE 1: SETUP SCREEN */}
        {phase === 'SETUP' && (
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="w-full max-w-2xl bg-gradient-to-b from-[#0b15c9]/30 via-[#04097a]/40 to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-6 sm:p-10 shadow-2xl text-center backdrop-blur-md">
              <span className="text-4xl sm:text-5xl block mb-2">🎌</span>
              <h1 className="font-jeopardy-display text-3xl sm:text-5xl text-[#ffcc00] uppercase tracking-wider mb-2 drop-shadow-md">
                Anime Jeopardy
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mb-6">
                {gameData.title} · {gameData.subtitle}
              </p>

              {/* Number of Teams Selector */}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-[#ffcc00] block mb-3">
                  Select Number of Teams (2 to 6)
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTeamCount(count)}
                      className={`w-12 h-12 rounded-xl font-jeopardy-display text-xl transition-all cursor-pointer ${
                        teamCount === count
                          ? 'bg-[#ffcc00] text-[#030852] font-bold shadow-lg scale-105 border-2 border-white'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Name Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
                {Array.from({ length: teamCount }).map((_, idx) => {
                  const color = DEFAULT_TEAMS_INFO[idx % DEFAULT_TEAMS_INFO.length];
                  return (
                    <div key={idx} className="bg-[#02052c] border border-slate-700 rounded-xl p-3">
                      <label
                        style={{ color: color.border }}
                        className="text-xs font-bold uppercase tracking-wider block mb-1"
                      >
                        Team {idx + 1}
                      </label>
                      <input
                        type="text"
                        value={teamNames[idx]}
                        onChange={(e) => {
                          const updated = [...teamNames];
                          updated[idx] = e.target.value;
                          setTeamNames(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-semibold outline-none focus:border-[#ffcc00]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full sm:w-auto py-3.5 px-8 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" /> Start Game Night
                </button>

                <button
                  type="button"
                  onClick={() => setShowHostSheetModal(true)}
                  className="w-full sm:w-auto py-3.5 px-6 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-semibold text-sm rounded-xl border border-emerald-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Host Answer Sheet
                </button>

                <button
                  type="button"
                  onClick={() => setShowAiQuestionModal(true)}
                  className="w-full sm:w-auto py-3.5 px-6 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg border border-purple-400/40 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" /> AI Trivia Generator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: MAIN JEOPARDY BOARD */}
        {phase === 'BOARD' && (
          <div className="flex-1 flex flex-col justify-between gap-3 sm:gap-4">
            <JeopardyBoard
              categories={gameData.categories}
              usedClues={usedClues}
              onSelectClue={handleSelectClue}
            />

            {/* Scoreboard and Action Bar */}
            <div className="flex flex-col items-center gap-2">
              <ScoreBoard
                teams={teams}
                onAdjustScore={handleAdjustScore}
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowHostSheetModal(true)}
                  className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold text-xs sm:text-sm rounded-lg shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> View Host Answer Sheet
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.stopThinkMusic();
                    setPhase('FINAL_JEOPARDY');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#030852] font-bold text-xs sm:text-sm rounded-lg shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" /> Go to Final Jeopardy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: FINAL JEOPARDY */}
        {phase === 'FINAL_JEOPARDY' && (
          <FinalJeopardyModal
            finalData={gameData.finalJeopardy}
            teams={teams}
            onFinishGame={handleFinishGame}
          />
        )}

        {/* PHASE 4: PODIUM & CHAMPION SCREEN */}
        {phase === 'PODIUM' && (
          <PodiumScreen
            teams={teams}
            onRestart={() => {
              setUsedClues(new Set());
              setActiveClueData(null);
              setPhase('SETUP');
            }}
          />
        )}
      </main>

      {/* =====================================================================
          OVERLAY MODALS
          ===================================================================== */}
      {/* 1. Daily Double Wager Modal */}
      {activeClueData && isDailyDoubleActive && (
        <DailyDoubleModal
          clue={activeClueData.clue}
          categoryTitle={activeClueData.categoryTitle}
          teams={teams}
          onConfirmWager={handleConfirmDailyDoubleWager}
        />
      )}

      {/* 2. Active Clue & Answer Modal (with Visible Countdown Timer & Host Answer Key) */}
      {activeClueData && !isDailyDoubleActive && (
        <ClueModal
          clue={activeClueData.clue}
          categoryTitle={activeClueData.categoryTitle}
          teams={teams}
          onAwardScore={handleAdjustScore}
          onClose={handleCloseClue}
        />
      )}

      {/* 3. Host Admin & Answer Sheet Modal */}
      {showHostSheetModal && (
        <HostSheetModal
          gameData={gameData}
          usedClues={usedClues}
          onClose={() => setShowHostSheetModal(false)}
        />
      )}

      {/* 4. AI Question & Board Generator Modal */}
      {showAiQuestionModal && (
        <AiQuestionGeneratorModal
          onApplyBoard={handleApplyAiBoard}
          onClose={() => setShowAiQuestionModal(false)}
        />
      )}

      {/* 5. Docker / Portainer Deployment Hub */}
      {showDeployModal && (
        <DeployHubModal onClose={() => setShowDeployModal(false)} />
      )}

      {/* 6. Question & Clues Customizer */}
      {showEditorModal && (
        <QuestionEditorModal
          gameData={gameData}
          onSaveData={(updated) => setGameData(updated)}
          onClose={() => setShowEditorModal(false)}
        />
      )}

      {/* 7. Rules & Game Night Guide Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-[#010314]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-6 shadow-2xl text-left">
            <h2 className="font-jeopardy-display text-2xl text-[#ffcc00] uppercase mb-3">
              How to Play Family Anime Jeopardy
            </h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong className="text-white">1. Host Private Answer Key:</strong> When a clue opens, the host can see the private answer inside the Host Controls panel to judge responses without spoiling it on the TV!
              </p>
              <p>
                <strong className="text-white">2. Host Admin Sheet:</strong> Click <span className="text-emerald-400 font-bold">Host Answer Sheet</span> (or press <kbd className="bg-slate-800 px-1 py-0.5 rounded">H</kbd>) on a host laptop, tablet, or phone to view the entire board's answers in one place!
              </p>
              <p>
                <strong className="text-white">3. Clue Timer & Think Music:</strong> Click <span className="text-emerald-400 font-bold">▶</span> to start the 15-second countdown timer. Click <span className="text-purple-400 font-bold">🎵</span> to play the authentic Jeopardy Think Music theme!
              </p>
              <p>
                <strong className="text-white">4. Scoring:</strong> Click <span className="text-emerald-400 font-bold">+ Team</span> for correct answers, or <span className="text-red-400 font-bold">- Team</span> for incorrect answers.
              </p>
              <p>
                <strong className="text-white">5. Daily Double & Final Jeopardy:</strong> Includes custom wagers, 30s Final Jeopardy countdown, and victory podium!
              </p>
            </div>
            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 bg-[#ffcc00] text-[#030852] font-bold text-sm rounded-lg hover:bg-[#ffe066]"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-slate-500 border-t border-slate-900 bg-[#01031b]">
        Anime Jeopardy for Raspberry Pi · Nginx Alpine · Local Network Offline Ready
      </footer>
    </div>
  );
}
