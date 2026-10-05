import React, { useEffect } from 'react';
import { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
import { Trophy, RotateCcw } from 'lucide-react';

interface PodiumScreenProps {
  teams: Team[];
  onRestart: () => void;
}

export const PodiumScreen: React.FC<PodiumScreenProps> = ({ teams, onRestart }) => {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  useEffect(() => {
    soundFx.playCorrect();
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-gradient-to-b from-[#0b15c9] via-[#04097a] to-[#020536] border-4 border-[#ffcc00] rounded-2xl p-6 sm:p-10 shadow-2xl text-center">
        <div className="text-6xl sm:text-7xl mb-2 animate-bounce">🏆</div>
        
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300 mb-1">
          Family Jeopardy Champion
        </h2>
        
        <h1 className="font-jeopardy-display text-4xl sm:text-6xl text-[#ffcc00] uppercase tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2">
          {winner.name}
        </h1>

        <div className="text-2xl sm:text-3xl font-jeopardy-display text-white mb-8">
          Final Score: <span className="text-[#ffcc00]">${winner.score.toLocaleString()}</span>
        </div>

        {/* Podium Pillars */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 my-6 min-h-[200px]">
          {/* 2nd Place */}
          {sorted[1] && (
            <div className="w-24 sm:w-32 bg-gradient-to-b from-slate-400/20 to-slate-800 border-2 border-slate-300 rounded-t-xl p-3 flex flex-col items-center h-36 justify-between shadow-lg">
              <span className="text-lg font-bold text-slate-300">🥈 2nd</span>
              <div className="w-full text-center">
                <span className="text-xs font-semibold text-white block truncate">{sorted[1].name}</span>
                <span className="font-jeopardy-display text-sm sm:text-base text-amber-300">
                  ${sorted[1].score.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          <div className="w-28 sm:w-36 bg-gradient-to-b from-amber-400/30 to-[#020536] border-4 border-[#ffcc00] rounded-t-xl p-3 flex flex-col items-center h-48 justify-between shadow-[0_0_30px_rgba(255,204,0,0.4)]">
            <span className="text-2xl font-bold text-[#ffcc00]">👑 1st</span>
            <div className="w-full text-center">
              <span className="text-sm font-bold text-white block truncate">{winner.name}</span>
              <span className="font-jeopardy-display text-lg sm:text-xl text-[#ffcc00]">
                ${winner.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 3rd Place */}
          {sorted[2] && (
            <div className="w-24 sm:w-32 bg-gradient-to-b from-amber-800/20 to-slate-800 border-2 border-amber-600 rounded-t-xl p-3 flex flex-col items-center h-28 justify-between shadow-lg">
              <span className="text-base font-bold text-amber-500">🥉 3rd</span>
              <div className="w-full text-center">
                <span className="text-xs font-semibold text-white block truncate">{sorted[2].name}</span>
                <span className="font-jeopardy-display text-sm sm:text-base text-amber-300">
                  ${sorted[2].score.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* All Team Scores Table */}
        <div className="max-w-md mx-auto bg-black/40 border border-slate-700 rounded-xl p-3 mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Final Standings
          </div>
          <div className="space-y-1 text-sm">
            {sorted.map((t, idx) => (
              <div key={t.id} className="flex justify-between items-center py-1 border-b border-slate-800 last:border-none">
                <span className="font-medium text-slate-300 truncate">
                  #{idx + 1} {t.name}
                </span>
                <span className="font-jeopardy-display text-[#ffcc00] tabular-nums">
                  ${t.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 py-3 px-8 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-xl uppercase tracking-wider rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" /> Start New Game
        </button>
      </div>
    </div>
  );
};
