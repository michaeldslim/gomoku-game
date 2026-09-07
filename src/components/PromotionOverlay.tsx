import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { PlayerAvatar } from './PlayerAvatar';
import { colors } from '../constants/colors';
import type { AvatarId } from '../constants/avatars';

interface PromotionOverlayProps {
  visible: boolean;
  title: string;
  subtitle: string;
  isCeo: boolean;
  playerAvatarId: AvatarId;
  onComplete: () => void;
}

const DISPLAY_MS = 1200;
const CEO_DISPLAY_MS = 1800;
const FADE_MS = 400;

export function PromotionOverlay({
  visible,
  title,
  subtitle,
  isCeo,
  playerAvatarId,
  onComplete,
}: PromotionOverlayProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.45)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const displayMs = isCeo ? CEO_DISPLAY_MS : DISPLAY_MS;

    backdropOpacity.setValue(0);
    bannerScale.setValue(0.45);
    bannerOpacity.setValue(0);

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 0.55,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(displayMs),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bannerScale, {
          toValue: 1.14,
          duration: 260,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(bannerScale, {
          toValue: 1,
          duration: 160,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(displayMs),
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });

    return () => {
      animation.stop();
    };
  }, [backdropOpacity, bannerOpacity, bannerScale, isCeo, onComplete, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <Animated.View
        style={[
          styles.banner,
          isCeo && styles.bannerCeo,
          {
            opacity: bannerOpacity,
            transform: [{ scale: bannerScale }],
          },
        ]}
      >
        <PlayerAvatar avatarId={playerAvatarId} size="xl" style={styles.avatar} />
        <Text style={[styles.title, isCeo && styles.titleCeo]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.textPrimary,
  },
  banner: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
    maxWidth: '88%',
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerCeo: {
    borderWidth: 3,
    paddingVertical: 28,
  },
  avatar: {
    marginBottom: 4,
  },
  title: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleCeo: {
    fontSize: 32,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
});
