import React, { useState } from 'react';
import { JeopardyGameData } from '../data/animeJeopardyData';
import { ShieldCheck, X, Search, Printer, Trophy } from 'lucide-react';

interface HostSheetModalProps {
  gameData: JeopardyGameData;
  usedClues: Set<string>;
  onClose: () => void;
}

export const HostSheetModal: React.FC<HostSheetModalProps> = ({
  gameData,
  usedClues,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCategories = gameData.categories.filter((cat) => {
    if (selectedCategory !== 'all' && cat.id !== selectedCategory) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchesCat = cat.title.toLowerCase().includes(term);
    const matchesClues = cat.clues.some(
      (c) =>
        c.clue.toLowerCase().includes(term) ||
        c.answer.toLowerCase().includes(term)
    );
    return matchesCat || matchesClues;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/94 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-6xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-4 sm:p-7 shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-jeopardy-display text-xl sm:text-2xl text-white uppercase tracking-wider">
                  Host Admin & Answer Sheet
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-800 px-2 py-0.5 rounded">
                  Host Eyes Only
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Keep this open on your phone or tablet to verify team responses without spoiling answers on the TV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Host Answer Sheet"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clues, characters, or answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#02052c] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-white outline-none focus:border-[#ffcc00]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#02052c] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#ffcc00]"
          >
            <option value="all">All 6 Categories</option>
            {gameData.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Categories and Answers Grid */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-[#02052c] border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="border-b border-slate-800 pb-1.5 mb-2.5">
                    <span className="font-jeopardy-display text-sm sm:text-base text-[#ffcc00] uppercase block">
                      {category.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {category.description}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {category.clues.map((clue, idx) => {
                      const isUsed = usedClues.has(`${category.id}-${idx}`);
                      return (
                        <div
                          key={clue.id || idx}
                          className={`p-2 rounded-lg border text-xs transition-opacity ${
                            isUsed
                              ? 'bg-slate-900/40 border-slate-800 opacity-60'
                              : 'bg-slate-900/90 border-slate-700/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-jeopardy-display text-amber-300 font-bold">
                              ${clue.value}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {clue.isDailyDouble && (
                                <span className="bg-amber-500/20 text-[#ffcc00] border border-amber-500/40 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  DAILY DOUBLE
                                </span>
                              )}
                              {isUsed && (
                                <span className="text-[10px] text-slate-500">
                                  [Played]
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-300 text-[11px] mb-1.5 leading-relaxed">
                            {clue.clue}
                          </p>

                          <div className="bg-emerald-950/80 border border-emerald-800/80 rounded px-2 py-1 text-emerald-300 font-bold text-xs flex items-center gap-1">
                            <span>Ans:</span>
                            <span className="text-white font-medium">{clue.answer}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Jeopardy Host Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-[#02052c] to-amber-950/40 border-2 border-[#ffcc00]/60 rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-[#ffcc00]" />
              <h3 className="font-jeopardy-display text-lg text-[#ffcc00] uppercase tracking-wider">
                Final Jeopardy: {gameData.finalJeopardy.category}
              </h3>
            </div>
            <p className="text-white text-sm mb-2">{gameData.finalJeopardy.clue}</p>
            <div className="inline-block bg-emerald-950 border border-emerald-700 rounded-lg px-3 py-1.5 text-emerald-300 font-bold text-sm">
              Correct Answer: <span className="text-white">{gameData.finalJeopardy.answer}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Access this admin sheet from any device on your Wi-Fi at <code className="text-amber-300 font-mono">http://&lt;ip&gt;:8080</code></span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
