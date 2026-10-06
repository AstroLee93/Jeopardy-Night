/**
 * Family Feud Data Structures & Types
 */

export interface FeudAnswer {
  id: string;
  text: string;
  points: number; // e.g. 38, 26, 15, 11, 7 (Sums up to ~100)
  revealed?: boolean;
}

export interface FeudQuestion {
  id: string;
  question: string; // e.g. "We asked 100 anime fans: Name a character who eats an absurd amount of food."
  multiplier: 1 | 2 | 3; // 1x Single, 2x Double, 3x Triple
  answers: FeudAnswer[]; // 4 to 8 ranked survey answers
}

export interface FastMoneyItem {
  id: string;
  question: string;
  answers: Array<{ text: string; points: number }>;
}

export interface FeudGameData {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  rounds: FeudQuestion[];
  fastMoney: FastMoneyItem[];
}
