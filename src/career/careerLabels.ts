import type { CareerAiDifficulty } from '../types/career';
import type { CareerRank, CareerState, PromotionResult } from '../types/career';
import type { CareerTranslateFn } from '../utils/careerI18n';
import {
  CAREER_RANK_ORDER,
  getPromotionTarget,
  getRequirementToReachRank,
  rankIndex,
} from './careerRules';

export const CAREER_RANK_KEYS: Record<CareerRank, string> = {
  intern: 'rank.intern',
  staff: 'rank.staff',
  assistant: 'rank.assistant',
  manager: 'rank.manager',
  deputy: 'rank.deputy',
  director: 'rank.director',
  executive: 'rank.executive',
  ceo: 'rank.ceo',
};

export function careerRankKey(rank: CareerRank): string {
  return CAREER_RANK_KEYS[rank];
}

export function isMaxCareerRank(state: CareerState): boolean {
  return getPromotionTarget(state.rank) === null;
}

const DIFFICULTY_LABEL_KEYS: Record<CareerAiDifficulty, string> = {
  easy: 'difficulty.easy',
  medium: 'difficulty.medium',
  hard: 'difficulty.hard',
};

export function difficultyLabel(t: CareerTranslateFn, difficulty: CareerAiDifficulty): string {
  return t(DIFFICULTY_LABEL_KEYS[difficulty]);
}

export function getCareerProgressCopy(
  t: CareerTranslateFn,
  state: CareerState,
): { primary: string; secondary?: string } {
  const rankLabel = t(careerRankKey(state.rank));
  const target = getPromotionTarget(state.rank);

  if (!target) {
    return { primary: t('maxRank', { rank: rankLabel }) };
  }

  return {
    primary: t('homeBadge', {
      rank: rankLabel,
      current: state.promotionWins,
      required: target.requiredWins,
    }),
    secondary: t('progressNext', {
      nextRank: t(careerRankKey(target.nextRank)),
      required: target.requiredWins,
    }),
  };
}

export function getCareerResultMessage(
  t: CareerTranslateFn,
  result: PromotionResult,
  isDraw: boolean,
): string {
  const rankLabel = t(careerRankKey(result.nextState.rank));
  const target = getPromotionTarget(result.nextState.rank);

  if (result.unchanged || isDraw) {
    return getCareerProgressCopy(t, result.nextState).primary;
  }

  if (result.lost && target) {
    return t('lossKeepsProgress', {
      rank: rankLabel,
      current: result.nextState.promotionWins,
      required: target.requiredWins,
    });
  }

  if (result.noProgressDifficulty) {
    return t('noProgressDifficulty', {
      minDifficulty: difficultyLabel(t, target?.minAiDifficulty ?? 'medium'),
    });
  }

  return getCareerProgressCopy(t, result.nextState).primary;
}

export function getPromotionRequirementCopy(
  t: CareerTranslateFn,
  rank: CareerRank,
): string | null {
  const requirement = getRequirementToReachRank(rank);
  if (!requirement) {
    return null;
  }

  if (requirement.minAiDifficulty) {
    return t('ladder.requirementDifficulty', {
      wins: requirement.requiredWins,
      difficulty: difficultyLabel(t, requirement.minAiDifficulty),
    });
  }

  return t('ladder.requirement', { wins: requirement.requiredWins });
}

export type CareerLadderStatus = 'achieved' | 'current' | 'locked';

export function getCareerLadderStatus(state: CareerState, rank: CareerRank): CareerLadderStatus {
  const currentIndex = rankIndex(state.rank);
  const rowIndex = rankIndex(rank);

  if (rowIndex < currentIndex) {
    return 'achieved';
  }

  if (rowIndex === currentIndex) {
    return 'current';
  }

  return 'locked';
}

export function getCareerLadderRows(): CareerRank[] {
  return [...CAREER_RANK_ORDER].reverse();
}
