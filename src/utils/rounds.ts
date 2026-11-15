import type { CategoryItem, JeopardyGameData } from '../data/animeJeopardyData';
import { CURATED_BOARDS } from '../data/curatedAnimeBoards';
import { INITIAL_ANIME_DATA } from '../data/animeJeopardyData';

export type RoundNumber = 1 | 2;

export const ROUND_VALUES: Record<RoundNumber, number[]> = {
  1: [200, 400, 600, 800, 1000],
  2: [400, 800, 1200, 1600, 2000]
};

/** Max Daily Double wager floor for a round (the top board value). */
export const roundWagerFloor = (round: RoundNumber) => (round === 2 ? 2000 : 1000);

/**
 * Hide Daily Doubles like the show does: never two in the same column, and
 * weighted heavily toward the 3rd–5th rows where they historically land.
 */
export function placeDailyDoubles(categories: CategoryItem[], count: number): CategoryItem[] {
  const rowWeights = [0.02, 0.1, 0.28, 0.35, 0.25];
  const cols = categories.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, count);
  const pickRow = () => {
    let r = Math.random();
    for (let i = 0; i < rowWeights.length; i++) {
      r -= rowWeights[i];
      if (r <= 0) return i;
    }
    return 3;
  };
  const ddMap = new Map<number, number>();
  cols.forEach((c) => ddMap.set(c, pickRow()));
  return categories.map((cat, ci) => ({
    ...cat,
    clues: cat.clues.map((clue, ri) => ({ ...clue, isDailyDouble: ddMap.get(ci) === ri }))
  }));
}

const withValues = (categories: CategoryItem[], round: RoundNumber, idSuffix: string): CategoryItem[] =>
  categories.map((cat) => ({
    ...cat,
    id: `${cat.id}${idSuffix}`,
    clues: cat.clues.map((clue, ri) => ({ ...clue, value: ROUND_VALUES[round][ri] ?? clue.value }))
  }));

/**
 * Build the Double Jeopardy board. Uses `gameData.doubleJeopardy` if the
 * board author supplied one, otherwise borrows a different curated board so
 * every game night gets a fresh second round out of the box.
 */
export function buildDoubleJeopardy(gameData: JeopardyGameData): CategoryItem[] {
  let source = gameData.doubleJeopardy;
  if (!source || source.length === 0) {
    const currentIds = new Set(gameData.categories.map((c) => c.id.replace(/-dj$/, '')));
    const pool = [...Object.values(CURATED_BOARDS), INITIAL_ANIME_DATA].filter(
      (b) => !b.categories.some((c) => currentIds.has(c.id))
    );
    const chosen = pool.length ? pool[Math.floor(Math.random() * pool.length)] : gameData;
    source = chosen.categories;
  }
  return placeDailyDoubles(withValues(source.slice(0, 6), 2, '-dj'), 2);
}

export const isBoardCleared = (categories: CategoryItem[], used: Set<string>) =>
  categories.every((cat) => cat.clues.every((_, ri) => used.has(`${cat.id}-${ri}`)));
