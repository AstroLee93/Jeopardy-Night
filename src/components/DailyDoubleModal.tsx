import React, { useState, useEffect } from 'react';
import { ClueItem } from '../data/animeJeopardyData';
import { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
import { ScreenRole } from '../utils/gameSync';
import { Sparkles, Zap, Tv, Crown } from 'lucide-react';

interface DailyDoubleModalProps {
  clue: ClueItem;
  categoryTitle: string;
  teams: Team[];
  role?: ScreenRole;
  onConfirmWager: (wager: number) => void;
}

export const DailyDoubleModal: React.FC<DailyDoubleModalProps> = ({
  categoryTitle,
  teams,
  role = 'host',
  onConfirmWager
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(teams[0]?.id ?? 0);
  const currentTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  // Maximum allowed wager: the maximum of $1,000 or the team's current score
  const maxWager = Math.max(1000, currentTeam?.score || 0);
  const [wager, setWager] = useState<number>(Math.min(1000, maxWager));

  // Trigger distinctive Daily Double sound effect on mount
  useEffect(() => {
    soundFx.initCtx();
    // Play with full TV fanfare profile (sub-bass punch + dual-layer synth + shimmering chime)
    soundFx.playDailyDouble(role === 'tv');
  }, [role]);

  const handleSliderChange = (val: number) => {
    setWager(Math.max(5, Math.min(val, maxWager)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className={`w-full max-w-2xl bg-gradient-to-b from-[#0b15c9] via-[#04097a] to-[#020536] border-4 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(255,204,0,0.5)] text-center relative overflow-hidden ${
          role === 'tv' ? 'border-[#ffcc00] animate-pulse' : 'border-[#ffcc00]'
        }`}
      >
        {/* Decorative Golden Rays */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 text-[#ffcc00] text-xs uppercase font-extrabold tracking-widest bg-amber-500/20 border border-[#ffcc00]/60 px-3.5 py-1 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>High-Stakes Multiplier Unlocked</span>
          </div>

          <span
            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${
              role === 'tv'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-400'
                : 'bg-amber-950 text-amber-300 border-amber-500'
            }`}
          >
            {role === 'tv' ? <Tv className="w-3 h-3 inline mr-1" /> : <Crown className="w-3 h-3 inline mr-1" />}
            {role === 'tv' ? 'TV Screen Reveal' : 'Host Controller'}
          </span>
        </div>

        {/* Big Electric Banner */}
        <div className="my-2">
          <h1 className="font-jeopardy-display text-4xl sm:text-6xl text-[#ffcc00] tracking-widest uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] flex items-center justify-center gap-2 sm:gap-3">
            <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-amber-300 fill-current animate-bounce" />
            <span>DAILY DOUBLE</span>
            <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-amber-300 fill-current animate-bounce" />
          </h1>
        </div>

        <p className="text-slate-200 text-sm sm:text-base font-semibold mb-6">
          Category: <strong className="text-white uppercase tracking-wider">{categoryTitle}</strong>
        </p>

        {/* ===================================================================
            TV DISPLAY PRESENTATION VIEW (FOR PLAYERS ON THE BIG SCREEN)
            =================================================================== */}
        {role === 'tv' ? (
          <div className="space-y-6 my-4">
            <div className="bg-[#02052c]/90 border-2 border-amber-400/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300 block mb-2">
                ⚡ Only One Team Can Answer This Clue! ⚡
              </span>
              <p className="text-slate-200 text-base sm:text-xl font-jeopardy-serif leading-relaxed max-w-lg mx-auto">
                The players have triggered a secret Daily Double! The host is setting the wager on their controller.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                  Waiting for Host to Lock Wager...
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              Maximum wager is the team's total score (or $1,000 if less than $1,000).
            </p>
          </div>
        ) : (
          /* ===================================================================
              HOST CONTROLLER VIEW (FOR HOST DEVICE / LAPTOP / PHONE)
              =================================================================== */
          <div className="space-y-5 text-left">
            {/* Team Selector */}
            <div className="bg-[#02052c] border border-slate-700 rounded-xl p-3.5">
              <label className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider block mb-2 text-center">
                Select Team Who Selected This Clue:
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedTeamId === team.id
                        ? 'bg-[#ffcc00] text-[#030852] border-[#ffcc00] shadow-md scale-105'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span>{team.avatar || '⚡'}</span> {team.name} (${team.score})
                  </button>
                ))}
              </div>
            </div>

            {/* Wager Input */}
            <div className="bg-[#02052c] border-2 border-[#ffcc00]/60 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Wager for {currentTeam?.name}:
                </span>
                <span className="text-xs text-amber-300 font-semibold">
                  Max: ${maxWager.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1 font-jeopardy-display text-4xl sm:text-5xl text-[#ffcc00] my-2">
                <span>$</span>
                <input
                  type="number"
                  value={wager}
                  min={5}
                  max={maxWager}
                  onChange={(e) => handleSliderChange(parseInt(e.target.value, 10) || 5)}
                  className="bg-transparent text-center text-white border-b-2 border-[#ffcc00] outline-none w-44 font-jeopardy-display font-bold"
                />
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSliderChange(500)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  $500
                </button>
                <button
                  type="button"
                  onClick={() => handleSliderChange(1000)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  $1,000
                </button>
                {maxWager > 1000 && (
                  <button
                    type="button"
                    onClick={() => handleSliderChange(maxWager)}
                    className="text-xs bg-amber-500/20 text-[#ffcc00] hover:bg-amber-500/30 border border-[#ffcc00]/50 px-3 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    🔥 True Daily Double (${maxWager.toLocaleString()})
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onConfirmWager(wager)}
              className="w-full py-4 bg-gradient-to-r from-[#ffcc00] to-amber-500 hover:from-[#ffe066] hover:to-amber-400 text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-xl transition-transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>📢 Lock Wager & Reveal Clue for ${wager.toLocaleString()}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
