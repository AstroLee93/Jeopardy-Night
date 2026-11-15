import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ClueItem } from '../data/animeJeopardyData';
import type { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
import type { ScreenRole } from '../utils/gameSync';


interface DailyDoubleModalProps {
  clue: ClueItem;
  categoryTitle: string;
  teams: Team[];
  role?: ScreenRole;
  onConfirmWager: (wager: number) => void;
  wagerFloor?: number;
}

export const DailyDoubleModal: React.FC<DailyDoubleModalProps> = ({
  categoryTitle,
  teams,
  role = 'host',
  onConfirmWager,
  wagerFloor = 1000
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(teams[0]?.id ?? 0);
  const currentTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  // Maximum allowed wager: the maximum of $1,000 or the team's current score
  const maxWager = Math.max(wagerFloor, currentTeam?.score || 0);
  const [wager, setWager] = useState<number>(Math.min(wagerFloor, maxWager));

  // Trigger distinctive Daily Double sound effect on mount and pin viewport to top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    soundFx.initCtx();
    // Play with full TV fanfare profile (sub-bass punch + dual-layer synth + shimmering chime)
    soundFx.playDailyDouble(role === 'tv');
  }, [role]);

  const handleSliderChange = (val: number) => {
    setWager(Math.max(5, Math.min(val, maxWager)));
  };

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
      <div className="dd-card">
        <div className="dd-rays" aria-hidden="true" />
        <h1 className="dd-title">Daily Double</h1>
        <p className="dd-category">{categoryTitle}</p>

        {role === 'tv' ? (
          <p className="dd-wait">
            Only the team that picked this clue can answer. The host is setting the wager.
          </p>
        ) : (
          <div className="dd-host">
            <p className="dd-label">Who picked this clue?</p>
            <div className="dd-teams">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  aria-pressed={selectedTeamId === team.id}
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    setWager(Math.min(wagerFloor, Math.max(wagerFloor, team.score)));
                  }}
                  className={`dd-team ${selectedTeamId === team.id ? 'dd-team-on' : ''}`}
                  style={{ '--team': team.color.border } as React.CSSProperties}
                >
                  <span className="podium-name">{team.name}</span>
                  <span className="dd-team-score">${team.score.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <label className="dd-label" htmlFor="dd-wager">
              {currentTeam?.name} wagers up to ${maxWager.toLocaleString()}
            </label>
            <div className="dd-wager">
              <span>$</span>
              <input
                id="dd-wager"
                type="number"
                inputMode="numeric"
                value={wager}
                min={5}
                max={maxWager}
                onChange={(e) => handleSliderChange(parseInt(e.target.value, 10) || 5)}
              />
            </div>
            <input
              type="range"
              className="dd-range"
              min={5}
              max={maxWager}
              step={5}
              value={wager}
              aria-label="Wager amount"
              onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
            />
            <div className="dd-presets">
              {[Math.round(maxWager / 4 / 100) * 100 || 5, Math.round(maxWager / 2 / 100) * 100 || 5].map((v) => (
                <button key={v} type="button" onClick={() => handleSliderChange(v)}>
                  ${v.toLocaleString()}
                </button>
              ))}
              <button type="button" onClick={() => handleSliderChange(maxWager)}>
                Make it a true Daily Double
              </button>
            </div>

            <button type="button" onClick={() => onConfirmWager(wager)} className="marquee-button dd-confirm">
              Show the clue for ${wager.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
