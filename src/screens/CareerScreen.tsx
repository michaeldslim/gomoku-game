import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CareerDifficultyBanner } from '../components/CareerDifficultyBanner';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { useCareer } from '../career/CareerProvider';
import { getExpertPoolSuggestion } from '../career/careerDifficultySuggestion';
import {
  careerRankKey,
  difficultyLabel,
  getCareerLadderRows,
  getCareerLadderStatus,
  getCareerProgressCopy,
  getPromotionRequirementCopy,
  isMaxCareerRank,
  type CareerLadderStatus,
} from '../career/careerLabels';
import { getPromotionTarget } from '../career/careerRules';
import type { AvatarId } from '../constants/avatars';
import { colors } from '../constants/colors';
import { EXPERT_THRESHOLD } from '../constants/game';
import type { CareerRank, CareerState } from '../types/career';
import { createCareerTranslate, tc } from '../utils/careerI18n';
import { Language, t } from '../utils/i18n';
import type { AIDifficulty } from '../utils/aiLogic';

interface Props {
  language: Language;
  careerModeEnabled: boolean;
  playerAvatarId: AvatarId;
  expertTopPool: number;
  currentScore: number;
  onBack: () => void;
  onOpenSettings: () => void;
  onApplyExpertPool?: (pool: number) => void;
}

function ladderStatusLabel(ct: ReturnType<typeof createCareerTranslate>, status: CareerLadderStatus): string {
  switch (status) {
    case 'achieved':
      return ct('ladder.achieved');
    case 'current':
      return ct('ladder.current');
    default:
      return ct('ladder.locked');
  }
}

function ladderDetailCopy(
  ct: ReturnType<typeof createCareerTranslate>,
  state: CareerState,
  rank: CareerRank,
  status: CareerLadderStatus,
): string {
  if (status === 'current') {
    const target = getPromotionTarget(state.rank);
    if (!target) {
      return ct('maxRank', { rank: ct(careerRankKey(rank)) });
    }

    return ct('ladder.progressToNext', {
      current: state.promotionWins,
      required: target.requiredWins,
      nextRank: ct(careerRankKey(target.nextRank)),
    });
  }

  if (rank === 'intern') {
    return ct('ladder.startingRank');
  }

  return getPromotionRequirementCopy(ct, rank) ?? '';
}

function CareerDisabledState({
  language,
  onOpenSettings,
}: {
  language: Language;
  onOpenSettings: () => void;
}) {
  const ct = createCareerTranslate(language);

  return (
    <View style={styles.disabledCard}>
      <Text style={styles.disabledTitle}>{ct('screen.disabledTitle')}</Text>
      <Text style={styles.disabledBody}>{ct('screen.disabledBody')}</Text>
      <Pressable style={styles.linkButton} onPress={onOpenSettings}>
        <Text style={styles.linkButtonText}>{ct('screen.enableInSettings')}</Text>
      </Pressable>
    </View>
  );
}

