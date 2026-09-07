import type { CareerAiDifficulty, CareerRank, PromotionTarget } from '../types/career';

export const CAREER_RANK_ORDER: CareerRank[] = [
  'intern',
  'staff',
  'assistant',
  'manager',
  'deputy',
  'director',
  'executive',
  'ceo',
];

const DIFFICULTY_ORDER: Record<CareerAiDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

const PROMOTION_RULES: Partial<
  Record<CareerRank, { requiredWins: number; minAiDifficulty?: CareerAiDifficulty }>
> = {
  intern: { requiredWins: 3 },
  staff: { requiredWins: 5 },
  assistant: { requiredWins: 7 },
  manager: { requiredWins: 10 },
  deputy: { requiredWins: 5, minAiDifficulty: 'medium' },
  director: { requiredWins: 7, minAiDifficulty: 'hard' },
  executive: { requiredWins: 5, minAiDifficulty: 'hard' },
};

export function getNextRank(rank: CareerRank): CareerRank | null {
  const index = CAREER_RANK_ORDER.indexOf(rank);
  if (index < 0 || index >= CAREER_RANK_ORDER.length - 1) {
    return null;
  }
  return CAREER_RANK_ORDER[index + 1];
}

export function compareCareerAiDifficulty(
  current: CareerAiDifficulty,
  minimum: CareerAiDifficulty,
): boolean {
  return DIFFICULTY_ORDER[current] >= DIFFICULTY_ORDER[minimum];
}

export function getPromotionTarget(rank: CareerRank): PromotionTarget | null {
  const nextRank = getNextRank(rank);
  if (!nextRank) {
    return null;
  }

  const rule = PROMOTION_RULES[rank];
  if (!rule) {
    return null;
  }

  return {
    nextRank,
    requiredWins: rule.requiredWins,
    minAiDifficulty: rule.minAiDifficulty,
  };
}

export function rankIndex(rank: CareerRank): number {
  return CAREER_RANK_ORDER.indexOf(rank);
}

export function getRequirementToReachRank(rank: CareerRank): PromotionTarget | null {
  const index = CAREER_RANK_ORDER.indexOf(rank);
  if (index <= 0) {
    return null;
  }

  return getPromotionTarget(CAREER_RANK_ORDER[index - 1]);
}

export function isHigherRank(left: CareerRank, right: CareerRank): boolean {
  return rankIndex(left) > rankIndex(right);
}
