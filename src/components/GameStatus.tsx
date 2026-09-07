import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Language, t } from '../utils/i18n';

interface GameStatusProps {
  currentPlayer: number;
  winner: number | null;
  onRestart: () => void;
  onLeaderboard?: () => void;
  language?: Language;
  compact?: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({
  currentPlayer,
  winner,
  onRestart,
  onLeaderboard,
  language = 'ko',
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {winner === null ? (
        <Text style={[styles.status, compact && styles.statusCompact]}>
          {currentPlayer === 1 ? t(language, 'currentTurnBlack') : t(language, 'currentTurnWhite')}
        </Text>
      ) : (
        <Text style={[styles.winner, compact && styles.winnerCompact]}>
          {winner === 0 ? t(language, 'draw') : winner === 1 ? t(language, 'blackWins') : t(language, 'whiteWins')}
        </Text>
      )}
      <View style={[styles.buttonRow, compact && styles.buttonRowCompact]}>
        <TouchableOpacity
          style={[styles.button, compact && styles.buttonCompact]}
          onPress={onRestart}
        >
          <Text
            style={[styles.buttonText, compact && styles.buttonTextCompact]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {t(language, 'restartGame')}
          </Text>
        </TouchableOpacity>
        {onLeaderboard && (
          <TouchableOpacity
            style={[styles.button, styles.leaderboardButton, compact && styles.buttonCompact]}
            onPress={onLeaderboard}
          >
            <Text
              style={[styles.buttonText, compact && styles.buttonTextCompact]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t(language, 'leaderboardBtn')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 35,
    marginBottom: 8,
    alignItems: 'center',
  },
  containerCompact: {
    marginTop: 0,
    marginBottom: 0,
    flex: 1,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusCompact: {
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'center',
  },
  winner: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 10,
  },
  winnerCompact: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  buttonRowCompact: {
    gap: 4,
    marginTop: 2,
    alignSelf: 'stretch',
    width: '100%',
  },
  button: {
    backgroundColor: '#457B9D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  buttonCompact: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 0,
  },
  leaderboardButton: {
    backgroundColor: '#D4A853',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextCompact: {
    fontSize: 11,
  },
});

export default GameStatus;
