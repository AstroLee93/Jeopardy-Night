import React, { useState } from 'react';
import { Team } from './ScoreBoard';
import { X, Check, Plus, Minus, RotateCcw } from 'lucide-react';

interface ScoreEditorModalProps {
  teams: Team[];
  onSaveTeams: (updatedTeams: Team[]) => void;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['🏴‍☠️', '⚡', '🍃', '🗡️', '💥', '🍃', '🤖', '🔮', '🃏', '⚽', '🍥', '🍙', '🔥', '👑'];

export const ScoreEditorModal: React.FC<ScoreEditorModalProps> = ({
  teams,
  onSaveTeams,
  onClose
}) => {
  const [editedTeams, setEditedTeams] = useState<Team[]>(
    JSON.parse(JSON.stringify(teams))
  );

  const handleScoreChange = (teamId: number, newScore: number) => {
    setEditedTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, score: newScore } : t))
    );
  };

  const handleDelta = (teamId: number, delta: number) => {
    setEditedTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, score: t.score + delta } : t))
    );
  };

  const handleNameChange = (teamId: number, name: string) => {
    setEditedTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, name } : t))
    );
  };

  const handleAvatarChange = (teamId: number, avatar: string) => {
    setEditedTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, avatar } : t))
    );
  };

  const handleSave = () => {
    onSaveTeams(editedTeams);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div>
            <h2 className="font-jeopardy-display text-xl sm:text-2xl text-[#ffcc00] uppercase tracking-wider">
              Score Keeper & Team Editor
            </h2>
            <p className="text-xs text-slate-300">
              Quickly correct scores, rename teams, or pick custom anime badges
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Teams List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
          {editedTeams.map((team) => (
            <div
              key={team.id}
              className="bg-[#02052c] border border-slate-700 rounded-xl p-3.5 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  {/* Avatar Badge Selector */}
                  <select
                    value={team.avatar || '🏴‍☠️'}
                    onChange={(e) => handleAvatarChange(team.id, e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-base cursor-pointer"
                    title="Change team anime icon"
                  >
                    {AVATAR_OPTIONS.map((av) => (
                      <option key={av} value={av}>
                        {av}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => handleNameChange(team.id, e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-white outline-none focus:border-[#ffcc00] flex-1"
                  />
                </div>

                {/* Direct Number Input */}
                <div className="flex items-center gap-1.5">
                  <span className="font-jeopardy-display text-[#ffcc00] text-lg">$</span>
                  <input
                    type="number"
                    step={100}
                    value={team.score}
                    onChange={(e) => handleScoreChange(team.id, parseInt(e.target.value, 10) || 0)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-base font-jeopardy-display text-white text-right outline-none focus:border-[#ffcc00]"
                  />
                </div>
              </div>

              {/* Quick Delta Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Adjust:</span>
                {[+100, +200, +400, +600, +1000].map((amt) => (
                  <button
                    key={`p-${amt}`}
                    type="button"
                    onClick={() => handleDelta(team.id, amt)}
                    className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    +${amt}
                  </button>
                ))}
                {[-100, -200, -400, -600, -1000].map((amt) => (
                  <button
                    key={`m-${amt}`}
                    type="button"
                    onClick={() => handleDelta(team.id, amt)}
                    className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    -${Math.abs(amt)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleScoreChange(team.id, 0)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-colors cursor-pointer ml-auto"
                  title="Reset score to $0"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Scores
          </button>
        </div>
      </div>
    </div>
  );
};
