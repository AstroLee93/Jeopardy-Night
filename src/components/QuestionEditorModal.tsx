import React, { useState } from 'react';
import { JeopardyGameData, ClueItem } from '../data/animeJeopardyData';
import { AiQuestionGeneratorModal } from './AiQuestionGeneratorModal';
import { Copy, Check, Download, Edit3, X, Save, Sparkles, Image as ImageIcon } from 'lucide-react';

interface QuestionEditorModalProps {
  gameData: JeopardyGameData;
  onSaveData: (updated: JeopardyGameData) => void;
  onClose: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  gameData,
  onSaveData,
  onClose
}) => {
  const [data, setData] = useState<JeopardyGameData>(JSON.parse(JSON.stringify(gameData)));
  const [selectedCatIdx, setSelectedCatIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [showAiGenerator, setShowAiGenerator] = useState<boolean>(false);

  const activeCategory = data.categories[selectedCatIdx];

  const handleUpdateClue = (clueIdx: number, field: keyof ClueItem, value: any) => {
    setData((prev) => {
      const copy = { ...prev };
      const cat = copy.categories[selectedCatIdx];
      const clue = { ...cat.clues[clueIdx], [field]: value };
      cat.clues[clueIdx] = clue;
      return copy;
    });
  };

  const handleUpdateCategoryTitle = (title: string) => {
    setData((prev) => {
      const copy = { ...prev };
      copy.categories[selectedCatIdx].title = title;
      return copy;
    });
  };

  const generateExportJs = () => {
    return `// ==============================================================================
// ANIME JEOPARDY - EXPORTED GAME DATA
// ==============================================================================
window.ANIME_JEOPARDY_DATA = ${JSON.stringify(data, null, 2)};
`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateExportJs());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generateExportJs();
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

  const handleSaveAndApply = () => {
    onSaveData(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-4 sm:p-7 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-jeopardy-display text-xl sm:text-2xl text-white uppercase tracking-wider">
                Trivia Editor & Customizer
              </h2>
              <p className="text-xs text-slate-300">
                Manually edit clues or generate new topics with Gemini AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiGenerator(true)}
              className="px-3 py-1.5 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Questions with AI</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-4 overflow-x-auto">
          {data.categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCatIdx === idx
                  ? 'bg-[#ffcc00] text-[#030852] font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cat {idx + 1}: {cat.title}
            </button>
          ))}
        </div>

        {/* Category Editor Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
          {activeCategory && (
            <div className="space-y-4">
              {/* Category Title Input */}
              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-3">
                <label className="text-xs font-bold text-[#ffcc00] uppercase tracking-wider block mb-1">
                  Category {selectedCatIdx + 1} Title
                </label>
                <input
                  type="text"
                  value={activeCategory.title}
                  onChange={(e) => handleUpdateCategoryTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-jeopardy-display text-lg outline-none focus:border-[#ffcc00]"
                />
              </div>

              {/* 5 Clues */}
              <div className="space-y-3">
                {activeCategory.clues.map((clue, clueIdx) => (
                  <div
                    key={clue.id || clueIdx}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-jeopardy-display text-[#ffcc00] text-lg">
                          ${clue.value} Clue
                        </span>
                        {clue.image && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                            <ImageIcon className="w-3 h-3" /> Image Clue
                          </span>
                        )}
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-amber-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!clue.isDailyDouble}
                          onChange={(e) => handleUpdateClue(clueIdx, 'isDailyDouble', e.target.checked)}
                          className="rounded text-[#ffcc00]"
                        />
                        Is Daily Double
                      </label>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        Clue Prompt
                      </label>
                      <textarea
                        rows={2}
                        value={clue.clue}
                        onChange={(e) => handleUpdateClue(clueIdx, 'clue', e.target.value)}
                        className="w-full bg-[#02052c] border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-[#ffcc00]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                          Correct Response (Answer)
                        </label>
                        <input
                          type="text"
                          value={clue.answer}
                          onChange={(e) => handleUpdateClue(clueIdx, 'answer', e.target.value)}
                          className="w-full bg-[#02052c] border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#ffcc00]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                          Image Path / URL (e.g. /images/character.jpg)
                        </label>
                        <input
                          type="text"
                          placeholder="/images/your-pic.jpg"
                          value={clue.image || ''}
                          onChange={(e) => handleUpdateClue(clueIdx, 'image', e.target.value || null)}
                          className="w-full bg-[#02052c] border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-amber-300 outline-none focus:border-[#ffcc00]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 border border-slate-600 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied code!' : 'Copy game-data.js'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold rounded-lg text-[#ffcc00] flex items-center gap-1.5 border border-amber-500/40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download game-data.js
            </button>
          </div>

          <button
            onClick={handleSaveAndApply}
            className="px-5 py-2 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> Apply Changes to Game
          </button>
        </div>
      </div>

      {/* Embedded AI Question Generator Modal */}
      {showAiGenerator && (
        <AiQuestionGeneratorModal
          onApplyBoard={(newBoard) => {
            setData(newBoard);
            setShowAiGenerator(false);
          }}
          onClose={() => setShowAiGenerator(false)}
        />
      )}
    </div>
  );
};
