import React from 'react';
import { Plus, Minus, Edit2 } from 'lucide-react';

export interface Team {
  id: number;
  name: string;
  score: number;
  avatar?: string;
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
  onOpenScoreEditor?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  teams,
  activeTeamId,
  onAdjustScore,
  onSelectTeam,
  onOpenScoreEditor
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex items-stretch justify-center gap-2 sm:gap-3 flex-wrap py-2">
        {teams.map((team) => {
          const isActive = activeTeamId === team.id;
          const isNegative = team.score < 0;

          return (
            <div
              key={team.id}
              onClick={() => onSelectTeam && onSelectTeam(team.id)}
              style={{ borderTopColor: team.color.border }}
              className={`flex-1 min-w-[150px] max-w-[220px] bg-gradient-to-b from-[#071066] to-[#020638] border-2 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-between shadow-lg transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] scale-105'
                  : 'border-[#ffcc00]/60 hover:border-[#ffcc00]'
              }`}
            >
              <div className="w-full text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="text-base select-none">{team.avatar || '🏴‍☠️'}</span>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider truncate max-w-[120px]">
                    {team.name}
                  </span>
                </div>
                <div
                  className={`font-jeopardy-display text-2xl sm:text-3xl tabular-nums font-bold tracking-tight drop-shadow-md my-1 ${
                    isNegative ? 'text-red-400' : 'text-[#ffcc00]'
                  }`}
                >
                  ${team.score.toLocaleString()}
                </div>
              </div>

              {/* Quick manual score adjustments */}
              <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onAdjustScore(team.id, -200)}
                  className="w-7 h-6 rounded bg-slate-800/80 hover:bg-red-900/60 text-slate-300 hover:text-red-300 border border-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Deduct $200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onAdjustScore(team.id, 200)}
                  className="w-7 h-6 rounded bg-slate-800/80 hover:bg-emerald-900/60 text-slate-300 hover:text-emerald-300 border border-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Add $200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {onOpenScoreEditor && (
                  <button
                    type="button"
                    onClick={onOpenScoreEditor}
                    className="w-7 h-6 rounded bg-slate-800/80 hover:bg-amber-900/60 text-slate-400 hover:text-amber-300 border border-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer ml-0.5"
                    title="Edit custom score or rename team"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
