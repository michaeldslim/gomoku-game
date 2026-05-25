import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  text?: string;
  duration?: number;
  language?: 'ko' | 'en';
}

const VictoryPopup: React.FC<Props> = ({ visible, text, duration = 3000, language = 'ko' }) => {
  const finalText = text ?? (language === 'ko' ? '승!' : 'Win!');
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
          {
            opacity: opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={styles.text}>{finalText}</Text>
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
  },
  text: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default VictoryPopup;
