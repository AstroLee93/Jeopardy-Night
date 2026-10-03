import React from 'react';
import { CategoryItem } from '../data/animeJeopardyData';
import { Image as ImageIcon } from 'lucide-react';

interface JeopardyBoardProps {
  categories: CategoryItem[];
  usedClues: Set<string>;
  onSelectClue: (catIndex: number, clueIndex: number) => void;
}

export const JeopardyBoard: React.FC<JeopardyBoardProps> = ({
  categories,
  usedClues,
  onSelectClue
}) => {
  return (
    <div className="w-full flex-1 flex flex-col justify-center">
      <div className="grid grid-cols-6 gap-2 md:gap-3 bg-[#02052c] p-2 md:p-3 border-2 md:border-4 border-[#ffcc00] rounded-xl shadow-2xl">
        {/* Category Headers */}
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-gradient-to-b from-[#0b15ff] to-[#0409a3] border-2 border-[#00044d] rounded-lg p-2 md:p-3 min-h-[64px] md:min-h-[82px] flex items-center justify-center text-center shadow-md"
          >
            <h3 className="font-jeopardy-display text-white text-xs sm:text-sm md:text-base lg:text-lg leading-tight uppercase drop-shadow-md">
              {category.title}
            </h3>
          </div>
        ))}

        {/* 5 Rows of Clues ($200 - $1000) */}
        {[0, 1, 2, 3, 4].map((rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            {categories.map((category, colIdx) => {
              const clue = category.clues[rowIdx];
              const clueKey = `${category.id}-${rowIdx}`;
              const isUsed = usedClues.has(clueKey);

              return (
                <button
                  key={clueKey}
                  disabled={isUsed || !clue}
                  onClick={() => onSelectClue(colIdx, rowIdx)}
                  className={`relative min-h-[58px] sm:min-h-[72px] md:min-h-[88px] rounded-lg border-2 transition-all duration-150 flex items-center justify-center ${
                    isUsed
                      ? 'bg-[#020522] border-transparent opacity-20 cursor-default'
                      : 'bg-gradient-to-b from-[#080fe8] to-[#030794] border-[#00044d] hover:from-[#111aff] hover:to-[#050bbd] hover:scale-[1.02] hover:shadow-[0_0_16px_rgba(255,204,0,0.5)] cursor-pointer active:scale-95'
                  }`}
                >
                  {!isUsed && clue && (
                    <>
                      <span className="font-jeopardy-display text-[#ffcc00] text-xl sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider">
                        ${clue.value}
                      </span>
                      {clue.image && (
                        <span
                          title="Clue includes image"
                          className="absolute top-1 right-1.5 text-amber-300 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
