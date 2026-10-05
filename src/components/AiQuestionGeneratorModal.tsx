import React, { useState } from 'react';
import { JeopardyGameData, CategoryItem } from '../data/animeJeopardyData';
import { CURATED_BOARDS } from '../data/curatedAnimeBoards';
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  Download, 
  Copy, 
  X, 
  Zap,
  AlertCircle
} from 'lucide-react';

interface AiQuestionGeneratorModalProps {
  onApplyBoard: (newBoard: JeopardyGameData) => void;
  onApplyCategory?: (newCategory: CategoryItem) => void;
  onClose: () => void;
}

const THEME_PRESETS = [
  { id: 'all-stars', label: '🌟 Shonen All-Stars', desc: 'One Piece, Naruto, Dragon Ball, Bleach, Hunter x Hunter' },
  { id: 'modern', label: '🔥 Modern Mega-Hits', desc: 'Demon Slayer, Jujutsu Kaisen, My Hero Academia, Spy x Family' },
  { id: 'ghibli', label: '🍃 Studio Ghibli Magic', desc: 'Spirited Away, Totoro, Princess Mononoke, Howl\'s Castle' },
  { id: 'retro', label: '📼 90s & 2000s Classics', desc: 'Cowboy Bebop, Evangelion, Sailor Moon, Yu Yu Hakusho' },
  { id: 'family', label: '👨‍👩‍👧 Family Game Night', desc: 'Pokemon, Digimon, Studio Ghibli, Astro Boy, Detective Conan' },
  { id: 'otaku', label: '⚔️ Hardcore Otaku Lore', desc: 'Deep lore, creator trivia, Japanese voice actors, animation studios' }
];

