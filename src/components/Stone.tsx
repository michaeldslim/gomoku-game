import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StoneProps {
  player: number; // 1 for black, 2 for white
}

const Stone: React.FC<StoneProps> = ({ player }) => {
  return (
    <View
      style={[
        styles.stone,
        { backgroundColor: player === 1 ? '#000' : '#fff' },
        player === 2 && styles.whiteStone,
      ]}
    />
  );
};

const styles = StyleSheet.create({
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
});

export default Stone;
