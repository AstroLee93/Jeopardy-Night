import React, { useState } from 'react';
import { FeudGameData } from '../data/familyFeudData';
import { CURATED_FEUD_GAMES } from '../data/curatedFeudData';
import { Sparkles, RefreshCw, Check, X, AlertCircle, Trophy, HelpCircle } from 'lucide-react';

interface AiFeudGeneratorModalProps {
  onApplyFeudGame: (newGame: FeudGameData) => void;
  onClose: () => void;
}

const FEUD_THEME_PRESETS = [
  { id: 'anime-all-stars', label: '🌟 Anime All-Stars Feud', desc: 'Dragon Ball, One Piece, Naruto, tropes, and fan favorites' },
  { id: 'classic-family', label: '🏡 Classic Family Game Night', desc: 'Household items, everyday excuses, funny family habits' },
  { id: 'gaming', label: '🎮 Video Games & Retro Consoles', desc: 'Nintendo, PlayStation, boss fights, Pokémon, gaming tropes' },
  { id: 'movies', label: '🍿 Blockbuster Cinema & Superheroes', desc: 'Marvel, Star Wars, animated classics, movie night tropes' },
];

export const AiFeudGeneratorModal: React.FC<AiFeudGeneratorModalProps> = ({
  onApplyFeudGame,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('anime-all-stars');
  const [customTheme, setCustomTheme] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedGame, setGeneratedGame] = useState<FeudGameData | null>(null);
  const [selectedPreviewRound, setSelectedPreviewRound] = useState<number>(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    const themeToGenerate = customTheme.trim() || selectedPreset;

    try {
      const response = await fetch('/api/ai/generate-feud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: themeToGenerate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed (HTTP ${response.status})`);
      }

      const data: FeudGameData = await response.json();
      setGeneratedGame(data);
      setSelectedPreviewRound(0);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadCurated = (key: string) => {
    const curated = CURATED_FEUD_GAMES[key] || CURATED_FEUD_GAMES['anime-all-stars'];
    setGeneratedGame(curated);
    setSelectedPreviewRound(0);
  };

  const handleApply = () => {
    if (generatedGame) {
      onApplyFeudGame(generatedGame);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#030833] border-2 border-amber-500/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-[#ffcc00] to-amber-600 p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#02052c]" />
            <h2 className="font-jeopardy-display text-lg sm:text-xl text-[#02052c] tracking-wider uppercase">
              Family Feud Survey Generator
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#02052c] text-[#ffcc00] flex items-center justify-center hover:scale-105 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider block mb-2">
              1. Choose a Survey Theme or Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEUD_THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setCustomTheme('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPreset === preset.id && !customTheme
                      ? 'bg-amber-500/20 border-[#ffcc00] shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-0.5">{preset.label}</div>
                  <div className="text-[11px] text-slate-400 leading-tight">{preset.desc}</div>
                </button>
              ))}
            </div>

            {/* Custom Theme Prompt */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Or type your own custom Family Feud theme:
              </label>
              <input
                type="text"
                placeholder="e.g. 90s Saturday Morning Cartoons, Marvel vs DC, High School Excuses..."
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="w-full bg-[#02052c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ffcc00]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#030852] flex items-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Surveying 100 People (Generating AI Rounds)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Feud Survey (5 Rounds)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleLoadCurated(selectedPreset)}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all"
            >
              ⚡ Instant Load Curated Set
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-xl flex items-center gap-2 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview of Generated Game */}
          {generatedGame && (
            <div className="border border-amber-500/30 bg-[#02052c] rounded-xl p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-base text-[#ffcc00]">{generatedGame.title}</h3>
                  <p className="text-xs text-slate-400">{generatedGame.subtitle || generatedGame.theme}</p>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[11px] font-bold">
                  {generatedGame.rounds.length} Rounds Ready
                </span>
              </div>

              {/* Round Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {generatedGame.rounds.map((round, rIdx) => (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => setSelectedPreviewRound(rIdx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      selectedPreviewRound === rIdx
                        ? 'bg-[#ffcc00] text-[#02052c]'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    R{rIdx + 1} ({round.multiplier}x)
                  </button>
                ))}
              </div>

              {/* Selected Round Answers Preview */}
              {generatedGame.rounds[selectedPreviewRound] && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {generatedGame.rounds[selectedPreviewRound].question}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {generatedGame.rounds[selectedPreviewRound].answers.map((ans, aIdx) => (
                      <div
                        key={aIdx}
                        className="bg-black/50 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">
                          <strong className="text-amber-400 mr-1.5">{aIdx + 1}.</strong> {ans.text}
                        </span>
                        <span className="font-mono font-bold text-[#ffcc00] bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {ans.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#02052c] border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {generatedGame ? 'Ready to play on TV & Host screen.' : 'Select a theme and generate survey answers.'}
          </span>
          <div className="flex items-center gap-2">
            {generatedGame && (
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#ffcc00]" />
                <span>Apply to Family Feud Board</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