export const AiQuestionGeneratorModal: React.FC<AiQuestionGeneratorModalProps> = ({
  onApplyBoard,
  onClose
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('all-stars');
  const [customTheme, setCustomTheme] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Family Friendly');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Generated Board Preview
  const [generatedBoard, setGeneratedBoard] = useState<JeopardyGameData | null>(null);
  const [selectedPreviewCat, setSelectedPreviewCat] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Clean error text from raw JSON or server responses
  const formatError = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.error) {
        if (typeof parsed.error === 'string') return parsed.error;
        if (parsed.error.message) return parsed.error.message;
      }
    } catch {
      // not JSON
    }
    return raw;
  };

  const handleGenerateBoard = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setNoticeMessage(null);
    // Ensure previous board is cleared so failed generation never displays any default or stale questions
    setGeneratedBoard(null);

    const presetObj = THEME_PRESETS.find(p => p.id === selectedPreset);
    const themeToSend = customTheme.trim() || (presetObj ? `${presetObj.label} (${presetObj.desc})` : 'Popular Anime');

    try {
      const res = await fetch('/api/ai/generate-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: themeToSend,
          difficulty
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        if (!res.ok) {
          if (res.status === 504 || rawText.includes('504 Gateway') || rawText.includes('Gateway Time-out')) {
            throw new Error('AI generation timed out (HTTP 504 Gateway Timeout). The model took longer than the server proxy allowed to draft all 30 clues. Please try again with a concise topic.');
          }
          if (res.status === 502 || rawText.includes('502 Bad Gateway') || rawText.includes('Bad Gateway')) {
            throw new Error('Upstream AI service error (HTTP 502 Bad Gateway). The proxy could not reach the generation service.');
          }
          throw new Error(`Server returned HTTP ${res.status}: ${res.statusText || 'Non-JSON response'}.`);
        }
        throw new Error('Server returned an unexpected non-JSON response.');
      }

      if (!res.ok) {
        const errorMsg = data?.error || (typeof data === 'string' ? data : `AI question generation failed (HTTP ${res.status}).`);
        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }

      if (data.notice) {
        setNoticeMessage(data.notice);
      }

      // Add fallback IDs if missing
      const formatted: JeopardyGameData = {
        title: data.title || 'Family Jeopardy',
        subtitle: data.subtitle || `${difficulty} Edition`,
        categories: (data.categories || []).map((cat: any, cIdx: number) => ({
          id: cat.id || `ai-cat-${cIdx}`,
          title: cat.title,
          description: cat.description || '',
          clues: (cat.clues || []).map((clue: any, clIdx: number) => ({
            id: clue.id || `ai-clue-${cIdx}-${clIdx}`,
            value: clue.value || (clIdx + 1) * 200,
            clue: clue.clue,
            answer: clue.answer,
            isDailyDouble: !!clue.isDailyDouble,
            image: clue.image || null,
            imageAlt: clue.imageAlt || clue.answer
          }))
        })),
        finalJeopardy: {
          category: data.finalJeopardy?.category || 'FINAL JEOPARDY',
          clue: data.finalJeopardy?.clue || 'Final clue prompt',
          answer: data.finalJeopardy?.answer || 'Final answer',
          image: data.finalJeopardy?.image || null
        }
      };

      setGeneratedBoard(formatted);
      setSelectedPreviewCat(0);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Generation failed.';
      setErrorMessage(formatError(msg));
      // Strictly ensure no board or default questions are shown
      setGeneratedBoard(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Instant fallback to curated set if API is busy
  const handleLoadInstantBoard = () => {
    setErrorMessage(null);
    let board = CURATED_BOARDS['all-stars'];
    if (selectedPreset === 'ghibli' || customTheme.toLowerCase().includes('ghibli')) {
      board = CURATED_BOARDS['ghibli'];
    }
    setGeneratedBoard(board);
    setSelectedPreviewCat(0);
    setNoticeMessage('Loaded curated 30-clue Jeopardy board instantly.');
  };

  const handleApply = () => {
    if (generatedBoard) {
      onApplyBoard(generatedBoard);
      onClose();
    }
  };

  const generateExportJs = (board: JeopardyGameData) => {
    return `// ==============================================================================
// ANIME JEOPARDY - AI GENERATED GAME DATA
// ==============================================================================
window.ANIME_JEOPARDY_DATA = ${JSON.stringify(board, null, 2)};
`;
  };

  const handleCopy = () => {
    if (!generatedBoard) return;
    navigator.clipboard.writeText(generateExportJs(generatedBoard));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedBoard) return;
    const text = generateExportJs(generatedBoard);
    const blob = new Blob([text], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-jeopardy-display text-xl sm:text-2xl text-white uppercase tracking-wider">
                AI Trivia Question Generator
              </h2>
              <p className="text-xs text-slate-300">
                Generate fresh, complete Family Jeopardy boards with automatic model failover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-left">
          {/* Step 1: Theme & Presets */}
          <div>
            <label className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider block mb-2">
              1. Choose an Anime Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {THEME_PRESETS.map((preset) => (
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
                Or type your own custom anime topic / franchise:
              </label>
              <input
                type="text"
                placeholder="e.g. Jujutsu Kaisen, Attack on Titan, Isekai Tropes, 80s Cyberpunk..."
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="w-full bg-[#02052c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ffcc00]"
              />
            </div>
          </div>

          {/* Step 2: Difficulty Selector */}
          <div>
            <label className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider block mb-2">
              2. Target Difficulty
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {['Family Friendly', 'Standard Jeopardy', 'Otaku Trivia Master'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-[#ffcc00] text-[#030852] border-[#ffcc00] shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Generate & Instant Fallback */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleGenerateBoard}
              disabled={isGenerating}
              className="flex-1 min-w-[240px] py-3.5 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-jeopardy-display text-lg uppercase tracking-wider rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Generating 30 Clues with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Generate 6 Categories with AI
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLoadInstantBoard}
              className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Instantly loads complete 30-clue board without waiting for AI API"
            >
              <Zap className="w-4 h-4 text-[#ffcc00]" /> Load Instant Board
            </button>
          </div>

          {/* Error Explanation Card */}
          {errorMessage && (
            <div className="p-4 bg-red-950/80 border-2 border-red-800 text-red-200 rounded-xl text-xs space-y-2.5 shadow-lg">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-sm text-red-200 block mb-1">
                    AI Question Generation Could Not Complete
                  </span>
                  <div className="p-2.5 bg-red-900/40 border border-red-800/60 rounded-lg text-xs text-red-100 font-mono leading-relaxed break-words">
                    {errorMessage}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2">
                    Fresh trivia questions could not be generated. Default/fallback questions have not been loaded.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-red-900/60 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateBoard}
                  className="px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Question Generation
                </button>
                <span className="text-[11px] text-slate-400">
                  Tip: Check server API key configuration or try a different topic.
                </span>
              </div>
            </div>
          )}

          {/* Notice Message */}
          {noticeMessage && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* Preview Generated Board */}
          {generatedBoard && (
            <div className="border border-slate-700 bg-slate-950/80 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                <div>
                  <h3 className="font-jeopardy-display text-lg text-[#ffcc00] uppercase">
                    {generatedBoard.title}
                  </h3>
                  <span className="text-xs text-slate-400">{generatedBoard.subtitle}</span>
                </div>
                <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                  ✓ 30 Clues + Final Jeopardy Ready
                </span>
              </div>

              {/* Category Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {generatedBoard.categories.map((cat, idx) => (
                  <button
                    key={cat.id || idx}
                    type="button"
                    onClick={() => setSelectedPreviewCat(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedPreviewCat === idx
                        ? 'bg-[#ffcc00] text-[#030852]'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}. {cat.title}
                  </button>
                ))}
              </div>

              {/* Clues Preview for Selected Category */}
              {generatedBoard.categories[selectedPreviewCat] && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    {generatedBoard.categories[selectedPreviewCat].description}
                  </div>
                  {generatedBoard.categories[selectedPreviewCat].clues.map((clue, idx) => (
                    <div
                      key={clue.id || idx}
                      className="bg-[#02052c] border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-jeopardy-display text-[#ffcc00] text-sm">
                          ${clue.value}
                        </span>
                        {clue.isDailyDouble && (
                          <span className="bg-amber-500/20 text-[#ffcc00] border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                            ⚡ DAILY DOUBLE
                          </span>
                        )}
                      </div>
                      <div className="text-white text-sm font-medium">{clue.clue}</div>
                      <div className="text-emerald-400 font-semibold mt-1">
                        Answer: {clue.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Final Jeopardy Preview */}
              <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/40 rounded-lg p-3 text-xs">
                <span className="font-bold text-[#ffcc00] uppercase block mb-1">
                  Final Jeopardy: {generatedBoard.finalJeopardy.category}
                </span>
                <div className="text-white mb-1">{generatedBoard.finalJeopardy.clue}</div>
                <div className="text-emerald-400 font-semibold">
                  Answer: {generatedBoard.finalJeopardy.answer}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between flex-wrap gap-2">
          {generatedBoard ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 border border-slate-600 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied code!' : 'Copy game-data.js'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold rounded-lg text-[#ffcc00] flex items-center gap-1.5 border border-amber-500/40 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download for Raspberry Pi
              </button>
            </div>
          ) : <div />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {generatedBoard && (
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" /> Apply to Current Game Night
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
