import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import type { Language } from '../utils/i18n';
import { t } from '../utils/i18n';
import { LandscapeSideArt } from './LandscapeSideArt';

const HOME_SIDE_STONE_TOP = 20;

interface HomeSideNavProps {
  language: Language;
  isStartingGame: boolean;
  settingsLoaded: boolean;
  onStartGame: () => void;
  onLeaderboard: () => void;
  onSettings: () => void;
}

export function HomeSideNav({
  language,
  isStartingGame,
  settingsLoaded,
  onStartGame,
  onLeaderboard,
  onSettings,
}: HomeSideNavProps) {
  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        <View style={styles.stoneSlot}>
          <LandscapeSideArt side="right" pieceOnly />
        </View>
        <View style={styles.navColumn}>
          <Pressable
            style={[styles.primaryButton, isStartingGame && styles.buttonDisabled]}
            onPress={onStartGame}
            disabled={isStartingGame}
          >
            {isStartingGame ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={styles.primaryButtonText}>{t(language, 'startGame')}</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onLeaderboard}>
            <Text style={styles.secondaryButtonText}>{t(language, 'leaderboardNav')}</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, !settingsLoaded && styles.buttonDisabled]}
            onPress={onSettings}
            disabled={!settingsLoaded}
          >
            <Text style={styles.secondaryButtonText}>
              {settingsLoaded ? t(language, 'settingsNav') : t(language, 'loadingSettings')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: HOME_SIDE_STONE_TOP,
    paddingBottom: 12,
    paddingHorizontal: 10,
  },
  contentBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
  },
  stoneSlot: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navColumn: {
    alignSelf: 'stretch',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.button,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
