import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';

interface StoneProps {
  player: number; // 1 for black, 2 for white
  isHighlighted?: boolean;
  isWinningStone?: boolean;
}

const Stone: React.FC<StoneProps> = ({ player, isHighlighted, isWinningStone }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const winGlow = useRef(new Animated.Value(0)).current;
  const winAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isHighlighted) {
      pulseAnimationRef.current?.stop();
      pulseAnimationRef.current = null;
      pulse.setValue(0);
      return;
    }

    pulseAnimationRef.current?.stop();
    pulse.setValue(0);
    pulseAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimationRef.current.start();

    return () => {
      pulseAnimationRef.current?.stop();
      pulseAnimationRef.current = null;
    };
  }, [isHighlighted, pulse]);

  useEffect(() => {
    if (!isWinningStone) {
      winAnimRef.current?.stop();
      winAnimRef.current = null;
      winGlow.setValue(0);
      return;
    }

    winAnimRef.current?.stop();
    winGlow.setValue(0);
    winAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(winGlow, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(winGlow, {
          toValue: 0.4,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    winAnimRef.current.start();

    return () => {
      winAnimRef.current?.stop();
      winAnimRef.current = null;
    };
  }, [isWinningStone, winGlow]);

  const ringColor = player === 1 ? '#FFD166' : '#1D4ED8';

  return (
    <View style={styles.container}>
      {isHighlighted && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              borderColor: ringColor,
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.25, 0.9],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.35],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {isWinningStone && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.winRing,
            {
              opacity: winGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
              transform: [
                {
                  scale: winGlow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.1, 1.4],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.stone,
          { backgroundColor: player === 1 ? '#000' : '#fff' },
          player === 2 && styles.whiteStone,
          isHighlighted && (player === 1 ? styles.highlightBlack : styles.highlightWhite),
          isWinningStone && styles.winStone,
        ]}
      />
      {isWinningStone && (
        <Text style={styles.winStar} pointerEvents="none">★</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    zIndex: 10,
  },
  whiteStone: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  highlightBlack: {
    borderWidth: 2,
    borderColor: '#FFD166',
  },
  highlightWhite: {
    borderWidth: 3,
    borderColor: '#1D4ED8',
  },
  pulseRing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  winRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  winStone: {
    borderWidth: 2.5,
    borderColor: '#F59E0B',
  },
  winStar: {
    position: 'absolute',
    fontSize: 7,
    color: '#F59E0B',
    top: 0,
    right: 0,
    zIndex: 20,
    lineHeight: 8,
  },
});

export default Stone;
