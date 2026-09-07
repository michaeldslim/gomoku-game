import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AVATAR_IMAGES, type AvatarId } from '../constants/avatars';
import { colors } from '../constants/colors';

export type PlayerAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<PlayerAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72,
};

interface PlayerAvatarProps {
  avatarId: AvatarId;
  size?: PlayerAvatarSize;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PlayerAvatar({
  avatarId,
  size = 'md',
  selected = false,
  style,
}: PlayerAvatarProps) {
  const dimension = SIZES[size];
  const borderWidth = selected ? 3 : 2;

  return (
    <View
      style={[
        styles.frame,
        {
          width: dimension + borderWidth * 2,
          height: dimension + borderWidth * 2,
          borderRadius: (dimension + borderWidth * 2) / 2,
          borderWidth,
          borderColor: selected ? colors.gold : colors.avatarFrameMuted,
        },
        style,
      ]}
    >
      <Image
        source={AVATAR_IMAGES[avatarId]}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.avatarFrameBackground,
  },
});
