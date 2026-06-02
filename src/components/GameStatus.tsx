import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Language, t } from '../utils/i18n';

interface GameStatusProps {
  currentPlayer: number;
  winner: number | null;
  onRestart: () => void;
  onUndo: () => void;
  undoCount: number;
  onLeaderboard?: () => void;
  language?: Language;
}

const GameStatus: React.FC<GameStatusProps> = ({ currentPlayer, winner, onRestart, onUndo, undoCount, onLeaderboard, language = 'ko' }) => {
  return (
    <View style={styles.container}>
      {winner === null ? (
        <Text style={styles.status}>
          {currentPlayer === 1 ? t(language, 'currentTurnBlack') : t(language, 'currentTurnWhite')}
        </Text>
      ) : (
        <Text style={styles.winner}>
          {winner === 0 ? t(language, 'draw') : winner === 1 ? t(language, 'blackWins') : t(language, 'whiteWins')}
        </Text>
      )}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={onRestart}>
          <Text style={styles.buttonText}>{t(language, 'restartGame')}</Text>
        </TouchableOpacity>
        {winner === null && (
          <TouchableOpacity
            style={[styles.button, styles.undoButton, undoCount === 0 && styles.buttonDisabled]}
            onPress={onUndo}
            disabled={undoCount === 0}
          >
            <Text style={[styles.buttonText, undoCount === 0 && styles.buttonTextDisabled]}>
              {t(language, 'undo')} ({undoCount})
            </Text>
          </TouchableOpacity>
        )}
        {onLeaderboard && (
          <TouchableOpacity style={[styles.button, styles.leaderboardButton]} onPress={onLeaderboard}>
            <Text style={styles.buttonText}>{t(language, 'leaderboardBtn')}</Text>
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
