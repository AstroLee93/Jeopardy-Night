import React, { useState, useEffect } from 'react';
import { FinalJeopardyItem } from '../data/animeJeopardyData';
import { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
import { gameSync, ScreenRole } from '../utils/gameSync';
import { Trophy, Clock, Check, X, Tv, Crown } from 'lucide-react';

interface FinalJeopardyModalProps {
  finalData: FinalJeopardyItem;
  teams: Team[];
  role?: ScreenRole;
  onFinishGame: (updatedTeams: Team[]) => void;
}

type Stage = 'WAGER' | 'CLUE' | 'JUDGE';

export const FinalJeopardyModal: React.FC<FinalJeopardyModalProps> = ({
  finalData,
  teams,
  role = 'host',
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

  // Timestamp-based synchronized 30s timer
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);

  // Sync listener across screens
  useEffect(() => {
    const unsubscribe = gameSync.subscribe((action) => {
      if (action.type === 'SYNC_FINAL_STAGE') {
        setStage(action.stage);
        if (action.timeLeft !== undefined) setTimeLeft(action.timeLeft);
        if (action.timerRunning !== undefined) setTimerRunning(action.timerRunning);
        if (action.endTime !== undefined) setTimerEndTime(action.endTime);

        if (action.stage === 'CLUE' && action.timerRunning) {
          soundFx.playCluePing();
          soundFx.playThinkMusic();
        } else if (action.stage === 'JUDGE') {
          soundFx.stopThinkMusic();
        }
      }
    });

    return () => {
      unsubscribe();
      soundFx.stopThinkMusic();
    };
  }, []);

  // High-precision countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stage === 'CLUE' && timerRunning && timerEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diffMs = timerEndTime - now;
        const secondsRemaining = Math.max(0, Math.ceil(diffMs / 1000));

        setTimeLeft(secondsRemaining);

        if (secondsRemaining <= 5 && secondsRemaining > 0) {
          soundFx.playTimerTick();
        }

        if (diffMs <= 0) {
          setTimerRunning(false);
          setTimerEndTime(null);
          setTimeLeft(0);
          soundFx.stopThinkMusic();
          soundFx.playWrong();

          if (role === 'host') {
            gameSync.broadcast({
              type: 'SYNC_FINAL_STAGE',
              stage: 'CLUE',
              timeLeft: 0,
              timerRunning: false,
              endTime: null
            });
          }
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, timerRunning, timerEndTime, role]);

  const handleStartClue = () => {
    const end = Date.now() + 30 * 1000;
    setStage('CLUE');
    setTimeLeft(30);
    setTimerEndTime(end);
    setTimerRunning(true);
    soundFx.playCluePing();
    soundFx.playThinkMusic();

    gameSync.broadcast({
      type: 'SYNC_FINAL_STAGE',
      stage: 'CLUE',
      timeLeft: 30,
      timerRunning: true,
      endTime: end
    });
  };

  const handleGoToJudge = () => {
    soundFx.stopThinkMusic();
    setTimerRunning(false);
    setTimerEndTime(null);
    setStage('JUDGE');

    gameSync.broadcast({
      type: 'SYNC_FINAL_STAGE',
      stage: 'JUDGE',
      timerRunning: false,
      endTime: null
    });
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
      <div className={`w-full max-w-4xl bg-gradient-to-b from-[#0b15c9] via-[#04097a] to-[#020536] border-4 rounded-2xl p-5 sm:p-8 shadow-2xl text-center ${
        role === 'tv' ? 'border-cyan-400' : 'border-[#ffcc00]'
      }`}>
        {/* Header with role badge */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="inline-flex items-center gap-2 text-[#ffcc00] font-bold text-xs uppercase tracking-widest bg-amber-500/10 border border-[#ffcc00]/40 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4" /> The Final Showdown
          </div>
          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
            role === 'tv' ? 'bg-cyan-950 text-cyan-300 border-cyan-500' : 'bg-amber-950 text-amber-300 border-amber-500'
          }`}>
            {role === 'tv' ? '📺 TV Screen' : '👑 Host Controller'}
          </span>
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
                    {role === 'host' ? (
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
                    ) : (
                      <div className="text-xs font-mono font-bold text-amber-300 py-1">
                        [Wager Recorded Privately]
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Max: ${maxWager.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {role === 'host' ? (
              <button
                type="button"
                onClick={handleStartClue}
                className="py-3 px-8 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
              >
                Lock Wagers & Reveal Clue on TV
              </button>
            ) : (
              <div className="text-xs text-cyan-300 italic">
                Waiting for host to lock wagers and reveal clue...
              </div>
            )}
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

            {/* Synchronized 30s Countdown timer */}
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-8 h-8 text-[#ffcc00]" />
              <span className={`font-jeopardy-display text-5xl sm:text-6xl tabular-nums tracking-wider drop-shadow-md ${
                timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-[#ffcc00]'
              }`}>
                {timeLeft === 0 ? "TIME'S UP!" : `${timeLeft}s`}
              </span>
            </div>

            {role === 'host' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGoToJudge}
                  className="py-3 px-8 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
                >
                  Proceed to Answer & Grading
                </button>
              </div>
            )}
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

            {role === 'host' ? (
              <>
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
              </>
            ) : (
              <div className="text-sm text-cyan-300 font-semibold py-4">
                The host is grading final answers... Champion will be revealed shortly!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
