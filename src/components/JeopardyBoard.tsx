import React, { useEffect, useMemo, useRef } from 'react';
import type { CategoryItem } from '../data/animeJeopardyData';
import { Image as ImageIcon } from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

interface JeopardyBoardProps {
  categories: CategoryItem[];
  usedClues: Set<string>;
  onSelectClue: (catIndex: number, clueIndex: number) => void;
  round?: number;
}

const FILL_MS = 1400;

export const JeopardyBoard: React.FC<JeopardyBoardProps> = ({
  categories,
  usedClues,
  onSelectClue,
  round = 1
}) => {
  // A new board (new round or new deck) gets the classic random tile fill-in.
  const boardKey = `${round}:${categories.map((c) => c.id).join('|')}`;

  const fillDelays = useMemo(() => {
    const cells = categories.length * 5;
    const order = Array.from({ length: cells }, (_, i) => i).sort(() => Math.random() - 0.5);
    const delays: number[] = new Array(cells);
    order.forEach((cellIdx, n) => (delays[cellIdx] = 300 + (n / cells) * FILL_MS));
    return delays;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardKey]);

  const lastFilled = useRef<string>('');
  useEffect(() => {
    if (lastFilled.current === boardKey) return;
    lastFilled.current = boardKey;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 14; i++) {
      timers.push(setTimeout(() => soundFx.playBoardFillTick(), 300 + (i * FILL_MS) / 14));
    }
    return () => timers.forEach(clearTimeout);
  }, [boardKey]);

  return (
    <div className="w-full flex-1 flex flex-col justify-center" key={boardKey}>
      <div className="jeopardy-board grid grid-cols-6 gap-1.5 md:gap-2.5 p-1.5 md:p-2.5 rounded-xl shadow-2xl">
        {/* Category Headers — revealed one at a time after the tiles fill in */}
        {categories.map((category, colIdx) => (
          <div
            key={category.id}
            className="category-cell rounded-md p-2 md:p-3 min-h-[64px] md:min-h-[90px] flex items-center justify-center text-center"
            style={{ animationDelay: `${FILL_MS + 400 + colIdx * 260}ms` }}
            title={category.description}
          >
            <h3 className="font-jeopardy-display text-white text-[0.65rem] sm:text-sm md:text-base lg:text-xl leading-tight uppercase">
              {category.title}
            </h3>
          </div>
        ))}

        {/* 5 Rows of Clues */}
        {[0, 1, 2, 3, 4].map((rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            {categories.map((category, colIdx) => {
              const clue = category.clues[rowIdx];
              const clueKey = `${category.id}-${rowIdx}`;
              const isUsed = usedClues.has(clueKey);

              return (
                <button
                  key={clueKey}
                  data-clue-cell={`${colIdx}-${rowIdx}`}
                  disabled={isUsed || !clue}
                  onClick={() => onSelectClue(colIdx, rowIdx)}
                  style={{ animationDelay: `${fillDelays[rowIdx * categories.length + colIdx] ?? 0}ms` }}
                  aria-label={clue ? `${category.title} for $${clue.value}` : 'Empty'}
                  className={`clue-cell relative min-h-[58px] sm:min-h-[72px] md:min-h-[92px] rounded-md flex items-center justify-center ${
                    isUsed ? 'clue-cell-used cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {!isUsed && clue && (
                    <>
                      <span className="dollar-value font-jeopardy-value text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                        <span className="dollar-sign">$</span>
                        {clue.value.toLocaleString()}
                      </span>
                      {clue.image && (
                        <span title="Clue includes image" className="absolute top-1 right-1.5 text-amber-300 opacity-40">
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
