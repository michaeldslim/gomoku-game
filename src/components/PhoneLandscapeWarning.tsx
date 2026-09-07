import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../constants/colors';
import { getOrientationGuide } from '../hooks/useScreenLayout';
import { Language, t } from '../utils/i18n';

interface PhoneLandscapeWarningProps {
  language: Language;
}

export function PhoneLandscapeWarning({ language }: PhoneLandscapeWarningProps) {
  const { width, height } = useWindowDimensions();
  const guide = getOrientationGuide(width, height);
  const [tabletPortraitDismissed, setTabletPortraitDismissed] = useState(false);

  useEffect(() => {
    if (guide !== 'landscape') {
      setTabletPortraitDismissed(false);
    }
  }, [guide]);

  const handlePlayPortraitAnyway = useCallback(() => {
    setTabletPortraitDismissed(true);
  }, []);

  if (!guide) {
    return null;
  }

  if (guide === 'landscape' && tabletPortraitDismissed) {
    return null;
  }

  const title =
    guide === 'portrait'
      ? t(language, 'rotateToPortraitTitle')
      : t(language, 'rotateToLandscapeTitle');
  const bodyLine1 =
    guide === 'portrait'
      ? t(language, 'rotateToPortraitBodyLine1')
      : t(language, 'rotateToLandscapeBodyLine1');
  const bodyLine2 =
    guide === 'portrait'
      ? t(language, 'rotateToPortraitBodyLine2')
      : t(language, 'rotateToLandscapeBodyLine2');
  const icon = guide === 'portrait' ? '📱' : '↔️';

  return (
    <View style={styles.overlay} accessibilityRole="alert" pointerEvents="auto">
      <View style={styles.card}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.bodyBlock}>
          <Text style={styles.body}>{bodyLine1}</Text>
          <Text style={styles.body}>{bodyLine2}</Text>
        </View>
        {guide === 'landscape' ? (
          <Pressable
            style={styles.dismissButton}
            onPress={handlePlayPortraitAnyway}
            accessibilityRole="button"
            accessibilityLabel={t(language, 'playPortraitAnyway')}
          >
            <Text style={styles.dismissButtonText}>{t(language, 'playPortraitAnyway')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    backgroundColor: 'rgba(243, 239, 231, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: {
    fontSize: 48,
    marginBottom: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  bodyBlock: {
    alignItems: 'center',
    gap: 4,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  dismissButton: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: colors.accentDark,
    fontSize: 15,
    fontWeight: '600',
  },
});
