import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FinalJeopardyItem } from '../data/animeJeopardyData';
import { Team } from './ScoreBoard';
import { Podium } from './Podium';
import { soundFx } from '../utils/audioSynth';
import { gameSync, ScreenRole } from '../utils/gameSync';
import { Check, X } from 'lucide-react';

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

  // Ensure viewport is scrolled to top so modal is perfectly centered
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  const modalContent = (
    <div
      data-modal-overlay="true"
      className="fixed inset-0 z-50 bg-[#010314]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
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
      <div className="fj-card">
        <h1 className="fj-title">Final Jeopardy!</h1>
        <p className="dd-category">{finalData.category}</p>

        {stage === 'WAGER' && (
          <>
            <p className="fj-lede">
              {role === 'host'
                ? 'Each team writes down a wager before seeing the clue. They can bet anything from $0 up to their score.'
                : 'Teams, write down your wagers now. You can bet anything from $0 up to your score.'}
            </p>
            <div className="podium-row fj-podiums">
              {teams.map((team) => {
                const maxWager = Math.max(0, team.score);
                return (
                  <div key={team.id} className="fj-slot">
                    <Podium name={team.name} color={team.color.border} score={team.score} />
                    {role === 'host' ? (
                      <label className="fj-wager">
                        <span>$</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={maxWager}
                          aria-label={`${team.name} wager`}
                          value={wagers[team.id] ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setWagers((prev) => ({ ...prev, [team.id]: Math.max(0, Math.min(val, maxWager)) }));
                          }}
                        />
                      </label>
                    ) : (
                      <span className="fj-secret">Wager hidden</span>
                    )}
                  </div>
                );
              })}
            </div>
            {role === 'host' ? (
              <button type="button" onClick={handleStartClue} className="marquee-button">
                Lock wagers and show the clue
              </button>
            ) : (
              <p className="dd-wait">The clue appears when the host locks the wagers.</p>
            )}
          </>
        )}

        {stage === 'CLUE' && (
          <>
            {finalData.image && (
              <img
                src={finalData.image}
                alt={finalData.imageAlt || 'Final clue picture'}
                onError={(e) => {
                  if (finalData.fallbackImage) e.currentTarget.src = finalData.fallbackImage;
                }}
                className="fj-image"
              />
            )}
            <p className="clue-text-show font-jeopardy-serif fj-clue">{finalData.clue}</p>
            <div className={`fj-clock ${timeLeft <= 5 ? 'fj-clock-low' : ''}`} role="timer" aria-live="off">
              <div className="fj-clock-bar" style={{ width: `${(timeLeft / 30) * 100}%` }} />
              <span>{timeLeft === 0 ? 'Pens down' : `${timeLeft}`}</span>
            </div>
            {role === 'host' && (
              <button type="button" onClick={handleGoToJudge} className="marquee-button">
                Show the answer
              </button>
            )}
          </>
        )}

        {stage === 'JUDGE' && (
          <>
            <div className="fj-answer">
              <p className="fj-answer-label">The correct response</p>
              <p className="font-jeopardy-serif fj-answer-text">{finalData.answer}</p>
            </div>

            {role === 'host' ? (
              <>
                <p className="fj-lede">Mark each team&rsquo;s written answer.</p>
                <div className="fj-judge">
                  {teams.map((team) => {
                    const wager = wagers[team.id] || 0;
                    const status = judgments[team.id];
                    return (
                      <div key={team.id} className="fj-judge-row" style={{ '--team': team.color.border } as React.CSSProperties}>
                        <div className="fj-judge-who">
                          <span className="podium-name">{team.name}</span>
                          <span className="fj-judge-meta">
                            ${team.score.toLocaleString()} now, wagered ${wager.toLocaleString()}
                          </span>
                        </div>
                        <div className="fj-judge-btns">
                          <button
                            type="button"
                            aria-pressed={status === true}
                            className={`fj-right ${status === true ? 'fj-on' : ''}`}
                            onClick={() => {
                              setJudgments((prev) => ({ ...prev, [team.id]: true }));
                              soundFx.playCorrect();
                            }}
                          >
                            <Check className="w-4 h-4" /> Right
                          </button>
                          <button
                            type="button"
                            aria-pressed={status === false}
                            className={`fj-wrong ${status === false ? 'fj-on' : ''}`}
                            onClick={() => {
                              setJudgments((prev) => ({ ...prev, [team.id]: false }));
                              soundFx.playWrong();
                            }}
                          >
                            <X className="w-4 h-4" /> Wrong
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={handleComplete} className="marquee-button">
                  Crown the champion
                </button>
              </>
            ) : (
              <p className="dd-wait">The host is checking everyone&rsquo;s answers.</p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