function CareerSummary({
  language,
  state,
  playerAvatarId,
}: {
  language: Language;
  state: CareerState;
  playerAvatarId: AvatarId;
}) {
  const ct = createCareerTranslate(language);
  const progress = getCareerProgressCopy(ct, state);
  const highestLabel = ct(careerRankKey(state.highestRankAchieved));
  const showHighest = state.highestRankAchieved !== state.rank || isMaxCareerRank(state);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <PlayerAvatar avatarId={playerAvatarId} size="lg" />
        <View style={styles.summaryText}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{ct('screen.currentRank')}</Text>
            <Text style={styles.summaryValue}>{progress.primary}</Text>
          </View>
          {progress.secondary ? <Text style={styles.summaryHint}>{progress.secondary}</Text> : null}
        </View>
      </View>
      {showHighest ? (
        <View style={[styles.summaryRow, styles.summaryRowSpaced]}>
          <Text style={styles.summaryLabel}>{ct('screen.highestRank')}</Text>
          <Text style={styles.summaryValue}>{highestLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function LadderRow({
  language,
  rank,
  state,
  isLast,
}: {
  language: Language;
  rank: CareerRank;
  state: CareerState;
  isLast: boolean;
}) {
  const ct = createCareerTranslate(language);
  const status = getCareerLadderStatus(state, rank);
  const detail = ladderDetailCopy(ct, state, rank, status);
  const isHighlighted = status === 'current' || rank === state.highestRankAchieved;

  return (
    <View style={styles.ladderRow}>
      <View style={styles.ladderRail}>
        <View
          style={[
            styles.ladderDot,
            status === 'achieved' && styles.ladderDotAchieved,
            status === 'current' && styles.ladderDotCurrent,
            status === 'locked' && styles.ladderDotLocked,
          ]}
        />
        {!isLast ? <View style={styles.ladderLine} /> : null}
      </View>

      <View
        style={[
          styles.ladderCard,
          isHighlighted && styles.ladderCardHighlighted,
          status === 'locked' && styles.ladderCardLocked,
        ]}
      >
        <View style={styles.ladderHeader}>
          <Text
            style={[
              styles.ladderRank,
              status === 'current' && styles.ladderRankCurrent,
              status === 'locked' && styles.ladderRankLocked,
            ]}
          >
            {ct(careerRankKey(rank))}
          </Text>
          <Text
            style={[
              styles.ladderStatus,
              status === 'achieved' && styles.ladderStatusAchieved,
              status === 'current' && styles.ladderStatusCurrent,
            ]}
          >
            {ladderStatusLabel(ct, status)}
          </Text>
        </View>
        {detail ? <Text style={styles.ladderDetail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

export default function CareerScreen({
  language,
  careerModeEnabled,
  playerAvatarId,
  expertTopPool,
  currentScore,
  onBack,
  onOpenSettings,
  onApplyExpertPool,
}: Props) {
  const insets = useSafeAreaInsets();
  const ct = createCareerTranslate(language);
  const { careerState, loaded } = useCareer();
  const ladderRows = getCareerLadderRows();
  const aiDifficulty: AIDifficulty = currentScore >= EXPERT_THRESHOLD ? 'expert' : 'intermediate';
  const poolSuggestion = careerModeEnabled
    ? getExpertPoolSuggestion(careerState.rank, aiDifficulty, expertTopPool)
    : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t(language, 'back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{ct('screen.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 24) }]}
        showsVerticalScrollIndicator
      >
        {!careerModeEnabled ? (
          <CareerDisabledState language={language} onOpenSettings={onOpenSettings} />
        ) : !loaded ? null : (
          <>
            <CareerSummary language={language} state={careerState} playerAvatarId={playerAvatarId} />

            {poolSuggestion && onApplyExpertPool ? (
              <CareerDifficultyBanner
                message={
                  poolSuggestion.needsExpertMode
                    ? tc(language, 'difficultySuggest.needExpert', {
                        rank: ct(careerRankKey(careerState.rank)),
                        difficulty: difficultyLabel(ct, poolSuggestion.recommendedTier),
                      })
                    : tc(language, 'difficultySuggest.body', {
                        rank: ct(careerRankKey(careerState.rank)),
                        difficulty: difficultyLabel(ct, poolSuggestion.recommendedTier),
                      })
                }
                actionLabel={tc(language, 'difficultySuggest.action', {
                  difficulty: difficultyLabel(ct, poolSuggestion.recommendedTier),
                })}
                onApply={() => onApplyExpertPool(poolSuggestion.recommendedExpertTopPool)}
              />
            ) : null}

            <Text style={styles.rulesText}>{ct('rulesSnippet')}</Text>

            <View style={styles.ladderSection}>
              <Text style={styles.sectionTitle}>{ct('screen.ladderTitle')}</Text>
              {ladderRows.map((rank, index) => (
                <LadderRow
                  key={rank}
                  language={language}
                  rank={rank}
                  state={careerState}
                  isLast={index === ladderRows.length - 1}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  backButton: {
    minWidth: 64,
    paddingVertical: 6,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSpacer: {
    minWidth: 64,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryText: {
    flex: 1,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryRowSpaced: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  summaryHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  rulesText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  ladderSection: {
    gap: 0,
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  ladderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ladderRail: {
    width: 18,
    alignItems: 'center',
  },
  ladderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 18,
    backgroundColor: colors.chipBorder,
  },
  ladderDotAchieved: {
    backgroundColor: colors.gold,
  },
  ladderDotCurrent: {
    backgroundColor: colors.gold,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 17,
  },
  ladderDotLocked: {
    opacity: 0.45,
  },
  ladderLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  ladderCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ladderCardHighlighted: {
    borderColor: colors.goldMuted,
    backgroundColor: colors.goldTint,
  },
  ladderCardLocked: {
    opacity: 0.85,
  },
  ladderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  ladderRank: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  ladderRankCurrent: {
    color: colors.gold,
  },
  ladderRankLocked: {
    opacity: 0.75,
  },
  ladderStatus: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  ladderStatusAchieved: {
    color: colors.gold,
  },
  ladderStatusCurrent: {
    color: colors.gold,
  },
  ladderDetail: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  disabledCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  disabledBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  linkButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkButtonText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '600',
  },
});
