import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

interface CareerDifficultyBannerProps {
  message: string;
  actionLabel: string;
  onApply: () => void;
}

export function CareerDifficultyBanner({
  message,
  actionLabel,
  onApply,
}: CareerDifficultyBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Pressable accessibilityRole="button" style={styles.action} onPress={onApply}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    backgroundColor: colors.goldTint,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.gold,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
