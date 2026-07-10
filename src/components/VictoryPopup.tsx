import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Language, t } from '../utils/i18n';

interface Props {
  visible: boolean;
  text?: string;
  subtitle?: string;
  duration?: number;
  language?: Language;
  backgroundColor?: string;
  textColor?: string;
  subtitleColor?: string;
  winner?: number | null; // 1 = human(black), 2 = AI(white), 0 = draw
}

const VictoryPopup: React.FC<Props> = ({
  visible,
  text,
  subtitle,
  duration = 3000,
  language = 'ko',
  backgroundColor,
  textColor,
  subtitleColor,
  winner = null,
}) => {
  const isDraw = winner === 0;
  const isLoss = winner === 2;
  // Compute default text from winner/language when `text` is not provided.
  let finalText: string;
  if (typeof text === 'string') finalText = text;
  else if (winner === 1) finalText = t(language, 'win');
  else if (winner === 2) finalText = t(language, 'lose');
  else if (isDraw) finalText = t(language, 'drawPopup');
  else finalText = t(language, 'win');

  const resolvedBackground =
    backgroundColor ?? (isDraw ? '#6B7280' : isLoss ? '#000000' : '#FF7BAC');
  const resolvedTextColor =
    textColor ?? (isDraw || isLoss ? '#FFFFFF' : '#FFFFFF');
  const resolvedSubtitleColor = subtitleColor ?? 'rgba(255,255,255,0.92)';
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.6);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]),
      ]).start();

      const t = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      }, Math.max(1200, duration - 300));

      return () => clearTimeout(t);
    }
    // hide immediately when not visible
    opacity.setValue(0);
    scale.setValue(0.6);
  }, [visible, opacity, scale, duration]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View
        style={[
          styles.bubble,
          isDraw && styles.drawBubble,
          { backgroundColor: resolvedBackground },
          {
            opacity: opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={[styles.text, { color: resolvedTextColor }]}>{finalText}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: resolvedSubtitleColor }]}>{subtitle}</Text>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  bubble: {
    backgroundColor: '#FF7BAC',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  drawBubble: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    shadowOpacity: 0.15,
  },
  text: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default VictoryPopup;
