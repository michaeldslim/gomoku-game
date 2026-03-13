import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Switch, Text, Animated } from 'react-native';
import { Audio } from 'expo-av';
import Board from './Board';
import GameStatus from './GameStatus';
import { 
  BOARD_SIZE, 
  initializeBoard, 
  isValidMove, 
  checkWin, 
  isBoardFull 
} from '../utils/gameLogic';
import { findBestMove, AIDifficulty } from '../utils/aiLogic';

const TIMER_DURATION = 10; // 10 seconds per turn

const Game: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<number>(1); // 1 for black, 2 for white
  const [winner, setWinner] = useState<number | null>(null);
  const [vsAI, setVsAI] = useState<boolean>(false);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATION);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false); // Timer disabled by default
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('intermediate');
  const timerAnimation = useRef(new Animated.Value(1)).current;
  const winSoundRef = useRef<Audio.Sound | null>(null);
  const loseSoundRef = useRef<Audio.Sound | null>(null);
  const lastPlayedWinnerRef = useRef<number | null>(null);
  
  // AI is always player 2 (white)
  const AI_PLAYER = 2;
  const HUMAN_PLAYER = 1;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const winResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/tada.mp3'),
          { shouldPlay: false }
        );
        const loseResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/lose.mp3'),
          { shouldPlay: false }
        );

        if (cancelled) {
          await winResult.sound.unloadAsync();
          await loseResult.sound.unloadAsync();
          return;
        }

        winSoundRef.current = winResult.sound;
        loseSoundRef.current = loseResult.sound;
      } catch {
        // Ignore sound loading errors
      }
    })();

    return () => {
      cancelled = true;
      (async () => {
        try {
          if (winSoundRef.current) {
            await winSoundRef.current.unloadAsync();
          }
          if (loseSoundRef.current) {
            await loseSoundRef.current.unloadAsync();
          }
        } catch {
          // Ignore unload errors
        } finally {
          winSoundRef.current = null;
          loseSoundRef.current = null;
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (winner === null || winner === 0) {
      lastPlayedWinnerRef.current = winner;
      return;
    }

    if (lastPlayedWinnerRef.current === winner) {
      return;
    }

    lastPlayedWinnerRef.current = winner;

    (async () => {
      try {
        const shouldPlayLose = vsAI && winner === AI_PLAYER;
        const soundToPlay = shouldPlayLose ? loseSoundRef.current : winSoundRef.current;

        if (!soundToPlay) return;

        await soundToPlay.setPositionAsync(0);
        await soundToPlay.playAsync();
      } catch {
        // Ignore playback errors
      }
    })();
  }, [winner, vsAI]);

  // Make a move and check for game end conditions
  const makeMove = (row: number, col: number, player: number, boardState: number[][]) => {
    // Create a new board with the move
    const newBoard = boardState.map(r => [...r]);
    newBoard[row][col] = player;
    
    // Check for win
    if (checkWin(newBoard, row, col, player)) {
      setBoard(newBoard);
      setWinner(player);
      return true; // Game ended
    }
    
    // Check for draw
    if (isBoardFull(newBoard)) {
      setBoard(newBoard);
      setWinner(0); // 0 represents a draw
      return true; // Game ended
    }
    
    // Game continues
    setBoard(newBoard);
    setCurrentPlayer(player === 1 ? 2 : 1);
    return false; // Game continues
  };
  
  // AI makes a move
  const makeAIMove = (boardState: number[][]) => {
    setAiThinking(true);
    
    // Add a small delay to simulate AI "thinking"
    setTimeout(() => {
      const { row, col } = findBestMove(boardState, AI_PLAYER, aiDifficulty);
      makeMove(row, col, AI_PLAYER, boardState);
      setAiThinking(false);
    }, 500);
  };
  
  // Handle cell press by human player
  const handleCellPress = (row: number, col: number) => {
    // If game is over, AI is thinking, or cell is already occupied, do nothing
    if (winner !== null || aiThinking || !isValidMove(board, row, col)) {
      return;
    }
    
    // If playing against AI and it's not the human's turn, do nothing
    if (vsAI && currentPlayer !== HUMAN_PLAYER) {
      return;
    }
    
    // Make the human move
    const gameEnded = makeMove(row, col, currentPlayer, board);
    
    // If playing against AI and the game hasn't ended, make AI move
    if (vsAI && !gameEnded && currentPlayer === AI_PLAYER) {
      makeAIMove(board);
    }
  };

  const handleRestart = () => {
    const newBoard = initializeBoard();
    setBoard(newBoard);
    setCurrentPlayer(HUMAN_PLAYER); // Human always starts with black stones
    setWinner(null);
    lastPlayedWinnerRef.current = null;
    
    // If playing against AI and AI goes first, make AI move
    if (vsAI && currentPlayer === AI_PLAYER) {
      makeAIMove(newBoard);
    }
  };
  
  // Toggle between playing against human or AI
  const toggleAIMode = () => {
    setVsAI(!vsAI);
    handleRestart();
  };
 
  const toggleAIDifficulty = () => {
    setAiDifficulty((prev) => (prev === 'intermediate' ? 'expert' : 'intermediate'));
  };
  
  // Toggle timer on/off
  const toggleTimer = () => {
    setTimerEnabled(!timerEnabled);
    // Reset timer when toggling
    setTimeLeft(TIMER_DURATION);
    timerAnimation.setValue(1);
  };
  
  // Handle time up - player loses their turn or makes a random move
  const handleTimeUp = () => {
    // If it's AI's turn and time is up, make a move anyway
    if (vsAI && currentPlayer === AI_PLAYER) {
      makeAIMove(board);
      return;
    }
    
    // For human players, either make a random move or forfeit turn
    const emptyPositions: {row: number, col: number}[] = [];
    
    // Find all empty positions
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === 0) {
          emptyPositions.push({row, col});
        }
      }
    }
    
    // If there are empty positions, make a random move
    if (emptyPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      const {row, col} = emptyPositions[randomIndex];
      makeMove(row, col, currentPlayer, board);
    } else {
      // No empty positions, game is a draw
      setWinner(0);
    }
  };
  
  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Only run timer if timer is enabled, game is active and not in AI thinking mode
    if (timerEnabled && winner === null && timerActive && !(vsAI && currentPlayer === AI_PLAYER && !aiThinking)) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Time's up - make a random move or forfeit
            clearInterval(interval!);
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      // Animate the timer
      Animated.timing(timerAnimation, {
        toValue: 0,
        duration: TIMER_DURATION * 1000,
        useNativeDriver: false,
      }).start();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPlayer, winner, timerActive, vsAI, aiThinking, timerEnabled]);
  
  // Effect to handle AI's move when it's AI's turn
  useEffect(() => {
    if (vsAI && currentPlayer === AI_PLAYER && winner === null && !aiThinking) {
      // Pause the timer during AI thinking
      setTimerActive(false);
      makeAIMove(board);
    }
  }, [currentPlayer, vsAI, winner]);
  
  // Reset timer when player changes
  useEffect(() => {
    // Reset timer for new turn
    setTimeLeft(TIMER_DURATION);
    timerAnimation.setValue(1);
    
    // Start timer if timer is enabled, it's not AI's turn, and game is not over
    setTimerActive(timerEnabled && !(vsAI && currentPlayer === AI_PLAYER) && winner === null);
    
    // Start animation if timer is enabled
    if (timerEnabled && winner === null) {
      Animated.timing(timerAnimation, {
        toValue: 0,
        duration: TIMER_DURATION * 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [currentPlayer, winner, timerEnabled]);

  // Calculate timer color based on time left
  const timerColor = timerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#ff0000', '#ffff00', '#00ff00']
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <GameStatus 
        currentPlayer={currentPlayer} 
        winner={winner} 
        onRestart={handleRestart} 
      />
      
      {/* Timer display */}
      {winner === null && timerEnabled && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>
            {currentPlayer === 1 ? '흑돌' : '백돌'} 시간:
          </Text>
          <View style={styles.timerBarContainer}>
            <Animated.View 
              style={[styles.timerBar, { 
                width: timerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }),
                backgroundColor: timerColor
              }]} 
            />
          </View>
          <Text style={styles.timerText}>{timeLeft}초</Text>
        </View>
      )}
      
      <View style={styles.switchesContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>플레이어 vs {vsAI ? 'AI' : '플레이어'}</Text>
          <Switch
            value={vsAI}
            onValueChange={toggleAIMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={vsAI ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        {vsAI && (
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>AI 난이도: {aiDifficulty === 'intermediate' ? '중급' : '고급'}</Text>
            <Switch
              value={aiDifficulty === 'expert'}
              onValueChange={toggleAIDifficulty}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={aiDifficulty === 'expert' ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>타이머 {timerEnabled ? '끄기' : '켜기'}</Text>
          <Switch
            value={timerEnabled}
            onValueChange={toggleTimer}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={timerEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>
      {aiThinking && <Text style={styles.thinkingText}>AI가 생각 중...</Text>}
      <Board 
        board={board} 
        onCellPress={handleCellPress} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 80,
  },
  timerBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
  switchesContainer: {
    width: '100%',
    marginVertical: 10,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  switchText: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  thinkingText: {
    marginVertical: 5,
    color: '#555',
    fontStyle: 'italic',
  },
});

export default Game;
