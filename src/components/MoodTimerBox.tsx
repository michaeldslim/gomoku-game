import { StyleSheet, Text, View } from 'react-native';
import type { Language } from '../utils/i18n';
import { t } from '../utils/i18n';

export interface TimerMood {
  emoji: string;
  bg: string;
  text: string;
}

interface MoodTimerBoxProps {
  timeLeft: number;
  isAITurnForTimer: boolean;
  showTimerWarning: boolean;
  timerMood: TimerMood;
  language: Language;
  /** Inline beside score banner (mobile) vs stacked in side HUD (tablet) */
  variant?: 'inline' | 'stacked';
}

export function MoodTimerBox({
  timeLeft,
  isAITurnForTimer,
  showTimerWarning,
  timerMood,
  language,
  variant = 'inline',
}: MoodTimerBoxProps) {
  return (
    <View
      style={[
        styles.box,
        variant === 'stacked' && styles.boxStacked,
        { backgroundColor: isAITurnForTimer ? '#DBEAFE' : timerMood.bg },
      ]}
      accessibilityLabel={showTimerWarning ? t(language, 'timerExpiryWarning') : undefined}
    >
      <Text style={styles.emoji}>
        {showTimerWarning ? '⚠️' : isAITurnForTimer ? '🦊' : timerMood.emoji}
      </Text>
      <Text
        style={[
          styles.timeText,
          {
            color: showTimerWarning
              ? '#B91C1C'
              : isAITurnForTimer
                ? '#1E40AF'
                : timerMood.text,
          },
        ]}
      >
        {isAITurnForTimer ? 'AI' : `${timeLeft}s`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 56,
    flexShrink: 0,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  boxStacked: {
    alignSelf: 'stretch',
    width: undefined,
    marginTop: 8,
  },
  emoji: {
    fontSize: 20,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
