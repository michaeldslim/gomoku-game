import type { AIDifficulty } from '../utils/aiLogic';
import type { CareerAiDifficulty, CareerRank } from '../types/career';
import { expertTopPoolForCareerTier, resolveCareerAiDifficulty } from './careerAiMapping';
import { compareCareerAiDifficulty, getPromotionTarget, rankIndex } from './careerRules';

const DEPUTY_RANK_INDEX = rankIndex('deputy');

export function isCareerRankDeputyOrHigher(rank: CareerRank): boolean {
  return rankIndex(rank) >= DEPUTY_RANK_INDEX;
}

export function getPromotionMinDifficulty(rank: CareerRank): CareerAiDifficulty | null {
  return getPromotionTarget(rank)?.minAiDifficulty ?? null;
}

export interface ExpertPoolSuggestion {
  recommendedExpertTopPool: number;
  recommendedTier: CareerAiDifficulty;
  needsExpertMode: boolean;
}

export function getExpertPoolSuggestion(
  rank: CareerRank,
  aiDifficulty: AIDifficulty,
  expertTopPool: number,
): ExpertPoolSuggestion | null {
  if (!isCareerRankDeputyOrHigher(rank)) {
    return null;
  }

  const minRequired = getPromotionMinDifficulty(rank);
  if (!minRequired) {
    return null;
  }

  const currentTier = resolveCareerAiDifficulty(aiDifficulty, expertTopPool);
  if (compareCareerAiDifficulty(currentTier, minRequired)) {
    return null;
  }

  return {
    recommendedExpertTopPool: expertTopPoolForCareerTier(minRequired),
    recommendedTier: minRequired,
    needsExpertMode: aiDifficulty !== 'expert',
  };
}
