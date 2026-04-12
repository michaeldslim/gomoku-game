import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C084FC', '#FF9F43', '#FF6BFF'];
const NUM_BURSTS = 6;
const PARTICLES_PER_BURST = 8;
const TOTAL = NUM_BURSTS * PARTICLES_PER_BURST;

interface ParticleConfig {
  dx: number;
  dy: number;
  color: string;
  size: number;
  burstX: number;
  burstY: number;
  delay: number;
}

interface FireworksProps {
  visible: boolean;
  width: number;
  height: number;
}

function generateConfigs(width: number, height: number): ParticleConfig[] {
  return Array.from({ length: NUM_BURSTS }, (_, b) => {
    const burstX = width * (0.2 + Math.random() * 0.6);
    const burstY = height * (0.15 + Math.random() * 0.7);
    const delay = b * 200;
    return Array.from({ length: PARTICLES_PER_BURST }, (_, p) => {
      const angle = (p / PARTICLES_PER_BURST) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const radius = 35 + Math.random() * 45;
      return {
        dx: Math.cos(angle) * radius,
        dy: Math.sin(angle) * radius,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 5,
        burstX,
        burstY,
        delay,
      };
    });
  }).flat();
}

const Fireworks: React.FC<FireworksProps> = ({ visible, width, height }) => {
  const progressValues = useRef<Animated.Value[]>(
    Array.from({ length: TOTAL }, () => new Animated.Value(0))
  );
  const configsRef = useRef<ParticleConfig[]>(generateConfigs(width || 300, height || 300));

  useEffect(() => {
    if (!visible) return;

    configsRef.current = generateConfigs(width || 300, height || 300);
    progressValues.current.forEach(p => p.setValue(0));

    const animations = progressValues.current.map((progress, i) =>
      Animated.sequence([
        Animated.delay(configsRef.current[i].delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(animations).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
      pointerEvents="none"
    >
      {progressValues.current.map((progress, i) => {
        const cfg = configsRef.current[i];
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, cfg.dx],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, cfg.dy],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.1, 0.6, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1.2, 0.4],
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: cfg.burstX,
              top: cfg.burstY,
              width: cfg.size,
              height: cfg.size,
              borderRadius: cfg.size / 2,
              backgroundColor: cfg.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
};

export default Fireworks;
