/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { INITIAL_ANIME_DATA, type JeopardyGameData, type ClueItem } from './data/animeJeopardyData';
import { JeopardyBoard } from './components/JeopardyBoard';
import { ScoreBoard, type Team } from './components/ScoreBoard';
import { Podium } from './components/Podium';
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
import { FamilyFeudBoard } from './components/FamilyFeudBoard';
import { TvLobbyWaitingScreen } from './components/TvLobbyWaitingScreen';
import { soundFx } from './utils/audioSynth';
import { gameSync, type ScreenRole } from './utils/gameSync';
import { type RoundNumber, buildDoubleJeopardy, isBoardCleared, roundWagerFloor } from './utils/rounds';
import { RoundSplash } from './components/RoundSplash';
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
  Monitor,
  Flame,
  Copy,
  Check,
  ExternalLink
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
  const [gameMode, setGameMode] = useState<'JEOPARDY' | 'FEUD'>('JEOPARDY');
  
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
  const [round, setRound] = useState<RoundNumber>(1);
  const roundRef = useRef<RoundNumber>(1);
  const [splash, setSplash] = useState<null | { title: string; subtitle?: string; key: number }>(null);
  const activeCategories = round === 2 && gameData.doubleJeopardy?.length ? gameData.doubleJeopardy : gameData.categories;
  const activeCategoriesRef = useRef(activeCategories);
  activeCategoriesRef.current = activeCategories;
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
  const [syncStatus, setSyncStatus] = useState<string>('connecting');

  // Track real-time network sync connection health
  useEffect(() => {
    const unsub = gameSync.subscribeStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsub();
  }, []);

  // Handle Role Changes
  const handleRoleChange = (newRole: ScreenRole) => {
    setRole(newRole);
    gameSync.setRole(newRole);
  };

  const handleSwitchGameMode = (mode: 'JEOPARDY' | 'FEUD') => {
    setGameMode(mode);
    gameSync.broadcast({ type: 'SET_GAME_MODE', mode });
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode: mode,
        phase,
        teams,
        gameData
      }
    });
    if (mode === 'FEUD') {
      soundFx.playFeudReveal();
    } else {
      soundFx.playCluePing();
    }
  };

  // Keep a stable ref of the latest state to avoid re-subscribing and dropping events
  const stateRef = useRef({
    gameMode,
    phase,
    teams,
    gameData,
    usedClues,
    activeClueData,
    isDailyDoubleActive,
    role
  });

  useEffect(() => {
    stateRef.current = {
      gameMode,
      phase,
      teams,
      gameData,
      usedClues,
      activeClueData,
      isDailyDoubleActive,
      role
    };
  });

  // Point the clue zoom animation at the tile that was picked (works on host and TV)
  useLayoutEffect(() => {
    if (!activeClueData) return;
    const el = document.querySelector(`[data-clue-cell="${activeClueData.catIndex}-${activeClueData.clueIndex}"]`);
    const root = document.documentElement;
    if (el) {
      const r = el.getBoundingClientRect();
      root.style.setProperty('--clue-origin-x', `${r.left + r.width / 2}px`);
      root.style.setProperty('--clue-origin-y', `${r.top + r.height / 2}px`);
    } else {
      root.style.setProperty('--clue-origin-x', '50%');
      root.style.setProperty('--clue-origin-y', '50%');
    }
  }, [activeClueData?.catIndex, activeClueData?.clueIndex, activeClueData]);

  // Round-transition splash ("JEOPARDY!" / "DOUBLE JEOPARDY!") on every screen
  const lastSplashRef = useRef<string>('');
  useEffect(() => {
    if (gameMode !== 'JEOPARDY') return;
    let sig = '';
    let title = '';
    let subtitle: string | undefined;
    if (phase === 'BOARD' && round === 1) { sig = 'r1'; title = 'JEOPARDY!'; subtitle = gameData.subtitle || gameData.title; }
    else if (phase === 'BOARD' && round === 2) { sig = 'r2'; title = 'DOUBLE JEOPARDY!'; subtitle = 'Dollar values double. Two Daily Doubles are hiding.'; }
    else if (phase === 'FINAL_JEOPARDY') { sig = 'fj'; title = 'FINAL JEOPARDY!'; subtitle = gameData.finalJeopardy?.category; }
    else { lastSplashRef.current = ''; return; }
    if (sig === lastSplashRef.current) return;
    lastSplashRef.current = sig;
    setSplash({ title, subtitle, key: Date.now() });
    soundFx.playRoundIntro(round === 2 && sig === 'r2');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, gameMode]);

  // Subscribe to Multi-Screen Cross-Device Events once on mount (NEVER drop events during re-renders!)
  useEffect(() => {
    const unsubscribe = gameSync.subscribe((action) => {
      switch (action.type) {
        case 'SYNC_FULL_STATE': {
          const s = action.state;
          if (s) {
            if (s.gameMode && (s.gameMode === 'JEOPARDY' || s.gameMode === 'FEUD')) {
              setGameMode(s.gameMode);
            }
            if (s.phase) {
              setPhase(s.phase);
            }
            if (s.round === 1 || s.round === 2) {
              roundRef.current = s.round;
              setRound(s.round);
            }
            if (s.teams && Array.isArray(s.teams) && s.teams.length > 0) {
              setTeams(s.teams);
            }
            if (s.gameData && s.gameData.categories && Array.isArray(s.gameData.categories) && s.gameData.categories.length > 0) {
              setGameData(s.gameData);
            }
            if (s.usedClues && Array.isArray(s.usedClues)) {
              setUsedClues(new Set(s.usedClues));
            }
            if (s.activeClueData !== undefined) {
              setActiveClueData(s.activeClueData);
              if (s.activeClueData?.clue?.isDailyDouble) {
                setIsDailyDoubleActive(true);
              } else {
                setIsDailyDoubleActive(false);
              }
            }
          }
          break;
        }

        case 'REQUEST_STATE': {
          // If this is the active Host, share complete full state with newly connected TV screens
          const cur = stateRef.current;
          if (cur.role === 'host') {
            gameSync.broadcast({
              type: 'SYNC_FULL_STATE',
              state: {
                round: roundRef.current,
                gameMode: cur.gameMode,
                phase: cur.phase,
                teams: cur.teams,
                gameData: cur.gameData,
                usedClues: Array.from(cur.usedClues),
                activeClueData: cur.activeClueData,
                isDailyDoubleActive: cur.isDailyDoubleActive
              }
            });
          }
          break;
        }

        case 'RESET_SCORES':
          setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
          soundFx.playCluePing();
          break;

        case 'UPDATE_TEAMS':
          if (action.teams && Array.isArray(action.teams)) {
            setTeams(action.teams);
          }
          break;

        case 'SET_GAME_DATA':
          if (action.gameData && action.gameData.categories) {
            setGameData(action.gameData);
            setUsedClues(new Set());
            setActiveClueData(null);
          }
          break;

        case 'SET_GAME_MODE':
          if (action.mode) setGameMode(action.mode);
          break;

        case 'START_GAME':
          if (action.teams && Array.isArray(action.teams) && action.teams.length > 0) {
            setTeams(action.teams);
          }
          if (action.gameData && action.gameData.categories && action.gameData.categories.length > 0) {
            setGameData(action.gameData);
          }
          setUsedClues(new Set());
          setActiveClueData(null);
          setPhase('BOARD');
          roundRef.current = 1;
          setRound(1);
          soundFx.playCluePing();
          break;

        case 'OPEN_CLUE':
          setActiveClueData({
            catIndex: action.catIndex,
            clueIndex: action.clueIndex,
            clue: action.clue,
            categoryTitle: action.categoryTitle
          });
          // Auto-advance TV to BOARD if it was still on the waiting lobby
          setPhase((prev) => (prev === 'SETUP' ? 'BOARD' : prev));
          if (action.clue?.isDailyDouble) {
            soundFx.playDailyDouble(stateRef.current.role === 'tv');
            setIsDailyDoubleActive(true);
          } else {
            soundFx.playCluePing();
            setIsDailyDoubleActive(false);
          }
          break;

        case 'DAILY_DOUBLE_REVEAL':
          setActiveClueData({
            catIndex: action.catIndex,
            clueIndex: action.clueIndex,
            clue: action.clue,
            categoryTitle: action.categoryTitle
          });
          setPhase((prev) => (prev === 'SETUP' ? 'BOARD' : prev));
          setIsDailyDoubleActive(true);
          // Trigger high-impact Daily Double fanfare specifically on the TV display
          soundFx.playDailyDouble(true);
          break;

        case 'AWARD_SCORE':
          setTeams((prev) =>
            prev.map((t) => (t.id === action.teamId ? { ...t, score: t.score + action.delta } : t))
          );
          break;

        case 'CLOSE_CLUE':
          setActiveClueData(null);
          setIsDailyDoubleActive(false);
          {
            const active = stateRef.current.activeClueData;
            if (active) {
              const cat = activeCategoriesRef.current[active.catIndex];
              if (cat) {
                const key = `${cat.id}-${active.clueIndex}`;
                setUsedClues((prev) => new Set(prev).add(key));
              }
            }
          }
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
          roundRef.current = 1;
          setRound(1);
          setUsedClues(new Set());
          setActiveClueData(null);
          setIsDailyDoubleActive(false);
          setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  // Immediately request active game snapshot on mount (vital for TV screens connecting after Host starts)
  useEffect(() => {
    gameSync.fetchServerState();
  }, []);

  // Restore game state on mount if available (ONLY for Host controller, NEVER force onto TV display)
  useEffect(() => {
    if (role === 'tv') return; // TV should never prompt for local saved sessions!
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.teams && parsed.teams.length > 0 && parsed.phase !== 'SETUP') {
          setHasSavedSession(true);
        }
      }
    } catch {}
  }, [role]);

  // Save game state whenever relevant properties change
  useEffect(() => {
    if (phase !== 'SETUP' && teams.length > 0) {
      try {
        const payload = {
          gameData,
          phase,
          teams,
          usedClues: Array.from(usedClues),
          round,
          teamCount,
          teamNames,
          timestamp: Date.now()
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
        setHasSavedSession(true);
      } catch {}
    }
  }, [gameData, phase, teams, usedClues, round, teamCount, teamNames]);

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
      if (parsed.round === 1 || parsed.round === 2) {
        roundRef.current = parsed.round;
        setRound(parsed.round);
      }
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
    roundRef.current = 1;
    setRound(1);
    setHasSavedSession(false);
    soundFx.playCluePing();

    // Broadcast START_GAME and SYNC_FULL_STATE so TV screens transition automatically!
    gameSync.broadcast({
      type: 'START_GAME',
      teams: initializedTeams,
      gameData
    });
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode: 'JEOPARDY',
        phase: 'BOARD',
        teams: initializedTeams,
        gameData,
        usedClues: [],
        activeClueData: null,
        isDailyDoubleActive: false
      }
    });
  };

  // Clue Selection (and broadcast to TV display)
  const handleSelectClue = (catIndex: number, clueIndex: number) => {
    soundFx.initCtx();
    const category = activeCategories[catIndex];
    const clue = category.clues[clueIndex];
    if (!clue) return;

    const data = {
      catIndex,
      clueIndex,
      clue,
      categoryTitle: category.title
    };

    setActiveClueData(data);
    stateRef.current.activeClueData = data;

    if (clue.isDailyDouble) {
      soundFx.playDailyDouble(role === 'tv');
      setIsDailyDoubleActive(true);
      stateRef.current.isDailyDoubleActive = true;
      // Broadcast distinctive DAILY_DOUBLE_REVEAL to trigger sound & visual surprise on the TV display!
      gameSync.broadcast({
        type: 'DAILY_DOUBLE_REVEAL',
        catIndex,
        clueIndex,
        clue,
        categoryTitle: category.title
      });
    } else {
      soundFx.playCluePing();
      setIsDailyDoubleActive(false);
      stateRef.current.isDailyDoubleActive = false;
      gameSync.broadcast({
        type: 'OPEN_CLUE',
        catIndex,
        clueIndex,
        clue,
        categoryTitle: category.title
      });
    }

    // Also broadcast authoritative SYNC_FULL_STATE so TV screens and polling get active clue instantly
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode: 'JEOPARDY',
        phase: 'BOARD',
        teams,
        gameData,
        usedClues: Array.from(usedClues),
        activeClueData: data,
        isDailyDoubleActive: !!clue.isDailyDouble
      }
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
    stateRef.current.activeClueData = updated;
    stateRef.current.isDailyDoubleActive = false;
    soundFx.playCluePing();

    gameSync.broadcast({
      type: 'OPEN_CLUE',
      catIndex: updated.catIndex,
      clueIndex: updated.clueIndex,
      clue: updated.clue,
      categoryTitle: updated.categoryTitle
    });

    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode: 'JEOPARDY',
        phase: 'BOARD',
        teams,
        gameData,
        usedClues: Array.from(usedClues),
        activeClueData: updated,
        isDailyDoubleActive: false
      }
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
    let updatedUsedClues = usedClues;
    if (activeClueData) {
      const key = `${activeCategories[activeClueData.catIndex].id}-${activeClueData.clueIndex}`;
      updatedUsedClues = new Set(usedClues).add(key);
      setUsedClues(updatedUsedClues);
      setActiveClueData(null);
      stateRef.current.activeClueData = null;
    }
    gameSync.broadcast({ type: 'CLOSE_CLUE' });
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode: 'JEOPARDY',
        phase: 'BOARD',
        teams,
        gameData,
        usedClues: Array.from(updatedUsedClues),
        activeClueData: null,
        isDailyDoubleActive: false
      }
    });
  };

  // Apply fresh board from AI Question Generator
  const handleApplyAiBoard = (newBoard: JeopardyGameData) => {
    setGameData(newBoard);
    setUsedClues(new Set());
    setActiveClueData(null);
    soundFx.playCorrect();
    // Broadcast new AI board to TV and server
    gameSync.broadcast({
      type: 'SET_GAME_DATA',
      gameData: newBoard
    });
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode: 'JEOPARDY',
        phase,
        teams,
        gameData: newBoard,
        usedClues: [],
        activeClueData: null,
        isDailyDoubleActive: false
      }
    });
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

  // Explicitly clear/reset all team scores to $0 (synced across all screens)
  const handleResetScores = () => {
    soundFx.initCtx();
    const zeroed = teams.map((t) => ({ ...t, score: 0 }));
    setTeams(zeroed);
    soundFx.playCluePing();
    gameSync.broadcast({ type: 'RESET_SCORES' });
    gameSync.broadcast({ type: 'UPDATE_TEAMS', teams: zeroed });
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode,
        phase,
        teams: zeroed,
        gameData,
        usedClues: Array.from(usedClues),
        activeClueData,
        isDailyDoubleActive
      }
    });
  };

  // Play again with same teams & reset scores to $0 immediately
  const handlePlayAgainSameTeams = () => {
    soundFx.initCtx();
    const zeroed = teams.map((t) => ({ ...t, score: 0 }));
    setTeams(zeroed);
    setUsedClues(new Set());
    setActiveClueData(null);
    setIsDailyDoubleActive(false);
    setPhase('BOARD');
    roundRef.current = 1;
    setRound(1);
    soundFx.playCorrect();

    gameSync.broadcast({ type: 'RESET_SCORES' });
    gameSync.broadcast({ type: 'UPDATE_TEAMS', teams: zeroed });
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: roundRef.current,
        gameMode: 'JEOPARDY',
        phase: 'BOARD',
        teams: zeroed,
        gameData,
        usedClues: [],
        activeClueData: null,
        isDailyDoubleActive: false
      }
    });
  };

  // Advance to the Double Jeopardy round (fresh board, doubled values, 2 Daily Doubles)
  const handleStartDoubleJeopardy = () => {
    soundFx.initCtx();
    soundFx.stopThinkMusic();
    soundFx.stopSpeaking();
    const nextData: JeopardyGameData = { ...gameData, doubleJeopardy: buildDoubleJeopardy(gameData) };
    roundRef.current = 2;
    setRound(2);
    setGameData(nextData);
    setUsedClues(new Set());
    setActiveClueData(null);
    setIsDailyDoubleActive(false);
    setPhase('BOARD');
    gameSync.broadcast({
      type: 'SYNC_FULL_STATE',
      state: {
        round: 2,
        gameMode: 'JEOPARDY',
        phase: 'BOARD',
        teams,
        gameData: nextData,
        usedClues: [],
        activeClueData: null,
        isDailyDoubleActive: false
      }
    });
  };

  const handleGoToFinal = () => {
    soundFx.stopThinkMusic();
    soundFx.stopSpeaking();
    setPhase('FINAL_JEOPARDY');
    gameSync.broadcast({ type: 'GO_TO_FINAL_JEOPARDY' });
  };

  const boardCleared = phase === 'BOARD' && !activeClueData && isBoardCleared(activeCategories, usedClues);

  // Full reset back to Setup with $0 scores
  const handleFullResetToSetup = () => {
    soundFx.stopThinkMusic();
    soundFx.stopSpeaking();
    const zeroed = teams.map((t) => ({ ...t, score: 0 }));
    setTeams(zeroed);
    setUsedClues(new Set());
    setActiveClueData(null);
    setIsDailyDoubleActive(false);
    setPhase('SETUP');
    roundRef.current = 1;
    setRound(1);
    handleClearSavedGame();
    gameSync.broadcast({ type: 'RESET_GAME' });
  };

  return (
    <div
      className={`min-h-screen overflow-x-clip bg-[#02052c] text-white flex flex-col justify-between selection:bg-[#ffcc00] selection:text-[#030852] ${
        isTvSafeMode ? 'p-3 sm:p-6' : ''
      } ${isLargeTextMode ? 'text-lg' : ''}`}
    >
      {/* =====================================================================
          TOP NAVIGATION BAR (Strict 3-Zone Contract with Role Indicator)
          ===================================================================== */}
      <header className="flex flex-wrap gap-y-2 items-center justify-between px-3 sm:px-6 py-2.5 bg-[#030852]/90 border-b-2 border-[#ffcc00] shadow-xl z-20">
        {/* Zone 1: Wordmark & Role Indicator Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="font-jeopardy-display text-xl sm:text-2xl text-[#ffcc00] uppercase tracking-wider drop-shadow-md">
              Family Jeopardy
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
            <span>{role === 'tv' ? '📺 TV Display' : '👑 Host Controller'}</span>
            <span className="text-[10px] text-slate-400 font-normal">▼</span>
          </button>

          {/* Real-Time Live Sync Status Pill */}
          <div
            title={
              syncStatus === 'connected'
                ? 'Real-time multi-screen synchronization is active and working.'
                : syncStatus === 'connecting'
                ? 'Connecting to sync service...'
                : 'Sync disconnected. Reconnecting automatically...'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
              syncStatus === 'connected'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : syncStatus === 'connecting'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/70 animate-pulse'
                : 'bg-red-950/80 text-red-300 border-red-500/70'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : syncStatus === 'connecting'
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            />
            <span>
              {role === 'host'
                ? syncStatus === 'connected'
                  ? 'Sync Active (Host)'
                  : 'Connecting...'
                : syncStatus === 'connected'
                ? 'Sync Active (TV)'
                : 'Connecting...'}
            </span>
          </div>

          {/* Game Mode Switcher: Jeopardy vs Family Feud */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-amber-500/50 shadow-inner">
            <button
              type="button"
              onClick={() => handleSwitchGameMode('JEOPARDY')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                gameMode === 'JEOPARDY'
                  ? 'bg-[#ffcc00] text-[#02052c] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌟 Jeopardy</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchGameMode('FEUD')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                gameMode === 'FEUD'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow ring-1 ring-white/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Family Feud</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Contextual to Role) */}
        <nav className="hidden md:flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-300">
          <button
            onClick={() => {
              if (teams.length === 0) {
                handleStartGame();
              } else {
                setPhase('BOARD');
                gameSync.broadcast({
                  type: 'SYNC_FULL_STATE',
                  state: { gameMode, phase: 'BOARD', teams, gameData }
                });
              }
            }}
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
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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

          {/* Reset Game & Clear Scores */}
          <button
            onClick={() => {
              if (confirm('Start a new game session and reset board? All scores will be cleared to $0.')) {
                handleFullResetToSetup();
              }
            }}
            title="Reset Game & Clear Scores to $0"
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
        {gameMode === 'FEUD' ? (
          <FamilyFeudBoard
            teams={
              teams.length >= 2
                ? teams
                : Array.from({ length: 2 }).map((_, idx) => {
                    const info = DEFAULT_TEAMS_INFO[idx % DEFAULT_TEAMS_INFO.length];
                    return {
                      id: idx + 1,
                      name: teamNames[idx] || (idx === 0 ? 'Team Straw Hat' : 'Team Z-Fighters'),
                      score: 0,
                      color: { bg: info.bg, border: info.border },
                      avatar: info.avatar,
                    };
                  })
            }
            role={role}
            onUpdateTeams={(updated) => {
              setTeams(updated);
            }}
            onSwitchToJeopardy={() => handleSwitchGameMode('JEOPARDY')}
          />
        ) : (
          <>
            {/* PHASE 1: SETUP SCREEN */}
            {phase === 'SETUP' && (
              role === 'tv' ? (
                <TvLobbyWaitingScreen
                  gameTitle={gameData.title}
                  gameSubtitle={gameData.subtitle}
                  onSwitchToHost={() => handleRoleChange('host')}
                  onCheckSync={() => gameSync.fetchServerState()}
                  onEnterBoard={() => {
                    setPhase('BOARD');
                    gameSync.fetchServerState();
                  }}
                />
              ) : (
                <section className="stage-setup">
                  <p className="stage-kicker">{gameData.subtitle || gameData.title}</p>
                  <h1 className="stage-headline">Who&rsquo;s playing tonight?</h1>
                  <p className="stage-lede">Write each team&rsquo;s name on a podium. Two to six teams can play.</p>

                  <div className="podium-row podium-row-setup">
                    {Array.from({ length: teamCount }).map((_, idx) => {
                      const color = DEFAULT_TEAMS_INFO[idx % DEFAULT_TEAMS_INFO.length];
                      return (
                        <div key={idx} className="podium-slot">
                          <Podium
                            size="lg"
                            name={teamNames[idx] ?? ''}
                            color={color.border}
                            score={0}
                            placeholder={`Team ${idx + 1}`}
                            onNameChange={(v) => {
                              const updated = [...teamNames];
                              updated[idx] = v;
                              setTeamNames(updated);
                            }}
                          />
                          {teamCount > 2 && idx === teamCount - 1 && (
                            <button
                              type="button"
                              className="podium-remove"
                              onClick={() => setTeamCount(teamCount - 1)}
                              aria-label="Remove this team"
                              title="Remove this team"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {teamCount < 6 && (
                      <button
                        type="button"
                        className="podium-add"
                        onClick={() => {
                          if (!teamNames[teamCount]) {
                            const updated = [...teamNames];
                            updated[teamCount] = DEFAULT_TEAMS_INFO[teamCount % DEFAULT_TEAMS_INFO.length].name;
                            setTeamNames(updated);
                          }
                          setTeamCount(teamCount + 1);
                        }}
                      >
                        <span className="podium-add-plus" aria-hidden="true">+</span>
                        Add a team
                      </button>
                    )}
                  </div>

                  <button type="button" onClick={handleStartGame} className="marquee-button">
                    Start the show
                  </button>

                  <div className="stage-secondary">
                    <button type="button" onClick={() => setShowHostSheetModal(true)}>
                      <ShieldCheck className="w-4 h-4" /> Preview answers
                    </button>
                    <button type="button" onClick={() => setShowAiQuestionModal(true)}>
                      <Sparkles className="w-4 h-4" /> Make a new board
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('role', 'tv');
                        window.open(url.toString(), '_blank_tv', 'noopener,noreferrer');
                      }}
                    >
                      <Tv className="w-4 h-4" /> Open the TV screen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('role', 'tv');
                        navigator.clipboard?.writeText(url.toString()).catch(() => {});
                      }}
                    >
                      <Copy className="w-4 h-4" /> Copy TV link
                    </button>
                  </div>
                </section>
              )
            )}

        {/* PHASE 2: MAIN JEOPARDY BOARD */}
        {phase === 'BOARD' && (
          <div className="flex-1 flex flex-col justify-between gap-3 sm:gap-4">
            {boardCleared && (
              <div className="round-complete-banner flex flex-col sm:flex-row items-center justify-center gap-3 bg-[#030852] border-2 border-[#ffcc00] rounded-xl px-4 py-3 shadow-[0_0_30px_rgba(255,204,0,0.35)]">
                <span className="font-jeopardy-display text-[#ffcc00] text-xl sm:text-2xl uppercase tracking-wider">
                  {round === 1 ? 'That clears the Jeopardy! round' : 'The board is clear'}
                </span>
                {role === 'host' && (
                  <button
                    type="button"
                    onClick={round === 1 ? handleStartDoubleJeopardy : handleGoToFinal}
                    className="px-5 py-2 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display uppercase tracking-wider rounded-lg cursor-pointer"
                  >
                    {round === 1 ? 'On to Double Jeopardy!' : 'On to Final Jeopardy!'}
                  </button>
                )}
              </div>
            )}
            <JeopardyBoard
              categories={activeCategories}
              round={round}
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

              {role === 'host' && (
                <div className="board-controls">
                  <button type="button" onClick={() => setShowHostSheetModal(true)}>
                    <ShieldCheck className="w-4 h-4" /> Answers
                  </button>
                  <button type="button" onClick={() => setShowScoreEditorModal(true)}>
                    <Edit2 className="w-4 h-4" /> Edit teams
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Set every team back to $0 on all screens?')) handleResetScores();
                    }}
                  >
                    <RotateCcw className="w-4 h-4" /> Reset scores
                  </button>
                  {round === 1 && (
                    <button type="button" onClick={handleGoToFinal}>
                      <Trophy className="w-4 h-4" /> Skip to Final
                    </button>
                  )}
                  <button
                    type="button"
                    className="board-next"
                    onClick={round === 1 ? handleStartDoubleJeopardy : handleGoToFinal}
                  >
                    {round === 1 ? 'Double Jeopardy!' : 'Final Jeopardy!'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 3: FINAL JEOPARDY */}
        {phase === 'FINAL_JEOPARDY' && (
          <FinalJeopardyModal
            finalData={gameData.finalJeopardy}
            teams={teams}
            role={role}
            onFinishGame={handleFinishGame}
          />
        )}

        {/* PHASE 4: PODIUM & CHAMPION SCREEN */}
        {phase === 'PODIUM' && (
          <PodiumScreen
            teams={teams}
            onRestart={handleFullResetToSetup}
            onPlayAgainSameTeams={handlePlayAgainSameTeams}
            onResetScores={handleResetScores}
          />
        )}
          </>
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
          role={role}
          wagerFloor={roundWagerFloor(round)}
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
          gameData={{ ...gameData, categories: activeCategories }}
          usedClues={usedClues}
          onSelectClue={(catIdx, clueIdx) => {
            setShowHostSheetModal(false);
            handleSelectClue(catIdx, clueIdx);
          }}
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
            gameSync.broadcast({ type: 'UPDATE_TEAMS', teams: updated });
            gameSync.broadcast({
              type: 'SYNC_FULL_STATE',
              state: {
                round: roundRef.current,
                gameMode,
                phase,
                teams: updated,
                gameData,
                usedClues: Array.from(usedClues),
                activeClueData,
                isDailyDoubleActive
              }
            });
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
          onSaveData={(updated) => {
            setGameData(updated);
            setShowEditorModal(false);
            gameSync.broadcast({ type: 'SET_GAME_DATA', gameData: updated });
            gameSync.broadcast({
              type: 'SYNC_FULL_STATE',
              state: {
                round: roundRef.current,
                gameMode,
                phase,
                teams,
                gameData: updated,
                usedClues: Array.from(usedClues),
                activeClueData,
                isDailyDoubleActive
              }
            });
          }}
          onClose={() => setShowEditorModal(false)}
        />
      )}

      {/* 10. Rules & Game Night Guide Modal */}
      {showRulesModal && (
        <div
          data-modal-overlay="true"
          className="fixed inset-0 z-50 bg-[#010314]/90 backdrop-blur-md flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
          }}
        >
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-6 shadow-2xl text-left">
            <h2 className="font-jeopardy-display text-2xl text-[#ffcc00] uppercase mb-3">
              How Multi-Screen Family Jeopardy Works
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
        Family Jeopardy runs on your home network. Open it on the TV, then run the game from your phone or laptop.
      </footer>
      {splash && (
        <RoundSplash key={splash.key} title={splash.title} subtitle={splash.subtitle} onDone={() => setSplash(null)} />
      )}
    </div>
  );
}
