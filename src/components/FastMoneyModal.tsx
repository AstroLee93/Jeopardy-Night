import React, { useState, useEffect, useRef } from 'react';
import { FastMoneyItem } from '../data/familyFeudData';
import { soundFx } from '../utils/audioSynth';
import { ScreenRole } from '../utils/gameSync';
import { Clock, Play, Pause, RotateCcw, Trophy, Check, X, Sparkles, Volume2 } from 'lucide-react';

interface FastMoneyModalProps {
  questions: FastMoneyItem[];
  teamName: string;
  role?: ScreenRole;
  onClose: () => void;
  onAwardPoints: (points: number) => void;
}

export const FastMoneyModal: React.FC<FastMoneyModalProps> = ({
  questions,
  teamName,
  role = 'host',
  onClose,
  onAwardPoints,
}) => {
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(20);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Player answers and point scores
  const [player1Answers, setPlayer1Answers] = useState<Array<{ text: string; points: number }>>(
    questions.map(() => ({ text: '', points: 0 }))
  );
  const [player2Answers, setPlayer2Answers] = useState<Array<{ text: string; points: number }>>(
    questions.map(() => ({ text: '', points: 0 }))
  );

  const [revealedPlayer1, setRevealedPlayer1] = useState<boolean[]>(questions.map(() => false));
  const [revealedPlayer2, setRevealedPlayer2] = useState<boolean[]>(questions.map(() => false));

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 20-second countdown timer
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            soundFx.playWrong();
            setIsTimerRunning(false);
            return 0;
          }
          soundFx.playFeudTick();
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  const totalPoints =
    player1Answers.reduce((sum, a, idx) => sum + (revealedPlayer1[idx] ? a.points : 0), 0) +
    player2Answers.reduce((sum, a, idx) => sum + (revealedPlayer2[idx] ? a.points : 0), 0);

  const handleRevealScore = (player: 1 | 2, index: number, pts: number) => {
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
  };

  const handleAnswerSelect = (player: 1 | 2, qIndex: number, text: string, points: number) => {
    if (player === 1) {
      setPlayer1Answers((prev) => {
        const copy = [...prev];
        copy[qIndex] = { text, points };
        return copy;
      });
    } else {
      setPlayer2Answers((prev) => {
        const copy = [...prev];
        copy[qIndex] = { text, points };
        return copy;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#03093b] border-4 border-[#ffcc00] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Marquee */}
        <div className="bg-gradient-to-r from-amber-600 via-[#ffcc00] to-amber-600 p-3 sm:p-4 text-center text-[#02052c] font-black tracking-widest relative">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold bg-[#02052c] text-[#ffcc00] px-3 py-1 rounded-full">
              🌟 FAST MONEY BONUS ROUND
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-[#02052c]">
                Playing: {teamName}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#02052c] text-[#ffcc00] flex items-center justify-center hover:scale-105 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Total Score & Timer Bar */}
        <div className="bg-[#02052c] border-b-2 border-amber-500/40 p-3 sm:p-4 flex items-center justify-between flex-wrap gap-4">
          {/* 20-Second Countdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
              <Clock className="w-5 h-5 text-[#ffcc00]" />
              <span className={`font-mono text-2xl sm:text-3xl font-black ${timerSeconds <= 5 ? 'text-red-400 animate-pulse' : 'text-[#ffcc00]'}`}>
                {timerSeconds}s
              </span>
            </div>

            {role === 'host' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ffcc00] text-[#02052c] hover:bg-amber-400 cursor-pointer flex items-center gap-1"
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isTimerRunning ? 'Pause' : 'Start 20s'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(activePlayer === 1 ? 20 : 25);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Active Player Toggle (Host only) */}
          {role === 'host' && (
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActivePlayer(1);
                  setTimerSeconds(20);
                  setIsTimerRunning(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activePlayer === 1 ? 'bg-[#ffcc00] text-[#02052c]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Player 1 (20s)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePlayer(2);
                  setTimerSeconds(25);
                  setIsTimerRunning(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activePlayer === 2 ? 'bg-[#ffcc00] text-[#02052c]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Player 2 (25s)
              </button>
            </div>
          )}

          {/* Cumulative Score Tracker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase">Target: 200 PTS</span>
            <div className={`px-4 py-1.5 rounded-xl border-2 font-mono text-2xl font-black ${
              totalPoints >= 200 ? 'bg-emerald-600 text-white border-emerald-400 animate-bounce' : 'bg-black text-[#ffcc00] border-amber-500'
            }`}>
              {totalPoints} PTS
            </div>
          </div>
        </div>

        {/* Questions & Answer Slats */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="bg-[#02052c] border border-amber-500/30 rounded-xl p-3 sm:p-4 space-y-2 shadow"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ffcc00] text-[#02052c] font-black text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-white font-semibold text-xs sm:text-sm">{q.question}</span>
              </div>

              {/* Player 1 & Player 2 Answer Slats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Player 1 Slat */}
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-2 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">P1 Answer:</span>
                    <span className="text-white font-semibold">
                      {revealedPlayer1[idx] ? player1Answers[idx].text || 'No Answer' : (role === 'host' ? player1Answers[idx].text || '—' : '••••••••')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black bg-black px-2.5 py-0.5 rounded border border-amber-500 text-[#ffcc00]">
                      {revealedPlayer1[idx] ? player1Answers[idx].points : '—'}
                    </span>
                    {role === 'host' && !revealedPlayer1[idx] && (
                      <button
                        type="button"
                        onClick={() => handleRevealScore(1, idx, player1Answers[idx].points)}
                        className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded cursor-pointer font-bold"
                      >
                        Reveal
                      </button>
                    )}
                  </div>
                </div>

                {/* Player 2 Slat */}
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-2 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">P2 Answer:</span>
                    <span className="text-white font-semibold">
                      {revealedPlayer2[idx] ? player2Answers[idx].text || 'No Answer' : (role === 'host' ? player2Answers[idx].text || '—' : '••••••••')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black bg-black px-2.5 py-0.5 rounded border border-amber-500 text-[#ffcc00]">
                      {revealedPlayer2[idx] ? player2Answers[idx].points : '—'}
                    </span>
                    {role === 'host' && !revealedPlayer2[idx] && (
                      <button
                        type="button"
                        onClick={() => handleRevealScore(2, idx, player2Answers[idx].points)}
                        className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded cursor-pointer font-bold"
                      >
                        Reveal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Host Quick Answer Match Picker */}
              {role === 'host' && (
                <div className="bg-black/50 p-2 rounded-lg border border-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Survey Options:</span>
                  {q.answers.map((ans, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={() => handleAnswerSelect(activePlayer, idx, ans.text, ans.points)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                        (activePlayer === 1 ? player1Answers[idx].text === ans.text : player2Answers[idx].text === ans.text)
                          ? 'bg-[#ffcc00] text-[#02052c] border-[#ffcc00] font-bold'
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {ans.text} ({ans.points})
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAnswerSelect(activePlayer, idx, 'Zero / Invalid', 0)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 cursor-pointer"
                  >
                    0 Pts (Miss)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#02052c] border-t-2 border-amber-500/40 p-3 sm:p-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {totalPoints >= 200 ? (
              <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                <Trophy className="w-4 h-4" /> 200+ POINTS! FAST MONEY VICTORY!
              </span>
            ) : (
              <span className="text-slate-400 text-xs">
                {200 - totalPoints} points needed to win the grand prize.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onAwardPoints(totalPoints);
                soundFx.playFeudWin();
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Trophy className="w-4 h-4 text-[#ffcc00]" />
              <span>Award {totalPoints} Pts to {teamName}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
