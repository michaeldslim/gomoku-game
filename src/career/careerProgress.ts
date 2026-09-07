import { compareCareerAiDifficulty, getPromotionTarget, isHigherRank } from './careerRules';
import type {
  CareerRank,
  CareerState,
  MatchResultInput,
  PromotionResult,
} from '../types/career';

export const DEFAULT_CAREER_STATE: CareerState = {
  rank: 'intern',
  promotionWins: 0,
  highestRankAchieved: 'intern',
};

function withHighestRank(state: CareerState, rank: CareerRank): CareerState {
  return {
    ...state,
    rank,
    highestRankAchieved: isHigherRank(rank, state.highestRankAchieved)
      ? rank
      : state.highestRankAchieved,
  };
}

export function applyMatchResult(state: CareerState, input: MatchResultInput): PromotionResult {
  if (input.isDraw) {
    return {
      nextState: state,
      promoted: null,
      lost: false,
      noProgressDifficulty: false,
      unchanged: true,
    };
  }

  if (!input.won) {
    return {
      nextState: state,
      promoted: null,
      lost: true,
      noProgressDifficulty: false,
      unchanged: false,
    };
  }

  const target = getPromotionTarget(state.rank);
  if (!target) {
    return {
      nextState: state,
      promoted: null,
      lost: false,
      noProgressDifficulty: false,
      unchanged: false,
    };
  }

  if (
    target.minAiDifficulty &&
    !compareCareerAiDifficulty(input.aiDifficulty, target.minAiDifficulty)
  ) {
    return {
      nextState: state,
      promoted: null,
      lost: false,
      noProgressDifficulty: true,
      unchanged: false,
    };
  }

  const nextWins = state.promotionWins + 1;

  if (nextWins < target.requiredWins) {
    return {
      nextState: {
        ...state,
        promotionWins: nextWins,
      },
      promoted: null,
      lost: false,
      noProgressDifficulty: false,
      unchanged: false,
    };
  }

  const promotedRank = target.nextRank;
  return {
    nextState: withHighestRank(
      {
        ...state,
        promotionWins: 0,
      },
      promotedRank,
    ),
    promoted: promotedRank,
    lost: false,
    noProgressDifficulty: false,
    unchanged: false,
  };
}
