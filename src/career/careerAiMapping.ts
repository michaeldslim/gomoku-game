import type { AIDifficulty } from '../utils/aiLogic';
import {
  EXPERT_TOP_POOL_EASY,
  EXPERT_TOP_POOL_HARD,
  EXPERT_TOP_POOL_MEDIUM,
} from '../utils/aiLogic';
import type { CareerAiDifficulty } from '../types/career';

/** Map runtime AI (score + settings) to Career difficulty tier. */
export function resolveCareerAiDifficulty(
  aiDifficulty: AIDifficulty,
  expertTopPool: number,
): CareerAiDifficulty {
  if (aiDifficulty === 'intermediate') {
    return 'easy';
  }

  if (expertTopPool === EXPERT_TOP_POOL_HARD) {
    return 'hard';
  }

  if (expertTopPool === EXPERT_TOP_POOL_MEDIUM) {
    return 'medium';
  }

  return 'easy';
}

export function expertTopPoolForCareerTier(tier: CareerAiDifficulty): number {
  if (tier === 'hard') {
    return EXPERT_TOP_POOL_HARD;
  }

  if (tier === 'medium') {
    return EXPERT_TOP_POOL_MEDIUM;
  }

  return EXPERT_TOP_POOL_EASY;
}
