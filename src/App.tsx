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
import { ScoreEditorModal } from './components/ScoreEditorModal';
import { GameSettingsModal } from './components/GameSettingsModal';
import { RoleDesignationModal } from './components/RoleDesignationModal';
import { soundFx } from './utils/audioSynth';
import { gameSync, ScreenRole } from './utils/gameSync';
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
  ShieldCheck,
  Settings,
  Edit2,
  Tv,
  Crown,
  Monitor
} from 'lucide-react';

const DEFAULT_TEAMS_INFO = [
  { name: 'Team Straw Hat', bg: '#dc2626', border: '#f87171', avatar: '🏴‍☠️' },
  { name: 'Team Z-Fighters', bg: '#ea580c', border: '#fb923c', avatar: '⚡' },
  { name: 'Team Hidden Leaf', bg: '#ca8a04', border: '#facc15', avatar: '🍃' },
  { name: 'Team Demon Slayer', bg: '#16a34a', border: '#4ade80', avatar: '🗡️' },
  { name: 'Team Plus Ultra', bg: '#0284c7', border: '#38bdf8', avatar: '💥' },
  { name: 'Team Ghibli Spirits', bg: '#7c3aed', border: '#c084fc', avatar: '🍃' }
];

const LOCAL_STORAGE_KEY = 'anime_jeopardy_session_v2';

type GamePhase = 'SETUP' | 'BOARD' | 'FINAL_JEOPARDY' | 'PODIUM';

