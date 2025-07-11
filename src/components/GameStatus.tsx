import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface GameStatusProps {
  currentPlayer: number;
  winner: number | null;
  onRestart: () => void;
}

const GameStatus: React.FC<GameStatusProps> = ({ currentPlayer, winner, onRestart }) => {
  return (
    <View style={styles.container}>
      {winner === null ? (
        <Text style={styles.status}>
          현재 차례: {currentPlayer === 1 ? '흑돌(⚫)' : '백돌(⚪)'}
        </Text>
      ) : (
        <Text style={styles.winner}>
          {winner === 0 ? '무승부!' : winner === 1 ? '흑돌(⚫) 승리!' : '백돌(⚪) 승리!'}
        </Text>
      )}
      <TouchableOpacity style={styles.button} onPress={onRestart}>
        <Text style={styles.buttonText}>게임 다시 시작</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  winner: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#457B9D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameStatus;
