import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface Team {
  id: number;
  name: string;
  score: number;
  color: {
    bg: string;
    border: string;
  };
}

interface ScoreBoardProps {
  teams: Team[];
  activeTeamId?: number | null;
  onAdjustScore: (teamId: number, delta: number) => void;
  onSelectTeam?: (teamId: number) => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  teams,
  activeTeamId,
  onAdjustScore,
  onSelectTeam
}) => {
  return (
    <div className="w-full flex items-stretch justify-center gap-2 sm:gap-3 flex-wrap py-2">
      {teams.map((team) => {
        const isActive = activeTeamId === team.id;
        const isNegative = team.score < 0;

        return (
          <div
            key={team.id}
            onClick={() => onSelectTeam && onSelectTeam(team.id)}
            style={{ borderTopColor: team.color.border }}
            className={`flex-1 min-w-[150px] max-w-[220px] bg-gradient-to-b from-[#071066] to-[#020638] border-2 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-between shadow-lg transition-all duration-150 ${
              isActive
                ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] scale-105'
                : 'border-[#ffcc00]/60'
            }`}
          >
            <div className="w-full text-center">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block truncate">
                {team.name}
              </span>
              <div
                className={`font-jeopardy-display text-2xl sm:text-3xl tabular-nums font-bold tracking-tight drop-shadow-md my-1 ${
                  isNegative ? 'text-red-400' : 'text-[#ffcc00]'
                }`}
              >
                ${team.score.toLocaleString()}
              </div>
            </div>

            {/* Quick manual score adjustments */}
            <div className="flex items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustScore(team.id, -200);
                }}
                className="w-7 h-6 rounded bg-slate-800/80 hover:bg-red-900/60 text-slate-300 hover:text-red-300 border border-slate-700 flex items-center justify-center text-xs transition-colors"
                title="Deduct $200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustScore(team.id, 200);
                }}
                className="w-7 h-6 rounded bg-slate-800/80 hover:bg-emerald-900/60 text-slate-300 hover:text-emerald-300 border border-slate-700 flex items-center justify-center text-xs transition-colors"
                title="Add $200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
