import React, { useState, useEffect } from 'react';
import { FinalJeopardyItem } from '../data/animeJeopardyData';
import { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
import { Trophy, Clock, Check, X } from 'lucide-react';

interface FinalJeopardyModalProps {
  finalData: FinalJeopardyItem;
  teams: Team[];
  onFinishGame: (updatedTeams: Team[]) => void;
}

type Stage = 'WAGER' | 'CLUE' | 'JUDGE';

export const FinalJeopardyModal: React.FC<FinalJeopardyModalProps> = ({
  finalData,
  teams,
  onFinishGame
}) => {
  const [stage, setStage] = useState<Stage>('WAGER');
  const [wagers, setWagers] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    teams.forEach((t) => {
      init[t.id] = Math.max(0, Math.floor(Math.max(0, t.score) / 2));
    });
    return init;
  });

  const [judgments, setJudgments] = useState<Record<number, boolean | null>>(() => {
    const init: Record<number, boolean | null> = {};
    teams.forEach((t) => {
      init[t.id] = null;
    });
    return init;
  });

  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === 'CLUE' && timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            soundFx.playWrong();
            setTimerRunning(false);
            return 0;
          }
          soundFx.playTimerTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timerRunning, timeLeft]);

  const handleStartClue = () => {
    setStage('CLUE');
    setTimeLeft(30);
    setTimerRunning(true);
    soundFx.playCluePing();
  };

  const handleGoToJudge = () => {
    setTimerRunning(false);
    setStage('JUDGE');
  };

  const handleComplete = () => {
    // Calculate final scores
    const updated = teams.map((team) => {
      const wager = wagers[team.id] || 0;
      const wasCorrect = judgments[team.id] === true;
      const wasWrong = judgments[team.id] === false;

      let newScore = team.score;
      if (wasCorrect) newScore += wager;
      if (wasWrong) newScore -= wager;

      return {
        ...team,
        score: newScore
      };
    });

    onFinishGame(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#0b15c9] via-[#04097a] to-[#020536] border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-8 shadow-2xl text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 text-[#ffcc00] font-bold text-xs uppercase tracking-widest bg-amber-500/10 border border-[#ffcc00]/40 px-3 py-1 rounded-full mb-2">
          <Trophy className="w-4 h-4" /> The Final Showdown
        </div>
        <h1 className="font-jeopardy-display text-3xl sm:text-4xl md:text-5xl text-[#ffcc00] tracking-wider uppercase mb-1">
          FINAL JEOPARDY
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mb-6 font-semibold">
          Category: <span className="text-white uppercase font-bold">{finalData.category}</span>
        </p>

        {/* STAGE 1: WAGER */}
        {stage === 'WAGER' && (
          <div className="space-y-6">
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Before seeing the clue, each team must privately enter their wager based on their confidence in this category. (Maximum wager is your current score, minimum $0).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {teams.map((team) => {
                const maxWager = Math.max(0, team.score);
                const currentVal = wagers[team.id] ?? 0;

                return (
                  <div
                    key={team.id}
                    className="bg-[#02052c] border border-slate-700 rounded-xl p-3 text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200 truncate">{team.name}</span>
                      <span className="text-xs text-amber-300">${team.score}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 border border-slate-600 rounded px-2 py-1">
                      <span className="text-xs text-[#ffcc00] font-bold">$</span>
                      <input
                        type="number"
                        min={0}
                        max={maxWager}
                        value={currentVal}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setWagers((prev) => ({
                            ...prev,
                            [team.id]: Math.max(0, Math.min(val, maxWager))
                          }));
                        }}
                        className="w-full bg-transparent text-sm text-white font-mono font-bold outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Max: ${maxWager.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleStartClue}
              className="py-3 px-8 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              Lock Wagers & Reveal Clue
            </button>
          </div>
        )}

        {/* STAGE 2: CLUE */}
        {stage === 'CLUE' && (
          <div className="space-y-6">
            {finalData.image && (
              <div className="max-w-md mx-auto max-h-56 rounded-xl overflow-hidden border-2 border-[#ffcc00] shadow-md bg-black">
                <img
                  src={finalData.image}
                  alt="Final Clue"
                  onError={(e) => {
                    if (finalData.fallbackImage) {
                      e.currentTarget.src = finalData.fallbackImage;
                    }
                  }}
                  className="w-full h-full object-cover max-h-56"
                />
              </div>
            )}

            <div className="font-jeopardy-serif text-white text-xl sm:text-2xl md:text-3xl leading-relaxed max-w-2xl mx-auto px-4">
              {finalData.clue}
            </div>

            {/* 30s Countdown timer */}
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-8 h-8 text-[#ffcc00]" />
              <span className="font-jeopardy-display text-5xl sm:text-6xl text-[#ffcc00] tabular-nums tracking-wider drop-shadow-md">
                {timeLeft}s
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoToJudge}
                className="py-3 px-8 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
              >
                Proceed to Answer & Grading
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: JUDGE */}
        {stage === 'JUDGE' && (
          <div className="space-y-6">
            <div className="bg-black/60 border-2 border-emerald-400 rounded-xl p-4 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-1">
                Correct Response
              </span>
              <div className="font-jeopardy-serif text-white text-2xl sm:text-3xl font-bold">
                {finalData.answer}
              </div>
            </div>

            <p className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider">
              Host: Mark Each Team's Written Answer
            </p>

            <div className="space-y-2 max-w-2xl mx-auto">
              {teams.map((team) => {
                const wager = wagers[team.id] || 0;
                const status = judgments[team.id];

                return (
                  <div
                    key={team.id}
                    className="flex items-center justify-between bg-[#02052c] border border-slate-700 rounded-xl px-4 py-2.5"
                  >
                    <div className="text-left">
                      <span className="font-semibold text-white block text-sm sm:text-base">
                        {team.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        Score: ${team.score} · Wager: ${wager}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setJudgments((prev) => ({ ...prev, [team.id]: true }));
                          soundFx.playCorrect();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          status === true
                            ? 'bg-emerald-600 text-white ring-2 ring-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-emerald-900/60'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Correct (+${wager})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setJudgments((prev) => ({ ...prev, [team.id]: false }));
                          soundFx.playWrong();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          status === false
                            ? 'bg-red-700 text-white ring-2 ring-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-red-900/60'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Wrong (-${wager})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleComplete}
              className="py-3.5 px-10 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              👑 Conclude Game & Show Champion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
