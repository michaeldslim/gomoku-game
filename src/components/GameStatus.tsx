import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface GameStatusProps {
  currentPlayer: number;
  winner: number | null;
  onRestart: () => void;
  onUndo: () => void;
  undoCount: number;
  onLeaderboard?: () => void;
}

const GameStatus: React.FC<GameStatusProps> = ({ currentPlayer, winner, onRestart, onUndo, undoCount, onLeaderboard }) => {
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
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={onRestart}>
          <Text style={styles.buttonText}>게임 다시 시작</Text>
        </TouchableOpacity>
        {winner === null && (
          <TouchableOpacity
            style={[styles.button, styles.undoButton, undoCount === 0 && styles.buttonDisabled]}
            onPress={onUndo}
            disabled={undoCount === 0}
          >
            <Text style={[styles.buttonText, undoCount === 0 && styles.buttonTextDisabled]}>
              무르기 ({undoCount})
            </Text>
          </TouchableOpacity>
        )}
        {onLeaderboard && (
          <TouchableOpacity style={[styles.button, styles.leaderboardButton]} onPress={onLeaderboard}>
            <Text style={styles.buttonText}>리더보드</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  winner: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#457B9D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  undoButton: {
    backgroundColor: '#6B7280',
  },
  leaderboardButton: {
    backgroundColor: '#D4A853',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default GameStatus;
