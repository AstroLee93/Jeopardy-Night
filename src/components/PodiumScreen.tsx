import React, { useEffect, useState } from 'react';
import { Team } from './ScoreBoard';
import { soundFx } from '../utils/audioSynth';
import { Trophy, RotateCcw, Sparkles, Play, Check } from 'lucide-react';

interface PodiumScreenProps {
  teams: Team[];
  onRestart: () => void;
  onPlayAgainSameTeams?: () => void;
  onResetScores?: () => void;
}

export const PodiumScreen: React.FC<PodiumScreenProps> = ({
  teams,
  onRestart,
  onPlayAgainSameTeams,
  onResetScores
}) => {
  const [scoresClearedFeedback, setScoresClearedFeedback] = useState(false);
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const winner = sorted[0] || { id: 1, name: 'Champion', score: 0, avatar: '👑' };

  useEffect(() => {
    soundFx.playCorrect();
  }, []);

  const handleManualResetScores = () => {
    if (onResetScores) {
      onResetScores();
      setScoresClearedFeedback(true);
      setTimeout(() => setScoresClearedFeedback(false), 2500);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-gradient-to-b from-[#0b15c9] via-[#04097a] to-[#020536] border-4 border-[#ffcc00] rounded-2xl p-6 sm:p-10 shadow-2xl text-center">
        <div className="text-6xl sm:text-7xl mb-2 animate-bounce">🏆</div>
        
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300 mb-1">
          Family Jeopardy Champion
        </h2>
        
        <h1 className="font-jeopardy-display text-4xl sm:text-6xl text-[#ffcc00] uppercase tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2">
          {winner.avatar || '👑'} {winner.name}
        </h1>

        <div className="text-2xl sm:text-3xl font-jeopardy-display text-white mb-6">
          Final Score: <span className="text-[#ffcc00]">${winner.score.toLocaleString()}</span>
        </div>

        {scoresClearedFeedback && (
          <div className="mb-4 py-2 px-4 bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>All team scores have been reset to $0 across all screens!</span>
          </div>
        )}

        {/* Podium Pillars */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 my-6 min-h-[190px]">
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
        <div className="max-w-md mx-auto bg-black/40 border border-slate-700 rounded-xl p-3 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Final Standings
          </div>
          <div className="space-y-1 text-sm">
            {sorted.map((t, idx) => (
              <div key={t.id} className="flex justify-between items-center py-1 border-b border-slate-800 last:border-none">
                <span className="font-medium text-slate-300 truncate flex items-center gap-1.5">
                  <span>#{idx + 1}</span>
                  <span>{t.avatar || ''}</span>
                  <span>{t.name}</span>
                </span>
                <span className="font-jeopardy-display text-[#ffcc00] tabular-nums">
                  ${t.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Scores & Restart Action Buttons */}
        <div className="bg-black/50 border border-slate-700/80 rounded-2xl p-4 sm:p-5 mt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Post-Game Options & Score Controls
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            {onResetScores && (
              <button
                type="button"
                onClick={handleManualResetScores}
                title="Clears all scores back to $0 immediately across all screens without leaving this screen"
                className="w-full sm:w-auto py-3 px-6 bg-red-700 hover:bg-red-600 text-white font-bold text-sm sm:text-base rounded-xl border-2 border-red-400 shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Scores to $0</span>
              </button>
            )}

            {onPlayAgainSameTeams && (
              <button
                type="button"
                onClick={onPlayAgainSameTeams}
                title="Keeps the current team names, clears scores to $0, and reloads fresh board"
                className="w-full sm:w-auto py-3 px-6 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-base sm:text-lg uppercase tracking-wider rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" /> Play Again (Fresh Board, $0)
              </button>
            )}

            <button
              type="button"
              onClick={onRestart}
              title="Clears all scores to $0 and returns to the game setup screen"
              className="w-full sm:w-auto py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl border border-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" /> Start New Game (Setup)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
