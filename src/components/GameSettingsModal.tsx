import React from 'react';
import { soundFx } from '../utils/audioSynth';
import { X, Volume2, Tv, Sparkles, Trash2, Check } from 'lucide-react';

interface GameSettingsModalProps {
  volume: number;
  onVolumeChange: (newVol: number) => void;
  isTvSafeMode: boolean;
  onToggleTvSafeMode: () => void;
  isLargeTextMode: boolean;
  onToggleLargeTextMode: () => void;
  onClearSavedGame: () => void;
  hasSavedGame: boolean;
  onClose: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  volume,
  onVolumeChange,
  isTvSafeMode,
  onToggleTvSafeMode,
  isLargeTextMode,
  onToggleLargeTextMode,
  onClearSavedGame,
  hasSavedGame,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="font-jeopardy-display text-xl text-[#ffcc00] uppercase tracking-wider">
              Game Night & TV Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-4 text-left">
          {/* Master Sound Volume */}
          <div className="bg-[#02052c] border border-slate-700 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#ffcc00]" /> Sound Volume ({Math.round(volume * 100)}%)
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFx.initCtx();
                  soundFx.playCluePing();
                }}
                className="text-[11px] text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 cursor-pointer"
              >
                Test Chime 🔔
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-[#ffcc00] cursor-pointer"
            />
          </div>

          {/* TV Overscan Safe Area */}
          <div className="bg-[#02052c] border border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-cyan-400" /> TV Overscan Safe Area
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adds 4% outer margin so edges aren't cut off on HDMI television displays
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTvSafeMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isTvSafeMode
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isTvSafeMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Large Text / Couch Distance Mode */}
          <div className="bg-[#02052c] border border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Big Screen High-Contrast Text
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enlarges clue fonts and board numbers for reading across the living room
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleLargeTextMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isLargeTextMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isLargeTextMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* LocalStorage Auto-Save State */}
          <div className="bg-[#02052c] border border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                💾 Auto-Save Recovery
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasSavedGame
                  ? 'Active game state is saved in browser storage'
                  : 'Saves teams, scores, and opened clues in real time'}
              </p>
            </div>
            {hasSavedGame && (
              <button
                type="button"
                onClick={onClearSavedGame}
                className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Clear saved game progress"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Save
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" /> Done
          </button>
        </div>
      </div>
    </div>
  );
};
