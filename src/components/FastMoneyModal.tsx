import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FastMoneyItem } from '../data/familyFeudData';
import { soundFx } from '../utils/audioSynth';
import { gameSync, ScreenRole } from '../utils/gameSync';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Check, 
  X, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  FastForward,
  AlertTriangle,
  ArrowRight,
  Eye,
  Award,
  Crown
} from 'lucide-react';

interface FastMoneyModalProps {
  questions: FastMoneyItem[];
  teamName: string;
  role?: ScreenRole;
  onClose: () => void;
  onAwardPoints: (points: number) => void;
}

type FastMoneyStage = 'PLAYER1' | 'PLAYER2' | 'REVEAL' | 'RESULTS';

interface PlayerAnswer {
  text: string;
  points: number;
  passed: boolean;
}

export const FastMoneyModal: React.FC<FastMoneyModalProps> = ({
  questions,
  teamName,
  role = 'host',
  onClose,
  onAwardPoints,
}) => {
  const [stage, setStage] = useState<FastMoneyStage>('PLAYER1');
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(20);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Player 1 and Player 2 answers
  const [player1Answers, setPlayer1Answers] = useState<PlayerAnswer[]>(
    questions.map(() => ({ text: '', points: 0, passed: false }))
  );
  const [player2Answers, setPlayer2Answers] = useState<PlayerAnswer[]>(
    questions.map(() => ({ text: '', points: 0, passed: false }))
  );

  // Revealed states for scoring phase
  const [revealedPlayer1, setRevealedPlayer1] = useState<boolean[]>(questions.map(() => false));
  const [revealedPlayer2, setRevealedPlayer2] = useState<boolean[]>(questions.map(() => false));

  // Duplicate warning notification
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Custom text input for host typing
  const [customInputText, setCustomInputText] = useState<string>('');
  const [customInputPoints, setCustomInputPoints] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate current revealed total
  const totalRevealedPoints =
    player1Answers.reduce((sum, a, idx) => sum + (revealedPlayer1[idx] ? a.points : 0), 0) +
    player2Answers.reduce((sum, a, idx) => sum + (revealedPlayer2[idx] ? a.points : 0), 0);

  // Calculate potential full total (all answers combined)
  const fullPotentialPoints =
    player1Answers.reduce((sum, a) => sum + a.points, 0) +
    player2Answers.reduce((sum, a) => sum + a.points, 0);

  // Helper to normalize and check for duplicate answers
  const isDuplicate = useCallback((p1Text: string, p2Text: string): boolean => {
    if (!p1Text || !p2Text) return false;
    const clean1 = p1Text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const clean2 = p2Text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (!clean1 || !clean2) return false;
    if (clean1 === clean2) return true;
    // Allow slight substrings only if long enough (e.g. "dragon ball" vs "dragon ball z")
    if (clean1.length > 4 && clean2.length > 4 && (clean1.includes(clean2) || clean2.includes(clean1))) {
      return true;
    }
    return false;
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            soundFx.playWrong();
            setIsTimerRunning(false);
            gameSync.broadcast({ type: 'FAST_MONEY_TIMER', isRunning: false, timerSeconds: 0 });
            return 0;
          }
          soundFx.playFeudTick();
          const nextSec = prev - 1;
          gameSync.broadcast({ type: 'FAST_MONEY_TIMER', isRunning: true, timerSeconds: nextSec });
          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  // Subscribe to real-time multi-device sync
  useEffect(() => {
    const unsubscribe = gameSync.subscribe((action) => {
      switch (action.type) {
        case 'FAST_MONEY_SET_PLAYER':
          setActivePlayer(action.player);
          setStage(action.player === 1 ? 'PLAYER1' : 'PLAYER2');
          setTimerSeconds(action.timerSeconds);
          setIsTimerRunning(false);
          setActiveQIndex(0);
          setDuplicateWarning(null);
          break;

        case 'FAST_MONEY_TIMER':
          setIsTimerRunning(action.isRunning);
          setTimerSeconds(action.timerSeconds);
          break;

        case 'FAST_MONEY_SET_ACTIVE_Q':
          setActiveQIndex(action.qIndex);
          break;

        case 'FAST_MONEY_SET_ANSWER': {
          const { player, qIndex, text, points } = action;
          if (player === 1) {
            setPlayer1Answers((prev) => {
              const copy = [...prev];
              copy[qIndex] = { text, points, passed: false };
              return copy;
            });
          } else {
            setPlayer2Answers((prev) => {
              const copy = [...prev];
              copy[qIndex] = { text, points, passed: false };
              return copy;
            });
          }
          break;
        }

        case 'FAST_MONEY_REVEAL_ANSWER': {
          const { player, qIndex, points } = action;
          if (player === 1) {
            setRevealedPlayer1((prev) => {
              const copy = [...prev];
              copy[qIndex] = true;
              return copy;
            });
          } else {
            setRevealedPlayer2((prev) => {
              const copy = [...prev];
              copy[qIndex] = true;
              return copy;
            });
          }
          if (points > 0) {
            soundFx.playFeudReveal();
          } else {
            soundFx.playFeudStrike();
          }
          break;
        }

        case 'FAST_MONEY_SET_STAGE':
          setStage(action.stage);
          if (action.stage === 'REVEAL') {
            soundFx.playFeudWin();
          } else if (action.stage === 'RESULTS') {
            soundFx.playFanfare();
          }
          break;

        case 'FAST_MONEY_SYNC_STATE': {
          const s = action.state;
          if (s) {
            if (s.stage) setStage(s.stage);
            if (s.activePlayer) setActivePlayer(s.activePlayer);
            if (s.activeQIndex !== undefined) setActiveQIndex(s.activeQIndex);
            if (s.timerSeconds !== undefined) setTimerSeconds(s.timerSeconds);
            if (s.isTimerRunning !== undefined) setIsTimerRunning(s.isTimerRunning);
            if (s.player1Answers) setPlayer1Answers(s.player1Answers);
            if (s.player2Answers) setPlayer2Answers(s.player2Answers);
            if (s.revealedPlayer1) setRevealedPlayer1(s.revealedPlayer1);
            if (s.revealedPlayer2) setRevealedPlayer2(s.revealedPlayer2);
          }
          break;
        }

        case 'SYNC_FULL_STATE': {
          const s = action.state;
          if (s && s.fastMoneyState) {
            const fms = s.fastMoneyState;
            if (fms.stage) setStage(fms.stage);
            if (fms.activePlayer) setActivePlayer(fms.activePlayer);
            if (fms.activeQIndex !== undefined) setActiveQIndex(fms.activeQIndex);
            if (fms.timerSeconds !== undefined) setTimerSeconds(fms.timerSeconds);
            if (fms.isTimerRunning !== undefined) setIsTimerRunning(fms.isTimerRunning);
            if (fms.player1Answers && fms.player1Answers.length > 0) setPlayer1Answers(fms.player1Answers);
            if (fms.player2Answers && fms.player2Answers.length > 0) setPlayer2Answers(fms.player2Answers);
            if (fms.revealedPlayer1 && fms.revealedPlayer1.length > 0) setRevealedPlayer1(fms.revealedPlayer1);
            if (fms.revealedPlayer2 && fms.revealedPlayer2.length > 0) setRevealedPlayer2(fms.revealedPlayer2);
          }
          break;
        }

        case 'REQUEST_STATE': {
          if (role === 'host') {
            gameSync.broadcast({
              type: 'FAST_MONEY_SYNC_STATE',
              state: {
                stage,
                activePlayer,
                activeQIndex,
                timerSeconds,
                isTimerRunning,
                player1Answers,
                player2Answers,
                revealedPlayer1,
                revealedPlayer2,
              }
            });
          }
          break;
        }

        case 'FAST_MONEY_DUPLICATE_TRIGGER':
          soundFx.playDuplicateBuzzer();
          setDuplicateWarning(`DUPLICATE ANSWER! "${action.text}" was already given by Player 1. Name another!`);
          setTimeout(() => setDuplicateWarning(null), 3000);
          break;

        case 'FAST_MONEY_WIN':
          soundFx.playFanfare();
          setStage('RESULTS');
          break;

        case 'FAST_MONEY_CLOSE':
          onClose();
          break;
      }
    });

    return () => unsubscribe();
  }, [role, stage, activePlayer, activeQIndex, timerSeconds, isTimerRunning, player1Answers, player2Answers, revealedPlayer1, revealedPlayer2, onClose]);

  // Host broadcasts current Fast Money state when opening
  useEffect(() => {
    if (role === 'host') {
      gameSync.broadcast({
        type: 'FAST_MONEY_SYNC_STATE',
        state: {
          stage,
          activePlayer,
          activeQIndex,
          timerSeconds,
          isTimerRunning,
          player1Answers,
          player2Answers,
          revealedPlayer1,
          revealedPlayer2,
        }
      });
    }
  }, [role]);

  // Find next question to focus on (supporting the Pass/Loopback rule)
  const getNextQuestionIndex = (currentIdx: number, pAnswers: PlayerAnswer[]): number => {
    // 1. Try subsequent unanswered or passed questions after currentIdx
    for (let i = currentIdx + 1; i < questions.length; i++) {
      if (!pAnswers[i].text) return i;
    }
    // 2. Loop back to any passed/unanswered questions before currentIdx
    for (let i = 0; i < questions.length; i++) {
      if (!pAnswers[i].text) return i;
    }
    // All answered!
    return currentIdx;
  };

  // Record an answer for the active player
  const handleRecordAnswer = (text: string, points: number) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    // Check duplicate answer rule for Player 2
    if (activePlayer === 2) {
      const p1Answer = player1Answers[activeQIndex]?.text;
      if (isDuplicate(p1Answer, cleanText)) {
        soundFx.playDuplicateBuzzer();
        setDuplicateWarning(`DUPLICATE! "${cleanText}" was already said by Player 1! Name another!`);
        gameSync.broadcast({
          type: 'FAST_MONEY_DUPLICATE_TRIGGER',
          qIndex: activeQIndex,
          text: cleanText,
        });
        setTimeout(() => setDuplicateWarning(null), 3200);
        return; // Reject answer, contestant must try again!
      }
    }

    setDuplicateWarning(null);

    // Save answer
    if (activePlayer === 1) {
      const copy = [...player1Answers];
      copy[activeQIndex] = { text: cleanText, points, passed: false };
      setPlayer1Answers(copy);
      gameSync.broadcast({
        type: 'FAST_MONEY_SET_ANSWER',
        player: 1,
        qIndex: activeQIndex,
        text: cleanText,
        points,
      });

      // Advance to next question
      const nextIdx = getNextQuestionIndex(activeQIndex, copy);
      setActiveQIndex(nextIdx);
      gameSync.broadcast({ type: 'FAST_MONEY_SET_ACTIVE_Q', qIndex: nextIdx });
    } else {
      const copy = [...player2Answers];
      copy[activeQIndex] = { text: cleanText, points, passed: false };
      setPlayer2Answers(copy);
      gameSync.broadcast({
        type: 'FAST_MONEY_SET_ANSWER',
        player: 2,
        qIndex: activeQIndex,
        text: cleanText,
        points,
      });

      // Advance to next question
      const nextIdx = getNextQuestionIndex(activeQIndex, copy);
      setActiveQIndex(nextIdx);
      gameSync.broadcast({ type: 'FAST_MONEY_SET_ACTIVE_Q', qIndex: nextIdx });
    }

    // Reset custom inputs
    setCustomInputText('');
    setCustomInputPoints(0);
  };

  // Handle PASS on a hard question (Iconic Steve Harvey Pass rule)
  const handlePass = () => {
    soundFx.playTone(440, 0.06, 'triangle', 0.2);
    const answersList = activePlayer === 1 ? player1Answers : player2Answers;

    // Advance to next unanswered question or loop back
    const nextIdx = getNextQuestionIndex(activeQIndex, answersList);
    setActiveQIndex(nextIdx);
    gameSync.broadcast({ type: 'FAST_MONEY_SET_ACTIVE_Q', qIndex: nextIdx });
  };

  // Switch between Player 1 and Player 2 setup
  const handleSelectStage = (newStage: FastMoneyStage) => {
    setStage(newStage);
    setIsTimerRunning(false);
    setDuplicateWarning(null);

    if (newStage === 'PLAYER1') {
      setActivePlayer(1);
      setTimerSeconds(20);
      setActiveQIndex(0);
      gameSync.broadcast({ type: 'FAST_MONEY_SET_PLAYER', player: 1, timerSeconds: 20 });
    } else if (newStage === 'PLAYER2') {
      setActivePlayer(2);
      setTimerSeconds(25);
      setActiveQIndex(0);
      gameSync.broadcast({ type: 'FAST_MONEY_SET_PLAYER', player: 2, timerSeconds: 25 });
    } else if (newStage === 'REVEAL') {
      soundFx.playFeudWin();
      gameSync.broadcast({ type: 'FAST_MONEY_SET_STAGE', stage: 'REVEAL' });
    } else if (newStage === 'RESULTS') {
      soundFx.playFanfare();
      gameSync.broadcast({ type: 'FAST_MONEY_SET_STAGE', stage: 'RESULTS' });
    }
  };

  // Toggle or start timer
  const handleToggleTimer = () => {
    const nextRunning = !isTimerRunning;
    setIsTimerRunning(nextRunning);
    gameSync.broadcast({
      type: 'FAST_MONEY_TIMER',
      isRunning: nextRunning,
      timerSeconds,
    });
  };

  // Reset timer
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    const defaultSec = activePlayer === 1 ? 20 : 25;
    setTimerSeconds(defaultSec);
    gameSync.broadcast({
      type: 'FAST_MONEY_TIMER',
      isRunning: false,
      timerSeconds: defaultSec,
    });
  };

  // Reveal answer in Scoring Phase
  const handleRevealAnswer = (player: 1 | 2, index: number, pts: number) => {
    if (player === 1) {
      setRevealedPlayer1((prev) => {
        const copy = [...prev];
        copy[index] = true;
        return copy;
      });
    } else {
      setRevealedPlayer2((prev) => {
        const copy = [...prev];
        copy[index] = true;
        return copy;
      });
    }

    if (pts > 0) {
      soundFx.playFeudReveal();
    } else {
      soundFx.playFeudStrike();
    }

    gameSync.broadcast({
      type: 'FAST_MONEY_REVEAL_ANSWER',
      player,
      qIndex: index,
      points: pts,
    });

    // Check if total reached 200 after this reveal
    const nextTotal =
      player1Answers.reduce((sum, a, idx) => sum + (idx === index && player === 1 ? a.points : revealedPlayer1[idx] ? a.points : 0), 0) +
      player2Answers.reduce((sum, a, idx) => sum + (idx === index && player === 2 ? a.points : revealedPlayer2[idx] ? a.points : 0), 0);

    if (nextTotal >= 200) {
      soundFx.playFanfare();
      setStage('RESULTS');
      gameSync.broadcast({ type: 'FAST_MONEY_WIN', totalPoints: nextTotal });
    }
  };

  // Reveal all answers at once
  const handleRevealAll = () => {
    soundFx.playFeudReveal();
    setRevealedPlayer1(questions.map(() => true));
    setRevealedPlayer2(questions.map(() => true));

    questions.forEach((_, idx) => {
      gameSync.broadcast({
        type: 'FAST_MONEY_REVEAL_ANSWER',
        player: 1,
        qIndex: idx,
        points: player1Answers[idx].points,
      });
      gameSync.broadcast({
        type: 'FAST_MONEY_REVEAL_ANSWER',
        player: 2,
        qIndex: idx,
        points: player2Answers[idx].points,
      });
    });

    if (fullPotentialPoints >= 200) {
      soundFx.playFanfare();
      setStage('RESULTS');
      gameSync.broadcast({ type: 'FAST_MONEY_WIN', totalPoints: fullPotentialPoints });
    }
  };

  const currentQ = questions[activeQIndex] || questions[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#02072e] border-4 border-[#ffcc00] rounded-2xl w-full max-w-5xl shadow-[0_0_50px_rgba(255,204,0,0.3)] overflow-hidden flex flex-col max-h-[96vh]">
        {/* =====================================================================
            1. TOP MARQUEE: Authentic Television Banner & Stage Indicator
            ===================================================================== */}
        <div className="bg-gradient-to-r from-amber-600 via-[#ffcc00] to-amber-600 p-2.5 sm:p-3.5 text-[#02052c] font-black tracking-widest relative shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-xl">🌟</span>
              <h1 className="font-jeopardy-display text-base sm:text-2xl uppercase tracking-wider text-[#02052c] drop-shadow-sm">
                FAST MONEY GRAND PRIZE ($20,000)
              </h1>
              <span className="hidden sm:inline bg-[#02052c] text-[#ffcc00] text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                {teamName}
              </span>
            </div>

            {/* Stage Selector / Status Indicator */}
            <div className="flex items-center gap-1.5">
              {role === 'host' ? (
                <div className="flex items-center bg-[#02052c] p-1 rounded-xl border border-amber-400/40">
                  <button
                    type="button"
                    onClick={() => handleSelectStage('PLAYER1')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stage === 'PLAYER1' ? 'bg-[#ffcc00] text-[#02052c] shadow' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1️⃣ Player 1 (20s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectStage('PLAYER2')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stage === 'PLAYER2' ? 'bg-[#ffcc00] text-[#02052c] shadow' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    2️⃣ Player 2 (25s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectStage('REVEAL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stage === 'REVEAL' ? 'bg-emerald-500 text-white shadow' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🔍 Reveal Scores
                  </button>
                </div>
              ) : (
                <span className="bg-[#02052c] text-[#ffcc00] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#ffcc00]/40">
                  {stage === 'PLAYER1' && '🎙️ Player 1 Turn (20s)'}
                  {stage === 'PLAYER2' && '🎙️ Player 2 Turn (25s)'}
                  {stage === 'REVEAL' && '🎯 Reveal & Point Tally'}
                  {stage === 'RESULTS' && '🏆 Grand Prize Winner!'}
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#02052c] text-[#ffcc00] flex items-center justify-center hover:scale-105 cursor-pointer ml-1"
                title="Close Fast Money"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            2. 200 POINT THERMOMETER & COUNTDOWN TIMER BAR
            ===================================================================== */}
        <div className="bg-[#010421] border-b-2 border-amber-500/40 p-3 sm:p-4 grid grid-cols-12 gap-3 items-center">
          {/* TIMER ZONE (20s or 25s) */}
          <div className="col-span-12 sm:col-span-5 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/80 border-2 border-amber-500/80 px-3.5 py-1.5 rounded-xl shadow-inner">
              <Clock className={`w-5 h-5 ${timerSeconds <= 5 ? 'text-red-400 animate-bounce' : 'text-[#ffcc00]'}`} />
              <span className={`font-mono text-3xl sm:text-4xl font-black tracking-widest ${
                timerSeconds <= 5 ? 'text-red-400 animate-pulse' : 'text-[#ffcc00]'
              }`}>
                {timerSeconds.toString().padStart(2, '0')}s
              </span>
            </div>

            {role === 'host' && (stage === 'PLAYER1' || stage === 'PLAYER2') && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition-transform hover:scale-105 ${
                    isTimerRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="hidden lg:block text-left text-[11px] text-slate-400 leading-tight">
              {stage === 'PLAYER1' && <span>Player 1: <strong>20 Seconds</strong>. Can Pass & return.</span>}
              {stage === 'PLAYER2' && <span>Player 2: <strong>25 Seconds</strong>. Cannot duplicate P1!</span>}
              {stage === 'REVEAL' && <span>Host reveals points slat by slat.</span>}
            </div>
          </div>

          {/* 200 POINT GOAL THERMOMETER */}
          <div className="col-span-12 sm:col-span-7 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-amber-300 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#ffcc00]" />
                <span>GRAND PRIZE GOAL: 200 POINTS</span>
              </span>
              <span className={`font-mono text-sm font-black ${
                totalRevealedPoints >= 200 ? 'text-emerald-400' : 'text-[#ffcc00]'
              }`}>
                {totalRevealedPoints} / 200 PTS ({Math.min(100, Math.round((totalRevealedPoints / 200) * 100))}%)
              </span>
            </div>

            {/* Glowing Progress Thermometer */}
            <div className="w-full h-4 sm:h-5 bg-black/80 rounded-full border border-amber-500/50 p-0.5 overflow-hidden shadow-inner relative">
              <div
                className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5 ${
                  totalRevealedPoints >= 200
                    ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-[#ffcc00] shadow-[0_0_20px_rgba(74,222,128,0.9)] animate-pulse'
                    : 'bg-gradient-to-r from-red-600 via-amber-500 to-[#ffcc00]'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, (totalRevealedPoints / 200) * 100))}%` }}
              >
                {totalRevealedPoints >= 200 && (
                  <span className="text-[10px] font-black text-[#02052c] uppercase animate-bounce">
                    $20,000 WON!
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>0 PTS</span>
              {totalRevealedPoints >= 200 ? (
                <span className="text-emerald-400 font-bold">🎉 WINNER! $20,000 CASH SECURED!</span>
              ) : (
                <span>{200 - totalRevealedPoints} PTS needed to win $20,000</span>
              )}
              <span>200 PTS</span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            3. DUPLICATE ANSWER ALERT BANNER (Flashing Double-Buzz Notification)
            ===================================================================== */}
        {duplicateWarning && (
          <div className="bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 animate-bounce border-y-2 border-white shadow-xl">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {/* =====================================================================
            4. ACTIVE QUESTION SPOTLIGHT (Steve Harvey Reading Card)
            ===================================================================== */}
        {(stage === 'PLAYER1' || stage === 'PLAYER2') && (
          <div className="bg-gradient-to-r from-[#031569] via-[#082094] to-[#031569] border-y-2 border-[#ffcc00] px-4 py-3 sm:py-4 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black tracking-widest text-[#ffcc00] uppercase flex items-center gap-1.5">
                <span>QUESTION {activeQIndex + 1} OF {questions.length}</span>
                {stage === 'PLAYER1' ? (
                  <span className="text-slate-300 font-normal">· Player 1 (20s)</span>
                ) : (
                  <span className="text-amber-300 font-normal">· Player 2 (25s) — No Duplicates!</span>
                )}
              </span>

              {/* Pass Button for Host or Player */}
              {role === 'host' && (
                <button
                  type="button"
                  onClick={handlePass}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-[#02052c] font-black text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer flex items-center gap-1 transition-transform hover:scale-105"
                  title="Contestant passes to come back later"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Pass (Skip)</span>
                </button>
              )}
            </div>

            <h2 className="font-jeopardy-serif text-base sm:text-xl md:text-2xl font-bold text-white tracking-wide">
              "{currentQ.question}"
            </h2>
          </div>
        )}

        {/* =====================================================================
            5. THE DUAL-COLUMN FAST MONEY BOARD (Player 1 vs Player 2)
            ===================================================================== */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-[#02052c]">
          <div className="grid grid-cols-12 gap-2 text-xs font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
            <div className="col-span-12 sm:col-span-6 flex items-center justify-between">
              <span className="text-amber-300 flex items-center gap-1">
                <span>👤 Player 1 Answers</span>
                <span className="text-[10px] text-slate-400 font-normal">(20 Sec)</span>
              </span>
              <span className="text-amber-300">Points</span>
            </div>
            <div className="hidden sm:flex col-span-6 items-center justify-between">
              <span className="text-cyan-300 flex items-center gap-1">
                <span>👤 Player 2 Answers</span>
                <span className="text-[10px] text-slate-400 font-normal">(25 Sec)</span>
              </span>
              <span className="text-cyan-300">Points</span>
            </div>
          </div>

          {questions.map((q, idx) => {
            const p1 = player1Answers[idx];
            const p2 = player2Answers[idx];
            const isP1Revealed = revealedPlayer1[idx];
            const isP2Revealed = revealedPlayer2[idx];
            const isActiveQ = (stage === 'PLAYER1' || stage === 'PLAYER2') && activeQIndex === idx;

            // During Player 2's turn, Player 1's answers are turned away (blind slats) on the TV screen
            const hideP1OnTv = stage === 'PLAYER2' && role === 'tv';

            return (
              <div
                key={q.id || idx}
                className={`rounded-xl border-2 transition-all p-2 sm:p-2.5 ${
                  isActiveQ
                    ? 'bg-[#061559] border-[#ffcc00] shadow-[0_0_20px_rgba(255,204,0,0.3)] ring-2 ring-[#ffcc00]/50'
                    : 'bg-black/40 border-slate-700/80'
                }`}
              >
                {/* Question Prompt Label */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-[#ffcc00] text-[#02052c] font-black text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{q.question}</span>
                  </div>

                  {role === 'host' && (stage === 'PLAYER1' || stage === 'PLAYER2') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQIndex(idx);
                        gameSync.broadcast({ type: 'FAST_MONEY_SET_ACTIVE_Q', qIndex: idx });
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        activeQIndex === idx
                          ? 'bg-[#ffcc00] text-[#02052c]'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {activeQIndex === idx ? 'Asking' : 'Select'}
                    </button>
                  )}
                </div>

                {/* Slat Row: Player 1 Slat (Left) & Player 2 Slat (Right) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* PLAYER 1 SLAT */}
                  <div className={`rounded-lg border p-2 flex items-center justify-between transition-all ${
                    isP1Revealed
                      ? 'bg-gradient-to-r from-blue-950 to-blue-900 border-[#ffcc00]'
                      : 'bg-slate-900/90 border-slate-700'
                  }`}>
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-amber-400 font-bold block uppercase">Player 1:</span>
                      <span className="font-jeopardy-display text-sm sm:text-base font-bold text-white tracking-wide uppercase truncate block">
                        {hideP1OnTv ? (
                          <span className="text-slate-600 font-mono tracking-widest">••••••••</span>
                        ) : stage === 'REVEAL' && !isP1Revealed && role === 'tv' ? (
                          <span className="text-slate-600 font-mono tracking-widest">••••••••</span>
                        ) : p1.text ? (
                          p1.text
                        ) : (
                          <span className="text-slate-500 italic font-sans font-normal text-xs">
                            {p1.passed ? '(Passed)' : '—'}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-base sm:text-lg font-black bg-black px-2.5 py-0.5 rounded border border-amber-500 text-[#ffcc00] min-w-[36px] text-center">
                        {isP1Revealed ? p1.points : (role === 'host' ? p1.points : '—')}
                      </span>

                      {role === 'host' && (stage === 'REVEAL' || stage === 'RESULTS') && (
                        <button
                          type="button"
                          onClick={() => handleRevealAnswer(1, idx, p1.points)}
                          className={`text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                            isP1Revealed
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                              : 'bg-[#ffcc00] text-[#02052c] hover:bg-amber-400'
                          }`}
                        >
                          {isP1Revealed ? '✓ Done' : 'Reveal'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PLAYER 2 SLAT */}
                  <div className={`rounded-lg border p-2 flex items-center justify-between transition-all ${
                    isP2Revealed
                      ? 'bg-gradient-to-r from-cyan-950 to-cyan-900 border-cyan-400'
                      : 'bg-slate-900/90 border-slate-700'
                  }`}>
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-cyan-400 font-bold block uppercase">Player 2:</span>
                      <span className="font-jeopardy-display text-sm sm:text-base font-bold text-white tracking-wide uppercase truncate block">
                        {stage === 'REVEAL' && !isP2Revealed && role === 'tv' ? (
                          <span className="text-slate-600 font-mono tracking-widest">••••••••</span>
                        ) : p2.text ? (
                          p2.text
                        ) : (
                          <span className="text-slate-500 italic font-sans font-normal text-xs">
                            {p2.passed ? '(Passed)' : '—'}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-base sm:text-lg font-black bg-black px-2.5 py-0.5 rounded border border-cyan-400 text-cyan-300 min-w-[36px] text-center">
                        {isP2Revealed ? p2.points : (role === 'host' ? p2.points : '—')}
                      </span>

                      {role === 'host' && (stage === 'REVEAL' || stage === 'RESULTS') && (
                        <button
                          type="button"
                          onClick={() => handleRevealAnswer(2, idx, p2.points)}
                          className={`text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                            isP2Revealed
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                              : 'bg-cyan-500 text-[#02052c] hover:bg-cyan-400'
                          }`}
                        >
                          {isP2Revealed ? '✓ Done' : 'Reveal'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Host Quick-Select Survey Answers (Only visible on Host screen when question is active) */}
                {role === 'host' && isActiveQ && (
                  <div className="mt-2 p-2 bg-black/60 rounded-lg border border-amber-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span>Click to match contestant's answer:</span>
                      {activePlayer === 2 && p1.text && (
                        <span className="text-red-400 flex items-center gap-1 font-semibold">
                          <X className="w-3.5 h-3.5" /> P1 already said: "{p1.text}" (DO NOT DUPLICATE)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {q.answers.map((ans, aIdx) => {
                        const isP1Match = activePlayer === 2 && isDuplicate(p1.text, ans.text);

                        return (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleRecordAnswer(ans.text, ans.points)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                              isP1Match
                                ? 'bg-red-950 text-red-300 border-red-700 hover:bg-red-900 line-through opacity-75'
                                : 'bg-slate-800 text-white border-slate-700 hover:border-amber-400 hover:bg-slate-700'
                            }`}
                            title={isP1Match ? 'DUPLICATE of Player 1' : `Award ${ans.points} points`}
                          >
                            <span>{ans.text}</span>
                            <span className="font-mono text-amber-300 font-bold ml-1">({ans.points})</span>
                          </button>
                        );
                      })}

                      {/* 0 Points / Zero Answer */}
                      <button
                        type="button"
                        onClick={() => handleRecordAnswer('Zero / Missed', 0)}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-red-950/80 text-red-300 border border-red-800 hover:bg-red-900 cursor-pointer"
                      >
                        0 Pts (Miss)
                      </button>

                      <button
                        type="button"
                        onClick={handlePass}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
                      >
                        <FastForward className="w-3 h-3" /> Pass
                      </button>
                    </div>

                    {/* Custom Typed Answer with Custom Points */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400">Custom:</span>
                      <input
                        type="text"
                        placeholder="Type contestant answer..."
                        value={customInputText}
                        onChange={(e) => setCustomInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customInputText.trim()) {
                            handleRecordAnswer(customInputText, customInputPoints);
                          }
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-400"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customInputPoints}
                        onChange={(e) => setCustomInputPoints(Number(e.target.value))}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-amber-300 font-mono font-bold text-center outline-none focus:border-amber-400"
                        title="Points"
                      />
                      <button
                        type="button"
                        onClick={() => handleRecordAnswer(customInputText, customInputPoints)}
                        disabled={!customInputText.trim()}
                        className="px-2.5 py-1 bg-amber-500 disabled:opacity-40 hover:bg-amber-400 text-[#02052c] font-bold text-xs rounded cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =====================================================================
            6. FOOTER ACTION BAR (Controls, Reveal All & Award Prize)
            ===================================================================== */}
        <div className="bg-[#010421] border-t-2 border-amber-500/40 p-3 sm:p-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          {/* Status Message */}
          <div className="flex items-center gap-2">
            {totalRevealedPoints >= 200 ? (
              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500 px-3 py-1.5 rounded-xl text-emerald-300 font-bold animate-pulse">
                <Crown className="w-4 h-4 text-[#ffcc00]" />
                <span>200+ POINTS REACHED! $20,000 GRAND PRIZE VICTORY!</span>
              </div>
            ) : stage === 'REVEAL' ? (
              <span className="text-slate-300">
                Revealed so far: <strong className="text-[#ffcc00] font-mono text-sm">{totalRevealedPoints} PTS</strong> (Need {Math.max(0, 200 - totalRevealedPoints)} more for $20,000).
              </span>
            ) : (
              <span className="text-slate-400">
                {stage === 'PLAYER1' && 'Stage 1: Contestant 1 has 20s. Player 2 stays backstage.'}
                {stage === 'PLAYER2' && 'Stage 2: Contestant 2 has 25s. Repeating Player 1 answers will trigger double-buzz!'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {role === 'host' && (
              <>
                {stage === 'PLAYER1' && (
                  <button
                    type="button"
                    onClick={() => handleSelectStage('PLAYER2')}
                    className="px-4 py-2 bg-[#ffcc00] hover:bg-amber-400 text-[#02052c] font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-transform hover:scale-105"
                  >
                    <span>Bring Out Player 2 (25s)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {stage === 'PLAYER2' && (
                  <button
                    type="button"
                    onClick={() => handleSelectStage('REVEAL')}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-transform hover:scale-105"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Proceed to Score Reveal</span>
                  </button>
                )}

                {stage === 'REVEAL' && (
                  <button
                    type="button"
                    onClick={handleRevealAll}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/50 cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reveal All Remaining</span>
                  </button>
                )}
              </>
            )}

            {/* Award Points to Team Score Button */}
            <button
              type="button"
              onClick={() => {
                const awarded = Math.max(totalRevealedPoints, fullPotentialPoints);
                onAwardPoints(awarded);
                soundFx.playFeudWin();
                gameSync.broadcast({ type: 'FAST_MONEY_CLOSE' });
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 ${
                totalRevealedPoints >= 200 || fullPotentialPoints >= 200
                  ? 'bg-gradient-to-r from-emerald-600 via-amber-500 to-[#ffcc00] text-[#02052c] ring-2 ring-white animate-bounce'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-[#ffcc00] fill-current" />
              <span>
                Award {Math.max(totalRevealedPoints, fullPotentialPoints)} Pts to {teamName}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameSync.broadcast({ type: 'FAST_MONEY_CLOSE' });
                onClose();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
