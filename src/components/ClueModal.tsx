import React, { useState, useEffect, useRef } from 'react';
import { ClueItem } from '../data/animeJeopardyData';
import { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
import { gameSync, ScreenRole } from '../utils/gameSync';
import { 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Image as ImageIcon, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  Plus,
  Lock,
  Volume2,
  VolumeX,
  Radio,
  Tv,
  Crown,
  Camera
} from 'lucide-react';

interface ClueModalProps {
  clue: ClueItem;
  categoryTitle: string;
  teams: Team[];
  role?: ScreenRole;
  onAwardScore: (teamId: number, delta: number) => void;
  onClose: () => void;
}

export const ClueModal: React.FC<ClueModalProps> = ({
  clue,
  categoryTitle,
  teams,
  role = 'host',
  onAwardScore,
  onClose
}) => {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showHostPrivateAnswer, setShowHostPrivateAnswer] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Authoritative Timestamp-Based Timer State
  const [initialDuration, setInitialDuration] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isThinkMusicActive, setIsThinkMusicActive] = useState<boolean>(false);

  // Speech synthesis (Host reads clue aloud)
  const [isReadingAloud, setIsReadingAloud] = useState<boolean>(false);

  // Interactive Buzzer Lockout State
  const [buzzedTeamId, setBuzzedTeamId] = useState<number | null>(null);
  const [lockedOutTeamIds, setLockedOutTeamIds] = useState<Set<number>>(new Set());

  // Ref to track last tick sound played to avoid duplicate audio ticks
  const lastTickSoundSec = useRef<number | null>(null);

  // Multi-Screen Synchronization Listener
  useEffect(() => {
    const unsubscribe = gameSync.subscribe((action) => {
      switch (action.type) {
        case 'SYNC_TIMER':
          setIsTimerRunning(action.isRunning);
          setTimeLeft(action.timeLeft);
          setTimerEndTime(action.endTime);
          if (action.initialDuration) {
            setInitialDuration(action.initialDuration);
          }
          if (action.isThinkMusic !== undefined) {
            setIsThinkMusicActive(action.isThinkMusic);
            if (action.isThinkMusic && action.isRunning) {
              soundFx.playThinkMusic();
            } else if (!action.isThinkMusic) {
              soundFx.stopThinkMusic();
            }
          }
          if (action.timeLeft === 0 && !action.isRunning) {
            soundFx.stopThinkMusic();
            soundFx.playTripleBuzz();
          }
          break;

        case 'START_TIMER':
          setIsTimerRunning(true);
          break;

        case 'PAUSE_TIMER':
          setIsTimerRunning(false);
          setTimerEndTime(null);
          soundFx.stopThinkMusic();
          break;

        case 'RESET_TIMER':
          setIsTimerRunning(false);
          setTimerEndTime(null);
          setTimeLeft(action.seconds || 15);
          setInitialDuration(action.seconds || 15);
          soundFx.stopThinkMusic();
          break;

        case 'REVEAL_ANSWER_ON_TV':
          setIsAnswerRevealed(true);
          soundFx.playCorrect();
          soundFx.stopThinkMusic();
          setIsTimerRunning(false);
          setTimerEndTime(null);
          break;

        case 'TOGGLE_THINK_MUSIC':
          setIsThinkMusicActive(action.active);
          if (action.active) soundFx.playThinkMusic();
          else soundFx.stopThinkMusic();
          break;

        case 'BUZZ_IN':
          setBuzzedTeamId(action.teamId);
          setIsTimerRunning(false);
          setTimerEndTime(null);
          soundFx.playBuzzer();
          soundFx.stopThinkMusic();
          break;

        case 'CLEAR_BUZZER':
          setBuzzedTeamId(null);
          break;

        case 'CLOSE_CLUE':
          soundFx.stopThinkMusic();
          soundFx.stopSpeaking();
          // Active clue state is cleared by App.tsx, which unmounts this modal cleanly
          break;
      }
    });

    return () => {
      unsubscribe();
      soundFx.stopThinkMusic();
      soundFx.stopSpeaking();
    };
  }, [onClose]);

  // High-Precision Timestamp Calculation Loop
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (isTimerRunning && timerEndTime) {
      timerId = setInterval(() => {
        const now = Date.now();
        const diffMs = timerEndTime - now;
        const secondsRemaining = Math.max(0, Math.ceil(diffMs / 1000));

        setTimeLeft(secondsRemaining);

        // Sound cues for 5s down to 1s
        if (secondsRemaining <= 5 && secondsRemaining > 0 && lastTickSoundSec.current !== secondsRemaining) {
          lastTickSoundSec.current = secondsRemaining;
          soundFx.playTimerTick();
        }

        // Time's Up Trigger
        if (diffMs <= 0) {
          setIsTimerRunning(false);
          setTimerEndTime(null);
          setTimeLeft(0);
          soundFx.stopThinkMusic();
          soundFx.playTripleBuzz();
          setIsThinkMusicActive(false);

          if (role === 'host') {
            gameSync.broadcast({
              type: 'SYNC_TIMER',
              isRunning: false,
              timeLeft: 0,
              endTime: null,
              initialDuration,
              isThinkMusic: false
            });
          }
        }
      }, 100);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isTimerRunning, timerEndTime, initialDuration, role]);

  // Host Periodic Sync Heartbeat (broadcasts exact timestamp every 1s while running)
  useEffect(() => {
    if (role !== 'host' || !isTimerRunning || !timerEndTime) return;

    const heartbeat = setInterval(() => {
      gameSync.broadcast({
        type: 'SYNC_TIMER',
        isRunning: true,
        timeLeft,
        endTime: timerEndTime,
        initialDuration,
        isThinkMusic: isThinkMusicActive
      });
    }, 1000);

    return () => clearInterval(heartbeat);
  }, [role, isTimerRunning, timerEndTime, timeLeft, initialDuration, isThinkMusicActive]);

  // Keyboard buzzer listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (buzzedTeamId !== null) return;

      let targetTeamIndex: number | null = null;
      if (e.key === '1' || e.key === 'q' || e.key === 'Q') targetTeamIndex = 0;
      else if (e.key === '2' || e.key === 'p' || e.key === 'P') targetTeamIndex = 1;
      else if (e.key === '3' || e.key === 'z' || e.key === 'Z') targetTeamIndex = 2;
      else if (e.key === '4' || e.key === 'm' || e.key === 'M') targetTeamIndex = 3;
      else if (e.key === '5' || e.key === 'b' || e.key === 'B') targetTeamIndex = 4;
      else if (e.key === '6') targetTeamIndex = 5;

      if (targetTeamIndex !== null && targetTeamIndex < teams.length) {
        const team = teams[targetTeamIndex];
        if (!lockedOutTeamIds.has(team.id)) {
          triggerBuzzIn(team.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buzzedTeamId, lockedOutTeamIds, teams]);

  // Trigger Buzzer and sync across screens
  const triggerBuzzIn = (teamId: number) => {
    soundFx.initCtx();
    soundFx.stopSpeaking();
    soundFx.playBuzzer();
    setBuzzedTeamId(teamId);
    setIsTimerRunning(false);
    setTimerEndTime(null);

    if (isThinkMusicActive) {
      soundFx.stopThinkMusic();
    }

    gameSync.broadcast({ type: 'BUZZ_IN', teamId });
    gameSync.broadcast({
      type: 'SYNC_TIMER',
      isRunning: false,
      timeLeft,
      endTime: null,
      initialDuration,
      isThinkMusic: isThinkMusicActive
    });
  };

  const handleClearBuzzer = () => {
    setBuzzedTeamId(null);
    gameSync.broadcast({ type: 'CLEAR_BUZZER' });
  };

  // Toggle Timer (Host Action)
  const handleToggleTimer = () => {
    soundFx.initCtx();
    if (!isTimerRunning) {
      const duration = timeLeft === 0 ? 15 : timeLeft;
      const end = Date.now() + duration * 1000;
      setTimeLeft(duration);
      setTimerEndTime(end);
      setIsTimerRunning(true);
      lastTickSoundSec.current = null;

      if (isThinkMusicActive) {
        soundFx.playThinkMusic();
      }

      gameSync.broadcast({
        type: 'SYNC_TIMER',
        isRunning: true,
        timeLeft: duration,
        endTime: end,
        initialDuration: Math.max(initialDuration, duration),
        isThinkMusic: isThinkMusicActive
      });
    } else {
      const remaining = timerEndTime ? Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000)) : timeLeft;
      setIsTimerRunning(false);
      setTimerEndTime(null);
      setTimeLeft(remaining);
      soundFx.stopThinkMusic();

      gameSync.broadcast({
        type: 'SYNC_TIMER',
        isRunning: false,
        timeLeft: remaining,
        endTime: null,
        initialDuration,
        isThinkMusic: isThinkMusicActive
      });
    }
  };

  // Reset Timer (Host Action)
  const handleResetTimer = (seconds = 15) => {
    soundFx.stopThinkMusic();
    setIsTimerRunning(false);
    setTimerEndTime(null);
    setTimeLeft(seconds);
    setInitialDuration(seconds);
    setIsThinkMusicActive(false);
    lastTickSoundSec.current = null;

    gameSync.broadcast({
      type: 'SYNC_TIMER',
      isRunning: false,
      timeLeft: seconds,
      endTime: null,
      initialDuration: seconds,
      isThinkMusic: false
    });
  };

  // Add 5 seconds to timer (Host Action)
  const handleAddFiveSeconds = () => {
    const curRemaining = timerEndTime ? Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000)) : timeLeft;
    const newTime = curRemaining + 5;
    const newEnd = isTimerRunning ? Date.now() + newTime * 1000 : null;
    const newInit = Math.max(initialDuration, newTime);

    setTimeLeft(newTime);
    setTimerEndTime(newEnd);
    setInitialDuration(newInit);

    gameSync.broadcast({
      type: 'SYNC_TIMER',
      isRunning: isTimerRunning,
      timeLeft: newTime,
      endTime: newEnd,
      initialDuration: newInit,
      isThinkMusic: isThinkMusicActive
    });
  };

  // Toggle Jeopardy Think Music (Host Action)
  const handleToggleThinkMusic = () => {
    soundFx.initCtx();
    const nextState = !isThinkMusicActive;
    setIsThinkMusicActive(nextState);

    if (nextState) {
      if (!isTimerRunning) {
        handleToggleTimer();
      } else {
        soundFx.playThinkMusic();
      }
    } else {
      soundFx.stopThinkMusic();
    }

    gameSync.broadcast({ type: 'TOGGLE_THINK_MUSIC', active: nextState });
  };

  // Web Speech API: Host Reads Clue Aloud
  const handleToggleSpeech = () => {
    soundFx.initCtx();
    if (isReadingAloud) {
      soundFx.stopSpeaking();
      setIsReadingAloud(false);
    } else {
      setIsReadingAloud(true);
      soundFx.speak(clue.clue, () => {
        setIsReadingAloud(false);
      });
    }
  };

  // Master action: Reveal answer to TV screen!
  const handleRevealOnTv = () => {
    soundFx.stopThinkMusic();
    soundFx.stopSpeaking();
    setIsTimerRunning(false);
    setTimerEndTime(null);
    setIsAnswerRevealed(true);
    soundFx.playCorrect();

    gameSync.broadcast({ type: 'REVEAL_ANSWER_ON_TV' });
    gameSync.broadcast({
      type: 'SYNC_TIMER',
      isRunning: false,
      timeLeft,
      endTime: null,
      initialDuration,
      isThinkMusic: false
    });
  };

  const handleCorrect = (teamId: number) => {
    soundFx.stopThinkMusic();
    soundFx.stopSpeaking();
    setIsTimerRunning(false);
    setTimerEndTime(null);
    // onAwardScore in App.tsx updates teams and broadcasts AWARD_SCORE once
    onAwardScore(teamId, clue.value);
    soundFx.playCorrect();
    setIsAnswerRevealed(true);

    gameSync.broadcast({ type: 'REVEAL_ANSWER_ON_TV' });
    gameSync.broadcast({
      type: 'SYNC_TIMER',
      isRunning: false,
      timeLeft,
      endTime: null,
      initialDuration,
      isThinkMusic: false
    });
  };

  const handleWrong = (teamId: number) => {
    // onAwardScore in App.tsx updates teams and broadcasts AWARD_SCORE once
    onAwardScore(teamId, -clue.value);
    soundFx.playWrong();
    setLockedOutTeamIds((prev) => new Set(prev).add(teamId));
    setBuzzedTeamId(null);

    gameSync.broadcast({ type: 'CLEAR_BUZZER' });
  };

  const handleHostCloseClue = () => {
    soundFx.stopThinkMusic();
    soundFx.stopSpeaking();
    // onClose triggers handleCloseClue in App.tsx, which updates used clues and broadcasts CLOSE_CLUE
    onClose();
  };

  const buzzedTeam = teams.find((t) => t.id === buzzedTeamId);
  const progressPercent = Math.min(100, Math.max(0, (timeLeft / (initialDuration || 15)) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/94 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div
        className={`w-full max-w-4xl bg-gradient-to-b from-[#0b15c9] via-[#04097a] to-[#020536] border-2 sm:border-4 rounded-2xl p-4 sm:p-7 shadow-2xl flex flex-col justify-between max-h-[96vh] overflow-y-auto ${
          role === 'tv' ? 'border-cyan-400' : 'border-[#ffcc00]'
        }`}
      >
        {/* ===================================================================
            TOP BAR: Role Indicator, Category, Authoritative Countdown Timer
            =================================================================== */}
        <div className="border-b-2 border-[#ffcc00]/40 pb-3 mb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1 border ${
                  role === 'tv'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-amber-950 text-amber-300 border-amber-500'
                }`}
              >
                {role === 'tv' ? <Tv className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                {role === 'tv' ? 'TV Big Screen View' : 'Host Controller'}
              </span>

              <div className="font-jeopardy-display text-[#ffcc00] text-base sm:text-xl uppercase tracking-wider">
                {categoryTitle}
              </div>
            </div>

            {/* LIVE COUNTDOWN TIMER & CONTROLS */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#02052c] border border-amber-500/50 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-md flex-wrap">
              <Clock
                className={`w-4 h-4 ${
                  timeLeft <= 3 && timeLeft > 0 ? 'text-red-400 animate-pulse' : 'text-[#ffcc00]'
                }`}
              />

              <span
                className={`font-jeopardy-display text-lg sm:text-xl tabular-nums font-bold ${
                  timeLeft === 0
                    ? 'text-red-500 animate-bounce'
                    : timeLeft <= 5
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {timeLeft === 0 ? "TIME'S UP!" : `${timeLeft}s`}
              </span>

              {/* Host-only timer controls */}
              {role === 'host' && (
                <>
                  <button
                    type="button"
                    onClick={handleToggleTimer}
                    title={isTimerRunning ? 'Pause Timer' : 'Start Countdown'}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      isTimerRunning
                        ? 'bg-amber-500 text-[#030852]'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleThinkMusic}
                    title={isThinkMusicActive ? 'Mute Think Music' : 'Play Iconic Jeopardy Theme'}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isThinkMusicActive
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleSpeech}
                    title={isReadingAloud ? 'Stop reading' : 'Read clue aloud (Computer Voice)'}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isReadingAloud
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isReadingAloud ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleAddFiveSeconds}
                    title="Add 5 seconds"
                    className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />5s
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetTimer(15)}
                    title="Reset timer to 15 seconds"
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            <div className="font-jeopardy-display text-white text-xl sm:text-3xl tracking-wider">
              ${clue.value}
            </div>
          </div>

          {/* Animated Countdown Progress Bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full mt-2.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 ease-linear rounded-full ${
                timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 6 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ===================================================================
            BUZZER LOCKOUT BANNER
            =================================================================== */}
        {buzzedTeam ? (
          <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 p-2.5 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.8)] border-2 border-white flex items-center justify-between px-4 animate-bounce mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <span className="font-jeopardy-display text-lg sm:text-xl text-black font-extrabold uppercase tracking-wider">
                {buzzedTeam.avatar || '⚡'} {buzzedTeam.name} BUZZED IN!
              </span>
            </div>
            {role === 'host' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCorrect(buzzedTeam.id)}
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                >
                  Correct (+${clue.value})
                </button>
                <button
                  type="button"
                  onClick={() => handleWrong(buzzedTeam.id)}
                  className="px-3 py-1 bg-black/80 hover:bg-black text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                >
                  Wrong (-${clue.value})
                </button>
                <button
                  type="button"
                  onClick={handleClearBuzzer}
                  className="text-xs bg-white/20 hover:bg-white/40 text-black px-2 py-1 rounded font-semibold cursor-pointer"
                  title="Cancel buzzer and resume"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Buzzer Prompt Bar */
          <div className="flex items-center justify-center gap-2 py-1 flex-wrap">
            <span className="text-[11px] text-amber-300/80 font-bold uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> Buzzers Active:
            </span>
            {teams.map((t, idx) => {
              const isLocked = lockedOutTeamIds.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => triggerBuzzIn(t.id)}
                  title={`Buzz in for ${t.name} (Key: ${idx + 1})`}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    isLocked
                      ? 'bg-slate-900 text-slate-600 border-slate-800 opacity-40 cursor-not-allowed'
                      : 'bg-amber-500/10 hover:bg-amber-500/30 text-[#ffcc00] border-[#ffcc00]/50 hover:scale-105'
                  }`}
                >
                  <span className="mr-1">{t.avatar || '⚡'}</span>
                  <span>{t.name}</span>
                  <span className="text-[10px] text-slate-400 ml-1">[{idx + 1}]</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ===================================================================
            CONTENT AREA: Image Container & Clue Prompt
            =================================================================== */}
        <div className="flex flex-col items-center justify-center text-center my-auto py-2 sm:py-3 gap-3">
          {clue.image && (
            <div className="relative max-w-md w-full max-h-52 sm:max-h-60 rounded-xl overflow-hidden border-2 border-[#ffcc00] shadow-xl bg-[#02052c] flex items-center justify-center mx-auto">
              {!imgError ? (
                <img
                  src={clue.image}
                  alt="Visual Clue"
                  onError={() => {
                    if (clue.fallbackImage && !imgError) {
                      const target = event?.target as HTMLImageElement;
                      if (target) target.src = clue.fallbackImage;
                      setImgError(true);
                    } else {
                      setImgError(true);
                    }
                  }}
                  className="w-full h-full object-cover max-h-52 sm:max-h-60"
                />
              ) : (
                <div className="p-4 text-center text-slate-300 flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-8 h-8 text-[#ffcc00] opacity-80" />
                  <span className="text-xs font-semibold text-slate-400">Visual Clue</span>
                </div>
              )}
            </div>
          )}

          {/* Clue Prompt Text */}
          <div className="font-jeopardy-serif text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-relaxed sm:leading-relaxed max-w-3xl drop-shadow-lg px-2">
            {clue.clue}
          </div>

          {/* Public Answer Reveal Box (Visible on both TV and Host when revealed) */}
          {isAnswerRevealed && (
            <div className="w-full max-w-2xl bg-black/85 border-2 border-emerald-400 rounded-xl p-3 sm:p-4 mt-1 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase block mb-0.5">
                📢 Revealed to All Players
              </span>
              <div className="font-jeopardy-serif text-white text-xl sm:text-2xl md:text-3xl font-bold">
                {clue.answer}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            HOST CONTROLS PANEL (STRICTLY HIDDEN ON TV DISPLAY SCREEN!)
            =================================================================== */}
        {role === 'host' ? (
          <div className="bg-[#02052c]/95 border-2 border-[#ffcc00]/50 rounded-xl p-3 sm:p-4 mt-2 flex flex-col gap-2.5 shadow-xl">
            {/* Host Private Answer Key Box */}
            <div className="bg-[#01041f] border border-amber-500/60 rounded-xl p-2.5 px-3 flex items-center justify-between gap-3">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Lock className="w-3.5 h-3.5 text-[#ffcc00]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Host Answer Key (Private · TV Cannot See This):
                  </span>
                </div>
                {showHostPrivateAnswer ? (
                  <div className="font-jeopardy-serif text-lg sm:text-xl font-bold text-emerald-300 pl-5">
                    {clue.answer}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic pl-5">Answer hidden to prevent peeking</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowHostPrivateAnswer(!showHostPrivateAnswer)}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
              >
                {showHostPrivateAnswer ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> 👁️ Peek
                  </>
                )}
              </button>
            </div>

            {/* Main Host Action Buttons */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 flex-wrap gap-2">
              <span className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Host Actions
              </span>
              <div className="flex gap-2">
                {!isAnswerRevealed ? (
                  <button
                    type="button"
                    onClick={handleRevealOnTv}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                    title="Pushes the correct answer to the TV screen for everyone to see"
                  >
                    <Tv className="w-4 h-4 text-cyan-200" />
                    <span>📢 Reveal Answer on TV</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleHostCloseClue}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Done / Close Clue on TV
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleHostCloseClue}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Skip (No Points)
                </button>
              </div>
            </div>

            {/* Quick Team Scoring Award buttons */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
              <span className="text-xs text-slate-400 font-medium mr-1">Award/Deduct ${clue.value}:</span>
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="inline-flex items-center rounded-lg overflow-hidden border border-slate-700 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleCorrect(team.id)}
                    title={`Award $${clue.value} to ${team.name} and reveal on TV`}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="max-w-[90px] truncate">
                      {team.avatar || ''} {team.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWrong(team.id)}
                    title={`Deduct $${clue.value} from ${team.name}`}
                    className="px-2 py-1.5 bg-red-800 hover:bg-red-700 text-white text-xs font-bold border-l border-red-900 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TV Display Footer Info */
          <div className="bg-[#02052c]/80 border border-cyan-500/40 rounded-xl p-2.5 text-center text-xs text-cyan-300 flex items-center justify-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            <span>TV Display Screen · Controlled Remotely by Host Laptop</span>
          </div>
        )}
      </div>
    </div>
  );
};
