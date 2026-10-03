import React, { useState } from 'react';
import { ClueItem } from '../data/animeJeopardyData';
import { Team } from './ScoreBoard';
import { Sparkles } from 'lucide-react';

interface DailyDoubleModalProps {
  clue: ClueItem;
  categoryTitle: string;
  teams: Team[];
  onConfirmWager: (wager: number) => void;
}

export const DailyDoubleModal: React.FC<DailyDoubleModalProps> = ({
  categoryTitle,
  teams,
  onConfirmWager
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(teams[0]?.id ?? 0);
  const currentTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  // Maximum allowed wager: the maximum of $1,000 or the team's current score
  const maxWager = Math.max(1000, currentTeam?.score || 0);
  const [wager, setWager] = useState<number>(Math.min(1000, maxWager));

  const handleSliderChange = (val: number) => {
    setWager(Math.max(5, Math.min(val, maxWager)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-gradient-to-b from-[#0b15c9] to-[#020536] border-4 border-[#ffcc00] rounded-2xl p-6 sm:p-8 shadow-2xl text-center pulse-gold">
        <div className="inline-flex items-center gap-2 text-[#ffcc00] text-sm uppercase font-bold tracking-widest bg-amber-500/10 border border-[#ffcc00]/40 px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-4 h-4" /> Special Clue Unlocked
        </div>

        <h1 className="font-jeopardy-display text-4xl sm:text-5xl text-[#ffcc00] tracking-wider uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2">
          ⚡ DAILY DOUBLE ⚡
        </h1>

        <p className="text-slate-300 text-sm sm:text-base mb-6">
          Category: <strong className="text-white uppercase">{categoryTitle}</strong>
        </p>

        {/* Team Selector */}
        <div className="mb-5 text-left">
          <label className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider block mb-2 text-center">
            Select Waging Team
          </label>
          <div className="flex gap-2 justify-center flex-wrap">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  setSelectedTeamId(team.id);
                  const newMax = Math.max(1000, team.score);
                  setWager(Math.min(1000, newMax));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedTeamId === team.id
                    ? 'bg-[#ffcc00] text-[#030852] border-[#ffcc00] shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                {team.name} (${team.score})
              </button>
            ))}
          </div>
        </div>

        {/* Wager Input */}
        <div className="bg-[#02052c] border-2 border-[#ffcc00]/60 rounded-xl p-4 sm:p-5 mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Wager Amount (Min $5 · Max ${maxWager.toLocaleString()})
          </span>
          <div className="flex items-center justify-center gap-1 font-jeopardy-display text-4xl text-[#ffcc00]">
            <span>$</span>
            <input
              type="number"
              value={wager}
              min={5}
              max={maxWager}
              onChange={(e) => handleSliderChange(parseInt(e.target.value, 10) || 5)}
              className="bg-transparent text-center text-white border-b-2 border-[#ffcc00] outline-none w-36 font-jeopardy-display"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleSliderChange(500)}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
            >
              $500
            </button>
            <button
              type="button"
              onClick={() => handleSliderChange(1000)}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
            >
              $1,000
            </button>
            {maxWager > 1000 && (
              <button
                type="button"
                onClick={() => handleSliderChange(maxWager)}
                className="text-xs bg-amber-500/20 text-[#ffcc00] border border-[#ffcc00]/40 px-2.5 py-1 rounded font-bold"
              >
                True Daily Double (${maxWager})
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onConfirmWager(wager)}
          className="w-full py-3.5 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          Reveal Clue for ${wager.toLocaleString()}
        </button>
      </div>
    </div>
  );
};