export default function App() {
  const [role, setRole] = useState<ScreenRole>(gameSync.getRole());
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
  const [volume, setVolume] = useState<number>(0.8);
  const [audioTestedFeedback, setAudioTestedFeedback] = useState<boolean>(false);

  // QOL Display Modes
  const [isTvSafeMode, setIsTvSafeMode] = useState<boolean>(false);
  const [isLargeTextMode, setIsLargeTextMode] = useState<boolean>(false);

  // Modals
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showAiQuestionModal, setShowAiQuestionModal] = useState<boolean>(false);
  const [showHostSheetModal, setShowHostSheetModal] = useState<boolean>(false);
  const [showScoreEditorModal, setShowScoreEditorModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Auto-Save Recovery Notice
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);

  // Handle Role Changes
  const handleRoleChange = (newRole: ScreenRole) => {
    setRole(newRole);
    gameSync.setRole(newRole);
  };

  // Subscribe to Multi-Screen Cross-Device Events
  useEffect(() => {
    const unsubscribe = gameSync.subscribe((action) => {
      switch (action.type) {
        case 'START_GAME':
          if (action.teams) setTeams(action.teams);
          if (action.gameData) setGameData(action.gameData);
          setUsedClues(new Set());
          setActiveClueData(null);
          setPhase('BOARD');
          soundFx.playCluePing();
          break;

        case 'OPEN_CLUE':
          setActiveClueData({
            catIndex: action.catIndex,
            clueIndex: action.clueIndex,
            clue: action.clue,
            categoryTitle: action.categoryTitle
          });
          if (action.clue?.isDailyDouble) {
            soundFx.playDailyDouble();
            setIsDailyDoubleActive(true);
          } else {
            soundFx.playCluePing();
            setIsDailyDoubleActive(false);
          }
          break;

        case 'AWARD_SCORE':
          setTeams(prev =>
            prev.map(t => (t.id === action.teamId ? { ...t, score: t.score + action.delta } : t))
          );
          break;

        case 'CLOSE_CLUE':
          if (activeClueData) {
            const key = `${gameData.categories[activeClueData.catIndex].id}-${activeClueData.clueIndex}`;
            setUsedClues(prev => new Set(prev).add(key));
          }
          setActiveClueData(null);
          break;

        case 'GO_TO_FINAL_JEOPARDY':
          soundFx.stopThinkMusic();
          setPhase('FINAL_JEOPARDY');
          break;

        case 'FINISH_GAME':
          soundFx.stopThinkMusic();
          if (action.finalTeams) setTeams(action.finalTeams);
          setPhase('PODIUM');
          soundFx.playFanfare();
          break;

        case 'RESET_GAME':
          soundFx.stopThinkMusic();
          soundFx.stopSpeaking();
          setPhase('SETUP');
          setUsedClues(new Set());
          setActiveClueData(null);
          break;
      }
    });

    return () => unsubscribe();
  }, [activeClueData, gameData]);

  // Restore game state on mount if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.teams && parsed.teams.length > 0 && parsed.phase !== 'SETUP') {
          setHasSavedSession(true);
        }
      }
    } catch {}
  }, []);

  // Save game state whenever relevant properties change
  useEffect(() => {
    if (phase !== 'SETUP' && teams.length > 0) {
      try {
        const payload = {
          gameData,
          phase,
          teams,
          usedClues: Array.from(usedClues),
          teamCount,
          teamNames,
          timestamp: Date.now()
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
        setHasSavedSession(true);
      } catch {}
    }
  }, [gameData, phase, teams, usedClues, teamCount, teamNames]);

  // Resume saved game
  const handleResumeGame = () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.gameData) setGameData(parsed.gameData);
      if (parsed.phase) setPhase(parsed.phase);
      if (parsed.teams) setTeams(parsed.teams);
      if (parsed.usedClues) setUsedClues(new Set(parsed.usedClues));
      if (parsed.teamCount) setTeamCount(parsed.teamCount);
      if (parsed.teamNames) setTeamNames(parsed.teamNames);
      setHasSavedSession(false);
      soundFx.playCorrect();
    } catch {}
  };

  const handleClearSavedGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setHasSavedSession(false);
  };

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
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowHostSheetModal(prev => !prev);
      }
      if (e.key === 's' || e.key === 'S') {
        setShowScoreEditorModal(prev => !prev);
      }
      if (e.key === 'r' || e.key === 'R') {
        setShowRoleModal(prev => !prev);
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

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundFx.volume = newVol;
  };

  const handleTestAudio = () => {
    soundFx.initCtx();
    soundFx.playCluePing();
    setTimeout(() => soundFx.playCorrect(), 200);
    setAudioTestedFeedback(true);
    setTimeout(() => setAudioTestedFeedback(false), 2000);
  };

  // Start new game with configured teams (and broadcast to TV display)
  const handleStartGame = () => {
    soundFx.initCtx();
    const initializedTeams: Team[] = [];
    for (let i = 0; i < teamCount; i++) {
      const colorDef = DEFAULT_TEAMS_INFO[i % DEFAULT_TEAMS_INFO.length];
      initializedTeams.push({
        id: i,
        name: teamNames[i]?.trim() || `Team ${i + 1}`,
        score: 0,
        avatar: colorDef.avatar || '🏴‍☠️',
        color: colorDef
      });
    }
    setTeams(initializedTeams);
    setUsedClues(new Set());
    setActiveClueData(null);
    setPhase('BOARD');
    setHasSavedSession(false);
    soundFx.playCluePing();

    // Broadcast START_GAME to the TV screen so it automatically enters BOARD phase!
    gameSync.broadcast({
      type: 'START_GAME',
      teams: initializedTeams,
      gameData
    });
  };

  // Clue Selection (and broadcast to TV display)
  const handleSelectClue = (catIndex: number, clueIndex: number) => {
    soundFx.initCtx();
    const category = gameData.categories[catIndex];
    const clue = category.clues[clueIndex];
    if (!clue) return;

    const data = {
      catIndex,
      clueIndex,
      clue,
      categoryTitle: category.title
    };

    setActiveClueData(data);

    if (clue.isDailyDouble) {
      soundFx.playDailyDouble();
      setIsDailyDoubleActive(true);
    } else {
      soundFx.playCluePing();
      setIsDailyDoubleActive(false);
    }

    // Broadcast OPEN_CLUE to TV screen!
    gameSync.broadcast({
      type: 'OPEN_CLUE',
      catIndex,
      clueIndex,
      clue,
      categoryTitle: category.title
    });
  };

  // Confirm Daily Double wager
  const handleConfirmDailyDoubleWager = (wagerAmount: number) => {
    if (!activeClueData) return;
    const updated = {
      ...activeClueData,
      clue: {
        ...activeClueData.clue,
        value: wagerAmount
      }
    };
    setActiveClueData(updated);
    setIsDailyDoubleActive(false);
    soundFx.playCluePing();

    gameSync.broadcast({
      type: 'OPEN_CLUE',
      catIndex: updated.catIndex,
      clueIndex: updated.clueIndex,
      clue: updated.clue,
      categoryTitle: updated.categoryTitle
    });
  };

  // Adjust score
  const handleAdjustScore = (teamId: number, delta: number) => {
    setTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, score: t.score + delta } : t))
    );
    gameSync.broadcast({ type: 'AWARD_SCORE', teamId, delta });
  };

  // Close clue
  const handleCloseClue = () => {
    soundFx.stopThinkMusic();
    soundFx.stopSpeaking();
    if (activeClueData) {
      const key = `${gameData.categories[activeClueData.catIndex].id}-${activeClueData.clueIndex}`;
      setUsedClues(prev => new Set(prev).add(key));
      setActiveClueData(null);
    }
    gameSync.broadcast({ type: 'CLOSE_CLUE' });
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
    soundFx.stopSpeaking();
    setTeams(finalTeams);
    setPhase('PODIUM');
    soundFx.playFanfare();
    gameSync.broadcast({ type: 'FINISH_GAME', finalTeams });
  };

  return (
    <div
      className={`min-h-screen bg-[#02052c] text-white flex flex-col justify-between selection:bg-[#ffcc00] selection:text-[#030852] ${
        isTvSafeMode ? 'p-3 sm:p-6' : ''
      } ${isLargeTextMode ? 'text-lg' : ''}`}
    >
      {/* =====================================================================
          TOP NAVIGATION BAR (Strict 3-Zone Contract with Role Indicator)
          ===================================================================== */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#030852]/90 border-b-2 border-[#ffcc00] shadow-xl z-20">
        {/* Zone 1: Wordmark & Role Indicator Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎌</span>
            <span className="font-jeopardy-display text-xl sm:text-2xl text-[#ffcc00] uppercase tracking-wider drop-shadow-md">
              Anime Jeopardy
            </span>
          </div>

          {/* Explicit Role Designation Pill */}
          <button
            type="button"
            onClick={() => setShowRoleModal(true)}
            title="Click to switch between TV Display and Host Controller"
            className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer ${
              role === 'tv'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'bg-amber-950 text-[#ffcc00] border-[#ffcc00] shadow-[0_0_12px_rgba(255,204,0,0.4)]'
            }`}
          >
            {role === 'tv' ? <Tv className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
            <span>{role === 'tv' ? '📺 TV Display Mode' : '👑 Host Controller'}</span>
            <span className="text-[10px] text-slate-400 font-normal">▼ Switch</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Contextual to Role) */}
        <nav className="hidden md:flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-300">
          <button
            onClick={() => setPhase('BOARD')}
            className={`hover:text-[#ffcc00] transition-colors cursor-pointer ${phase === 'BOARD' ? 'text-[#ffcc00]' : ''}`}
          >
            Game Board
          </button>
          
          {/* Host Sheet is only shown if in host mode */}
          {role === 'host' && (
            <button
              onClick={() => setShowHostSheetModal(true)}
              className="hover:text-emerald-300 text-emerald-400 font-bold transition-colors flex items-center gap-1 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-1 rounded-lg cursor-pointer"
              title="Open private host answer sheet on phone or host screen (H)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Host Answer Sheet
            </button>
          )}

          {role === 'host' && (
            <button
              onClick={() => setShowAiQuestionModal(true)}
              className="hover:text-[#ffcc00] transition-colors flex items-center gap-1 text-[#ffcc00] font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffcc00]" /> AI Generator
            </button>
          )}

          <button
            onClick={() => setShowDeployModal(true)}
            className="hover:text-[#ffcc00] transition-colors flex items-center gap-1 text-amber-300 cursor-pointer"
          >
            <Server className="w-3.5 h-3.5" /> Docker & Pi
          </button>

          {role === 'host' && (
            <button
              onClick={() => setShowEditorModal(true)}
              className="hover:text-[#ffcc00] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Clues
            </button>
          )}

          <button
            onClick={() => setShowRulesModal(true)}
            className="hover:text-[#ffcc00] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Guide
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Score Editor Button */}
          {phase === 'BOARD' && role === 'host' && (
            <button
              type="button"
              onClick={() => setShowScoreEditorModal(true)}
              title="Edit Team Scores & Badges (S)"
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scores</span>
            </button>
          )}

          {/* Settings Modal Toggle */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Game Night & TV Settings"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>

          {/* Audio Tester Button */}
          <button
            type="button"
            onClick={handleTestAudio}
            title="Test audio chime & unlock speakers"
            className={`px-2 py-1.5 sm:px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              audioTestedFeedback
                ? 'bg-emerald-600 text-white border-emerald-400 scale-105'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-[#ffcc00] border-[#ffcc00]/40'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{audioTestedFeedback ? 'Audio OK! 🔔' : 'Test Sound'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#ffcc00]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen TV Mode */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen TV Mode (F)"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">TV</span>
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              if (confirm('Start a new game session and reset board?')) {
                soundFx.stopThinkMusic();
                soundFx.stopSpeaking();
                setPhase('SETUP');
                setUsedClues(new Set());
                setActiveClueData(null);
                handleClearSavedGame();
                gameSync.broadcast({ type: 'RESET_GAME' });
              }
            }}
            title="Reset Game"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Auto-Save Recovery Notification Banner */}
      {hasSavedSession && phase === 'SETUP' && (
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border-b border-indigo-500 py-2 px-4 flex items-center justify-between text-xs sm:text-sm text-indigo-100 shadow-md">
          <div className="flex items-center gap-2">
            <span>💾</span>
            <span><strong>Previous game night session detected in progress!</strong> Would you like to resume?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResumeGame}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow transition-colors cursor-pointer"
            >
              Resume Game
            </button>
            <button
              type="button"
              onClick={handleClearSavedGame}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN BODY CONTAINER
          ===================================================================== */}
      <main className="flex-1 flex flex-col p-2 sm:p-5 max-w-7xl w-full mx-auto justify-center">
        {/* PHASE 1: SETUP SCREEN */}
        {phase === 'SETUP' && (
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="w-full max-w-3xl bg-gradient-to-b from-[#0b15c9]/30 via-[#04097a]/40 to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-6 sm:p-10 shadow-2xl text-center backdrop-blur-md">
              <span className="text-4xl sm:text-5xl block mb-2">🎌</span>
              <h1 className="font-jeopardy-display text-3xl sm:text-5xl text-[#ffcc00] uppercase tracking-wider mb-2 drop-shadow-md">
                Anime Jeopardy
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mb-6">
                {gameData.title} · {gameData.subtitle}
              </p>

              {/* DESIGNATE SCREEN ROLE CALLOUT */}
              <div className="mb-6 p-4 rounded-xl bg-[#02052c] border-2 border-dashed border-[#ffcc00]/50 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor className="w-4 h-4" /> Designate This Device's Role:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(true)}
                    className="text-xs text-amber-300 hover:underline cursor-pointer"
                  >
                    Learn about multi-screen setup →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('tv')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'tv'
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-md ring-2 ring-cyan-400'
                        : 'bg-slate-900 border-slate-700 hover:border-cyan-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Tv className="w-4 h-4 text-cyan-300" />
                      <strong className="text-sm text-cyan-300">📺 TV Display Screen</strong>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Put on your TV or projector. Answers are strictly hidden until Host reveals them.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('host')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'host'
                        ? 'bg-amber-950/80 border-[#ffcc00] shadow-md ring-2 ring-[#ffcc00]'
                        : 'bg-slate-900 border-slate-700 hover:border-amber-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-[#ffcc00]" />
                      <strong className="text-sm text-[#ffcc00]">👑 Host Controller (Admin)</strong>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Keep on your laptop or phone. Private answer key, timer controls, and "Reveal on TV".
                    </p>
                  </button>
                </div>
              </div>

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

              {/* Team Name Inputs & Avatar Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
                {Array.from({ length: teamCount }).map((_, idx) => {
                  const color = DEFAULT_TEAMS_INFO[idx % DEFAULT_TEAMS_INFO.length];
                  return (
                    <div key={idx} className="bg-[#02052c] border border-slate-700 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <label
                          style={{ color: color.border }}
                          className="text-xs font-bold uppercase tracking-wider block"
                        >
                          Team {idx + 1}
                        </label>
                        <span className="text-base select-none">{color.avatar}</span>
                      </div>
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
                onOpenScoreEditor={() => setShowScoreEditorModal(true)}
              />

              <div className="flex items-center gap-3">
                {role === 'host' && (
                  <button
                    type="button"
                    onClick={() => setShowScoreEditorModal(true)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs rounded-lg shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Scores & Badges
                  </button>
                )}

                {role === 'host' && (
                  <button
                    type="button"
                    onClick={() => setShowHostSheetModal(true)}
                    className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold text-xs sm:text-sm rounded-lg shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> View Host Answer Sheet
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundFx.stopThinkMusic();
                    soundFx.stopSpeaking();
                    setPhase('FINAL_JEOPARDY');
                    gameSync.broadcast({ type: 'GO_TO_FINAL_JEOPARDY' });
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
              handleClearSavedGame();
              gameSync.broadcast({ type: 'RESET_GAME' });
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

      {/* 2. Active Clue & Answer Modal (with Role separation & Reveal on TV) */}
      {activeClueData && !isDailyDoubleActive && (
        <ClueModal
          clue={activeClueData.clue}
          categoryTitle={activeClueData.categoryTitle}
          teams={teams}
          role={role}
          onAwardScore={handleAdjustScore}
          onClose={handleCloseClue}
        />
      )}

      {/* 3. Screen Role Designation Modal */}
      {showRoleModal && (
        <RoleDesignationModal
          currentRole={role}
          onSelectRole={handleRoleChange}
          onClose={() => setShowRoleModal(false)}
        />
      )}

      {/* 4. Host Admin & Answer Sheet Modal */}
      {showHostSheetModal && (
        <HostSheetModal
          gameData={gameData}
          usedClues={usedClues}
          onClose={() => setShowHostSheetModal(false)}
        />
      )}

      {/* 5. Score & Team Editor Modal */}
      {showScoreEditorModal && (
        <ScoreEditorModal
          teams={teams}
          onSaveTeams={(updated) => {
            setTeams(updated);
            setShowScoreEditorModal(false);
          }}
          onClose={() => setShowScoreEditorModal(false)}
        />
      )}

      {/* 6. TV & Game Night Settings Modal */}
      {showSettingsModal && (
        <GameSettingsModal
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isTvSafeMode={isTvSafeMode}
          onToggleTvSafeMode={() => setIsTvSafeMode(!isTvSafeMode)}
          isLargeTextMode={isLargeTextMode}
          onToggleLargeTextMode={() => setIsLargeTextMode(!isLargeTextMode)}
          onClearSavedGame={handleClearSavedGame}
          hasSavedGame={hasSavedSession}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* 7. AI Question & Board Generator Modal */}
      {showAiQuestionModal && (
        <AiQuestionGeneratorModal
          onApplyBoard={handleApplyAiBoard}
          onClose={() => setShowAiQuestionModal(false)}
        />
      )}

      {/* 8. Docker / Portainer Deployment Hub */}
      {showDeployModal && (
        <DeployHubModal onClose={() => setShowDeployModal(false)} />
      )}

      {/* 9. Question & Clues Customizer */}
      {showEditorModal && (
        <QuestionEditorModal
          gameData={gameData}
          onSaveData={(updated) => setGameData(updated)}
          onClose={() => setShowEditorModal(false)}
        />
      )}

      {/* 10. Rules & Game Night Guide Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-[#010314]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-6 shadow-2xl text-left">
            <h2 className="font-jeopardy-display text-2xl text-[#ffcc00] uppercase mb-3">
              How Multi-Screen Anime Jeopardy Works
            </h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong className="text-white">1. Screen Roles:</strong> Click the role badge at the top anytime to toggle between <span className="text-cyan-400 font-bold">📺 TV Display</span> (for your TV/projector) and <span className="text-[#ffcc00] font-bold">👑 Host Controller</span> (for your laptop/phone).
              </p>
              <p>
                <strong className="text-white">2. Secret Answers on Host Screen:</strong> The TV screen <strong>never</strong> displays answers or host buttons. The host sees the private answer key right inside their host screen.
              </p>
              <p>
                <strong className="text-white">3. Reveal Answer on TV:</strong> When a team buzzes in and answers correctly, the Host clicks <span className="text-emerald-400 font-bold">📢 Reveal Answer on TV</span>. The TV immediately reveals the big green answer box with celebration chimes!
              </p>
              <p>
                <strong className="text-white">4. Dual-Screen Synchronization:</strong> Both screens sync in real-time over your local Wi-Fi or via an extended HDMI cable window.
              </p>
            </div>
            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 bg-[#ffcc00] text-[#030852] font-bold text-sm rounded-lg hover:bg-[#ffe066] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-slate-500 border-t border-slate-900 bg-[#01031b]">
        Anime Jeopardy · Multi-Screen TV Display & Host Controller · Raspberry Pi & Docker Offline Ready
      </footer>
    </div>
  );
}
