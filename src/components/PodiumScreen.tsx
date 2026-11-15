import React, { useEffect, useState } from 'react';
import type { Team } from './ScoreBoard';
import { Podium } from './Podium';
import { soundFx } from '../utils/audioSynth';
import { RotateCcw, Play } from 'lucide-react';

interface PodiumScreenProps {
  teams: Team[];
  onRestart: () => void;
  onPlayAgainSameTeams?: () => void;
  onResetScores?: () => void;
}

/** End of the show: the winner's podium under a spotlight, everyone else beside it. */
export const PodiumScreen: React.FC<PodiumScreenProps> = ({
  teams,
  onRestart,
  onPlayAgainSameTeams,
  onResetScores
}) => {
  const [cleared, setCleared] = useState(false);
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const leaders = sorted.filter((t) => t.score === winner?.score);
  const tied = leaders.length > 1;

  useEffect(() => {
    soundFx.playCorrect();
  }, []);

  if (!winner) return null;

  return (
    <section className="stage-setup finale">
      <div className="finale-spotlight" aria-hidden="true" />
      <p className="stage-kicker">{tied ? 'Tied for the win' : 'Tonight’s champion'}</p>
      <h1 className="finale-name">{leaders.map((t) => t.name).join(' & ')}</h1>
      <p className="finale-score">${winner.score.toLocaleString()}</p>

      <div className="podium-row finale-row">
        {sorted.map((t, idx) => (
          <div key={t.id} className={`finale-slot ${idx === 0 ? 'finale-slot-winner' : ''}`}>
            <span className="finale-place">{idx + 1}</span>
            <Podium name={t.name} color={t.color.border} score={t.score} size={idx === 0 ? 'lg' : 'sm'} active={idx === 0} />
          </div>
        ))}
      </div>

      <div className="finale-actions">
        {onPlayAgainSameTeams && (
          <button type="button" onClick={onPlayAgainSameTeams} className="marquee-button">
            <Play className="w-6 h-6 fill-current inline -mt-1 mr-2" />
            Play again
          </button>
        )}
        <div className="stage-secondary">
          <button type="button" onClick={onRestart}>
            <RotateCcw className="w-4 h-4" /> New teams
          </button>
          {onResetScores && (
            <button
              type="button"
              onClick={() => {
                onResetScores();
                setCleared(true);
                setTimeout(() => setCleared(false), 2500);
              }}
            >
              <RotateCcw className="w-4 h-4" /> {cleared ? 'Scores reset to $0' : 'Reset scores to $0'}
            </button>
          )}
        </div>
        <p className="finale-hint">Play again keeps these teams and starts a fresh board at $0.</p>
      </div>
    </section>
  );
};
