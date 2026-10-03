import React, { useState, useEffect } from 'react';
import { ClueItem } from '../data/animeJeopardyData';
import { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
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
  Lock
} from 'lucide-react';

interface ClueModalProps {
  clue: ClueItem;
  categoryTitle: string;
  teams: Team[];
  onAwardScore: (teamId: number, delta: number) => void;
  onClose: () => void;
}

export const ClueModal: React.FC<ClueModalProps> = ({
  clue,
  categoryTitle,
  teams,
  onAwardScore,
  onClose
}) => {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showHostPrivateAnswer, setShowHostPrivateAnswer] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Timer State
  const initialDuration = 15; // standard 15-second response window
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isThinkMusicActive, setIsThinkMusicActive] = useState<boolean>(false);

  // Clean up audio & timer on unmount
  useEffect(() => {
    return () => {
      soundFx.stopThinkMusic();
    };
  }, []);

  // Timer interval countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time is up!
            soundFx.stopThinkMusic();
            soundFx.playTripleBuzz();
            setIsTimerRunning(false);
            setIsThinkMusicActive(false);
            return 0;
          }
          // Tick sound in the final 5 seconds
          if (prev <= 6) {
            soundFx.playTimerTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  // Toggle Timer
  const handleToggleTimer = () => {
    soundFx.initCtx();
    if (!isTimerRunning) {
      if (timeLeft === 0) {
        setTimeLeft(initialDuration);
      }
      setIsTimerRunning(true);
      if (isThinkMusicActive) {
        soundFx.playThinkMusic();
      }
    } else {
      setIsTimerRunning(false);
      soundFx.stopThinkMusic();
    }
  };

  // Reset Timer
  const handleResetTimer = (seconds = initialDuration) => {
    soundFx.stopThinkMusic();
    setIsTimerRunning(false);
    setTimeLeft(seconds);
    setIsThinkMusicActive(false);
  };

  // Add 5 seconds to timer
  const handleAddFiveSeconds = () => {
    setTimeLeft((prev) => prev + 5);
  };

  // Toggle Jeopardy Think Music
  const handleToggleThinkMusic = () => {
    soundFx.initCtx();
    if (isThinkMusicActive) {
      soundFx.stopThinkMusic();
      setIsThinkMusicActive(false);
    } else {
      setIsThinkMusicActive(true);
      if (!isTimerRunning) {
        setIsTimerRunning(true);
      }
      soundFx.playThinkMusic();
    }
  };

  const handleReveal = () => {
    soundFx.stopThinkMusic();
    setIsTimerRunning(false);
    setIsAnswerRevealed(true);
    soundFx.playCorrect();
  };

  const handleCorrect = (teamId: number) => {
    soundFx.stopThinkMusic();
    setIsTimerRunning(false);
    onAwardScore(teamId, clue.value);
    soundFx.playCorrect();
    setIsAnswerRevealed(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleWrong = (teamId: number) => {
    onAwardScore(teamId, -clue.value);
    soundFx.playWrong();
  };

  // Percentage for countdown progress bar
  const progressPercent = Math.min(100, Math.max(0, (timeLeft / initialDuration) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#0b15c9] via-[#04097a] to-[#020536] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-4 sm:p-7 shadow-2xl flex flex-col justify-between max-h-[94vh] overflow-y-auto">
        {/* ===================================================================
            TOP BAR: Category, Value, and Visible Jeopardy Timer
            =================================================================== */}
        <div className="border-b-2 border-[#ffcc00]/40 pb-3 mb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-jeopardy-display text-[#ffcc00] text-base sm:text-xl md:text-2xl uppercase tracking-wider">
              {categoryTitle}
            </div>

            {/* LIVE COUNTDOWN TIMER CONTROLS */}
            <div className="flex items-center gap-2 bg-[#02052c] border border-amber-500/50 rounded-xl px-3 py-1.5 shadow-md">
              <Clock className={`w-4 h-4 ${timeLeft <= 3 && timeLeft > 0 ? 'text-red-400 animate-pulse' : 'text-[#ffcc00]'}`} />
              
              <span className={`font-jeopardy-display text-lg sm:text-xl tabular-nums font-bold ${
                timeLeft === 0 
                  ? 'text-red-500 animate-bounce' 
                  : timeLeft <= 5 
                    ? 'text-amber-400' 
                    : 'text-white'
              }`}>
                {timeLeft === 0 ? "TIME'S UP!" : `${timeLeft}s`}
              </span>

              {/* Start / Pause */}
              <button
                type="button"
                onClick={handleToggleTimer}
                title={isTimerRunning ? "Pause Timer" : "Start Countdown"}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-500 text-[#030852]'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              {/* Think Music Toggle */}
              <button
                type="button"
                onClick={handleToggleThinkMusic}
                title={isThinkMusicActive ? "Mute Think Music" : "Play Iconic Jeopardy Theme"}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isThinkMusicActive
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
              </button>

              {/* +5s button */}
              <button
                type="button"
                onClick={handleAddFiveSeconds}
                title="Add 5 seconds"
                className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />5s
              </button>

              {/* Reset Timer */}
              <button
                type="button"
                onClick={() => handleResetTimer(15)}
                title="Reset timer to 15 seconds"
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <div className="font-jeopardy-display text-white text-xl sm:text-3xl tracking-wider">
              ${clue.value}
            </div>
          </div>

          {/* Animated Countdown Progress Bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full mt-2.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                timeLeft <= 3 
                  ? 'bg-red-500' 
                  : timeLeft <= 6 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ===================================================================
            CONTENT AREA: Image Container & Clue Prompt
            =================================================================== */}
        <div className="flex flex-col items-center justify-center text-center my-auto py-2 sm:py-3 gap-3">
          {clue.image && (
            <div className="relative max-w-md w-full max-h-52 sm:max-h-60 rounded-xl overflow-hidden border-2 border-[#ffcc00] shadow-xl bg-[#02052c] flex items-center justify-center mx-auto">
              {!imgError ? (
                <img
                  src={clue.image}
                  alt={clue.imageAlt || 'Anime Clue'}
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
                  <span className="text-xs font-semibold text-white">Local Image: {clue.image}</span>
                  <span className="text-[11px] text-slate-400">
                    Drop file into Pi <code className="bg-black/50 px-1 py-0.5 rounded">./images</code> folder
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Clue Prompt Text */}
          <div className="font-jeopardy-serif text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-relaxed sm:leading-relaxed max-w-3xl drop-shadow-lg px-2">
            {clue.clue}
          </div>

          {/* Public Answer Reveal Box (Shown to all players on TV when revealed) */}
          {isAnswerRevealed && (
            <div className="w-full max-w-2xl bg-black/85 border-2 border-emerald-400 rounded-xl p-3 sm:p-4 mt-1 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase block mb-0.5">
                📢 Revealed to Players
              </span>
              <div className="font-jeopardy-serif text-white text-xl sm:text-2xl md:text-3xl font-bold">
                {clue.answer}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            HOST CONTROLS PANEL (Includes Private Host Answer Key)
            =================================================================== */}
        <div className="bg-[#02052c]/95 border-2 border-[#ffcc00]/40 rounded-xl p-3 sm:p-4 mt-3 flex flex-col gap-2.5 shadow-xl">
          {/* HOST PRIVATE ANSWER KEY (Host Eyes Only) */}
          <div className="bg-[#01041f] border border-amber-500/50 rounded-xl p-2.5 px-3 flex items-center justify-between gap-3">
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Lock className="w-3.5 h-3.5 text-[#ffcc00]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Host Answer Key (Private · For Judging):
                </span>
                <span className="text-[10px] text-slate-400">
                  {showHostPrivateAnswer ? '(Only Host Can See)' : '(Hidden)'}
                </span>
              </div>
              {showHostPrivateAnswer ? (
                <div className="font-jeopardy-serif text-base sm:text-lg font-bold text-emerald-300 pl-5">
                  {clue.answer}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic pl-5">
                  Answer hidden to prevent players from peeking at the host's screen
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowHostPrivateAnswer(!showHostPrivateAnswer)}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
            >
              {showHostPrivateAnswer ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide Peek
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> 👁️ Peek Answer
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 flex-wrap gap-2">
            <span className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider">
              Host Actions
            </span>
            <div className="flex gap-2">
              {!isAnswerRevealed ? (
                <button
                  type="button"
                  onClick={handleReveal}
                  className="px-4 py-2 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reveals the big answer box to all players on TV"
                >
                  <Eye className="w-4 h-4" /> Reveal Answer to Players (TV)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Done / Close Clue
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
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
                  title={`Award $${clue.value} to ${team.name}`}
                  className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="max-w-[90px] truncate">{team.name}</span>
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
      </div>
    </div>
  );
};
