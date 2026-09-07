import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AvatarId } from '../constants/avatars';
import { APP_VERSION } from '../constants/app';
import { colors } from '../constants/colors';
import { MASTER_SCORE_THRESHOLD } from '../constants/scoring';
import { EXPERT_THRESHOLD } from '../constants/game';
import type { Language } from '../utils/i18n';
import { t } from '../utils/i18n';
import { LandscapeSideArt } from './LandscapeSideArt';
import { MoodTimerBox, type TimerMood } from './MoodTimerBox';
import { PlayerAvatar } from './PlayerAvatar';

interface GameSideHudProps {
  role: 'player' | 'opponent';
  side: 'left' | 'right';
  avatarId: AvatarId;
  label: string;
  stoneBadge: string;
  isActiveTurn: boolean;
  statusText?: string;
  careerBadge?: string | null;
  onCareerPress?: () => void;
  showScore?: boolean;
  totalScore?: number;
  isMaster?: boolean;
  isExpert?: boolean;
  seg1Fill?: number;
  seg2Fill?: number;
  showMoodTimer?: boolean;
  timeLeft?: number;
  isAITurnForTimer?: boolean;
  showTimerWarning?: boolean;
  timerMood?: TimerMood;
  showActions?: boolean;
  onRestart?: () => void;
  onLeaderboard?: () => void;
  onSettings?: () => void;
  vsAI?: boolean;
  onToggleMode?: () => void;
  aiThinking?: boolean;
  language: Language;
}

export function GameSideHud({
  role,
  side,
  avatarId,
  label,
  stoneBadge,
  isActiveTurn,
  statusText,
  careerBadge,
  onCareerPress,
  showScore = false,
  totalScore = 0,
  isMaster = false,
  isExpert = false,
  seg1Fill = 0,
  seg2Fill = 0,
  showMoodTimer = false,
  timeLeft = 0,
  isAITurnForTimer = false,
  showTimerWarning = false,
  timerMood = { emoji: '🙂', bg: '#DCFCE7', text: '#166534' },
  showActions = false,
  onRestart,
  onLeaderboard,
  onSettings,
  vsAI = true,
  onToggleMode,
  aiThinking = false,
  language,
}: GameSideHudProps) {
  return (
    <View style={[styles.container, role === 'player' && styles.playerContainer]}>
      <LandscapeSideArt side={side} pieceOnly />

      <View style={[styles.avatarBlock, isActiveTurn && styles.avatarBlockActive]}>
        <PlayerAvatar avatarId={avatarId} size="lg" />
        <Text style={styles.playerLabel}>{label}</Text>
        <Text style={styles.stoneBadge}>{stoneBadge}</Text>
      </View>

      {showScore ? (
        <View style={styles.scoreBlock}>
          <View style={styles.scoreHeaderRow}>
            <Text style={styles.scoreLabel}>{t(language, 'score')}</Text>
            {role === 'player' && careerBadge ? (
              <Pressable accessibilityRole="button" onPress={onCareerPress}>
                <Text style={styles.careerBadge} numberOfLines={1}>
                  {careerBadge}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text
            style={[
              styles.scoreValue,
              isMaster && styles.scoreValueMaster,
              isExpert && !isMaster && styles.scoreValueExpert,
            ]}
          >
            {totalScore}
            <Text style={styles.scoreThreshold}>
              {' '}
              / {isMaster ? MASTER_SCORE_THRESHOLD : EXPERT_THRESHOLD}
            </Text>
          </Text>
          <View style={styles.scoreBarOuter}>
            <View style={[styles.scoreBarSegment, { flex: 80 }]}>
              <View style={styles.scoreBarTrack}>
                <View
                  style={[styles.scoreBarFill, { width: `${seg1Fill * 100}%`, backgroundColor: colors.accent }]}
                />
              </View>
            </View>
            <View style={styles.scoreMilestoneDivider} />
            <View style={[styles.scoreBarSegment, { flex: 20 }]}>
              <View style={[styles.scoreBarTrack, { backgroundColor: isExpert ? '#FECACA' : '#E5E7EB' }]}>
                <View
                  style={[styles.scoreBarFill, { width: `${seg2Fill * 100}%`, backgroundColor: colors.expert }]}
                />
              </View>
            </View>
          </View>
          {showMoodTimer ? (
            <MoodTimerBox
              variant="stacked"
              timeLeft={timeLeft}
              isAITurnForTimer={isAITurnForTimer}
              showTimerWarning={showTimerWarning}
              timerMood={timerMood}
              language={language}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.statusBlock}>
        {statusText ? (
          <Text style={[styles.statusText, isActiveTurn && styles.statusTextActive]}>{statusText}</Text>
        ) : null}

        {role === 'opponent' && aiThinking ? (
          <View style={styles.aiThinkingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.aiThinkingText}>{t(language, 'aiThinking')}</Text>
          </View>
        ) : null}

        {showActions ? (
          <View style={styles.actionColumn}>
            <Pressable style={styles.primaryButton} onPress={onRestart}>
              <Text style={styles.primaryButtonText}>{t(language, 'restartGame')}</Text>
            </Pressable>
            {onLeaderboard ? (
              <Pressable style={styles.secondaryButton} onPress={onLeaderboard}>
                <Text style={styles.secondaryButtonText}>{t(language, 'leaderboardBtn')}</Text>
              </Pressable>
            ) : null}
            {onSettings ? (
              <Pressable style={styles.secondaryButton} onPress={onSettings}>
                <Text style={styles.secondaryButtonText}>{t(language, 'settingsNav')}</Text>
              </Pressable>
            ) : null}
            {onToggleMode ? (
              <View style={styles.modeRow}>
                <Pressable
                  style={[styles.modeChip, vsAI && styles.modeChipActive]}
                  onPress={() => {
                    if (!vsAI) onToggleMode();
                  }}
                >
                  <Text style={[styles.modeChipText, vsAI && styles.modeChipTextActive]}>AI</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeChip, !vsAI && styles.modeChipActive]}
                  onPress={() => {
                    if (vsAI) onToggleMode();
                  }}
                >
                  <Text style={[styles.modeChipText, !vsAI && styles.modeChipTextActive]}>2P</Text>
                </Pressable>
              </View>
            ) : null}
            <Text style={styles.versionText}>
              {t(language, 'appVersion')}
              {APP_VERSION}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 12,
  },
  playerContainer: {
    justifyContent: 'flex-start',
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  avatarBlockActive: {
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  playerLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  stoneBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  careerBadge: {
    flexShrink: 1,
    maxWidth: 120,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  scoreBlock: {
    alignItems: 'stretch',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accentDark,
    textAlign: 'center',
  },
  scoreValueExpert: {
    color: colors.expert,
  },
  scoreValueMaster: {
    color: '#D97706',
  },
  scoreThreshold: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  scoreBarOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  scoreBarSegment: {
    height: 6,
  },
  scoreBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreMilestoneDivider: {
    width: 2,
    height: 10,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  statusBlock: {
    gap: 8,
    marginTop: 'auto',
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  statusTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  aiThinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiThinkingText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  actionColumn: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.button,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  modeChip: {
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: colors.chipBackground,
  },
  modeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: colors.buttonText,
  },
  versionText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
  },
});
