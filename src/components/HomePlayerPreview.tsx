import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AvatarId } from '../constants/avatars';
import { colors } from '../constants/colors';
import type { Language } from '../utils/i18n';
import { t } from '../utils/i18n';
import { PlayerAvatar } from './PlayerAvatar';

interface HomePlayerPreviewProps {
  language: Language;
  playerAvatarId: AvatarId;
  aiAvatarId: AvatarId;
  careerBadge?: string | null;
  onCareerPress?: () => void;
}

export function HomePlayerPreview({
  language,
  playerAvatarId,
  aiAvatarId,
  careerBadge,
  onCareerPress,
}: HomePlayerPreviewProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatarRow}>
        <View style={styles.avatarSlot}>
          <PlayerAvatar avatarId={playerAvatarId} size="lg" />
          <Text style={styles.avatarLabel}>{t(language, 'playerLabel')}</Text>
          <Text style={styles.stoneBadge}>⚫</Text>
        </View>

        <Text style={styles.vsLabel}>VS</Text>

        <View style={styles.avatarSlot}>
          <PlayerAvatar avatarId={aiAvatarId} size="lg" />
          <Text style={styles.avatarLabel}>{t(language, 'aiLabel')}</Text>
          <Text style={styles.stoneBadge}>⚪</Text>
        </View>
      </View>

      {careerBadge ? (
        <Pressable
          accessibilityRole="button"
          style={styles.careerBadgeRow}
          onPress={onCareerPress}
          disabled={!onCareerPress}
        >
          <Text style={styles.careerBadgeText}>{careerBadge}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    gap: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  avatarSlot: {
    alignItems: 'center',
    gap: 4,
    minWidth: 88,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stoneBadge: {
    fontSize: 13,
    color: colors.textMuted,
  },
  vsLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  careerBadgeRow: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  careerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold,
    textAlign: 'center',
  },
});
