import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import Board from './Board';
import GameStatus from './GameStatus';
import Fireworks from './Fireworks';
import { 
  BOARD_SIZE, 
  initializeBoard, 
  isValidMove, 
  checkWin, 
  isBoardFull 
} from '../utils/gameLogic';
import { findBestMove, AIDifficulty } from '../utils/aiLogic';

const TIMER_DURATION = 10; // 10 seconds per turn

interface GameProps {
  initialScore?: number;
  onScoreUpdate?: (score: number) => void;
  onExit?: () => void;
  onLeaderboard?: () => void;
  isLoggedIn?: boolean;
  onLoginPress?: () => void;
}

const Game: React.FC<GameProps> = ({ initialScore = 0, onScoreUpdate, onExit, onLeaderboard, isLoggedIn, onLoginPress }) => {
  const [board, setBoard] = useState<number[][]>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<number>(1); // 1 for black, 2 for white
  const [winner, setWinner] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATION);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false); // Timer disabled by default
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('intermediate');
  const [boardHistory, setBoardHistory] = useState<Array<{
    board: number[][];
    currentPlayer: number;
    lastMove: { row: number; col: number } | null;
  }>>([]);
  const [undoCount, setUndoCount] = useState<number>(3);
  const [totalScore, setTotalScore] = useState<number>(initialScore);
  const undosUsedThisGameRef = useRef<number>(0);
  const prevTotalScoreRef = useRef<number>(initialScore);
  const hasMountedScoreEffectRef = useRef<boolean>(false);
  const [showFireworks, setShowFireworks] = useState<boolean>(false);
  const timerAnimation = useRef(new Animated.Value(1)).current;
  const controlsScrollRef = useRef<ScrollView | null>(null);
  const winSoundRef = useRef<Audio.Sound | null>(null);
  const loseSoundRef = useRef<Audio.Sound | null>(null);
  const stoneSoundRef = useRef<Audio.Sound | null>(null);
  const wowSoundRef = useRef<Audio.Sound | null>(null);
  const lastPlayedWinnerRef = useRef<number | null>(null);
  const soundsReadyRef = useRef<boolean>(false);
  const soundsReadyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveSoundsReadyRef = useRef<(() => void) | null>(null);

  if (!soundsReadyPromiseRef.current) {
    soundsReadyPromiseRef.current = new Promise<void>((resolve) => {
      resolveSoundsReadyRef.current = resolve;
    });
  }
  
  // AI is always player 2 (white)
  const AI_PLAYER = 2;
  const HUMAN_PLAYER = 1;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const winResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/win.mp3'),
          { shouldPlay: false }
        );
        const loseResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/lose.mp3'),
          { shouldPlay: false }
        );
        const stoneResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/stone.mp3'),
          { shouldPlay: false }
        );
        const wowResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/wow.mp3'),
          { shouldPlay: false }
        );

        if (cancelled) {
          await winResult.sound.unloadAsync();
          await loseResult.sound.unloadAsync();
          await stoneResult.sound.unloadAsync();
          await wowResult.sound.unloadAsync();
          return;
        }

        winSoundRef.current = winResult.sound;
        loseSoundRef.current = loseResult.sound;
        stoneSoundRef.current = stoneResult.sound;
        wowSoundRef.current = wowResult.sound;

        try {
          await stoneResult.sound.setVolumeAsync(0);
          await stoneResult.sound.setPositionAsync(0);
          await stoneResult.sound.playAsync();
          // Give the audio session time to activate before pausing.
          await new Promise(r => setTimeout(r, 300));
          await stoneResult.sound.pauseAsync();
        } catch {
          // Ignore warm-up errors
        } finally {
          // Always restore volume and position regardless of warm-up success/failure
          try {
            await stoneResult.sound.setVolumeAsync(1);
            await stoneResult.sound.setPositionAsync(0);
          } catch {
            // Ignore
          }
        }

        soundsReadyRef.current = true;
        resolveSoundsReadyRef.current?.();
        resolveSoundsReadyRef.current = null;
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
          if (stoneSoundRef.current) {
            await stoneSoundRef.current.unloadAsync();
          }
          if (wowSoundRef.current) {
            await wowSoundRef.current.unloadAsync();
          }
        } catch {
          // Ignore unload errors
        } finally {
          winSoundRef.current = null;
          loseSoundRef.current = null;
          stoneSoundRef.current = null;
          wowSoundRef.current = null;
          soundsReadyRef.current = false;
          soundsReadyPromiseRef.current = null;
          resolveSoundsReadyRef.current = null;
        }
      })();
    };
  }, []);

  const playStoneSound = () => {
    (async () => {
      try {
        if (!soundsReadyRef.current && soundsReadyPromiseRef.current) {
          await soundsReadyPromiseRef.current;
        }

        if (!stoneSoundRef.current) return;

        await stoneSoundRef.current.replayAsync();
      } catch {
        // Ignore playback errors
      }
    })();
  };

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
        const soundToPlay = shouldPlayLose
          ? loseSoundRef.current
          : totalScore >= 100
          ? wowSoundRef.current
          : winSoundRef.current;

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

    playStoneSound();
    setLastMove({ row, col });
    
    // Check for win
    if (checkWin(newBoard, row, col, player)) {
      setBoard(newBoard);
      setWinner(player);
      // Award score only when human wins vs AI
      if (vsAI && player === HUMAN_PLAYER) {
        const gained = Math.max(0, 10 - undosUsedThisGameRef.current);
        setTotalScore(prev => {
          const next = prev + gained;
          if (next >= 80) {
            setAiDifficulty('expert');
          }
          return Math.min(next, 100); // cap at master threshold
        });
      }
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
    }, 1000);
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

    // Save snapshot for undo before making the move
    setBoardHistory(prev => [...prev, { board: board.map(r => [...r]), currentPlayer, lastMove }]);
    
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
    setCurrentPlayer(HUMAN_PLAYER);
    setWinner(null);
    setLastMove(null);
    lastPlayedWinnerRef.current = null;
    setBoardHistory([]);
    setUndoCount(3);
    undosUsedThisGameRef.current = 0;

    if (vsAI && currentPlayer === AI_PLAYER) {
      makeAIMove(newBoard);
    }
  };

  const handleUndo = () => {
    if (undoCount <= 0 || boardHistory.length === 0 || aiThinking) return;
    const prev = boardHistory[boardHistory.length - 1];
    setBoardHistory(h => h.slice(0, -1));
    setBoard(prev.board);
    setCurrentPlayer(prev.currentPlayer);
    setLastMove(prev.lastMove);
    setWinner(null);
    setUndoCount(c => c - 1);
    undosUsedThisGameRef.current += 1;
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

  const scrollControlsToStart = () => {
    controlsScrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scrollControlsToEnd = () => {
    controlsScrollRef.current?.scrollToEnd({ animated: true });
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
        if (isValidMove(board, row, col)) {
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

  // Trigger fireworks when score first reaches 100; sync score to DB
  useEffect(() => {
    if (!hasMountedScoreEffectRef.current) {
      hasMountedScoreEffectRef.current = true;
      return;
    }
    if (totalScore >= 100 && prevTotalScoreRef.current < 100) {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 4500);
      // Play wow sound
      (async () => {
        try {
          if (wowSoundRef.current) {
            await wowSoundRef.current.setPositionAsync(0);
            await wowSoundRef.current.playAsync();
          }
        } catch {
          // Ignore playback errors
        }
      })();
    }
    // Sync new best score to DB if it increased
    if (totalScore > prevTotalScoreRef.current && onScoreUpdate) {
      onScoreUpdate(totalScore);
    }
    prevTotalScoreRef.current = totalScore;
  }, [totalScore]);

  // Calculate timer color based on time left
  const timerColor = timerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#ff0000', '#ffff00', '#00ff00']
  });

  const EXPERT_THRESHOLD = 80;
  const MASTER_THRESHOLD = 100;
  const isMaster = totalScore >= MASTER_THRESHOLD;
  const isExpert = totalScore >= EXPERT_THRESHOLD;
  // Segment widths: segment1 is 80% of bar, segment2 is 20%
  const seg1Fill = Math.min(1, totalScore / EXPERT_THRESHOLD);
  const seg2Fill = isExpert ? Math.min(1, (totalScore - EXPERT_THRESHOLD) / (MASTER_THRESHOLD - EXPERT_THRESHOLD)) : 0;

  return (
    <View style={styles.container}>
      <GameStatus 
        currentPlayer={currentPlayer} 
        winner={winner} 
        onRestart={handleRestart}
        onUndo={handleUndo}
        undoCount={undoCount}
        onLeaderboard={onLeaderboard}
      />

      {/* Score banner */}
      <View style={styles.scoreBanner}>
        {/* Header row: label + score + badges */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>점수</Text>
          <Text style={[styles.scoreValue, isMaster && { color: '#D97706' }, isExpert && !isMaster && { color: '#E63946' }]}>
            {totalScore}
          </Text>
          <Text style={styles.scoreThreshold}> / {isMaster ? MASTER_THRESHOLD : EXPERT_THRESHOLD}</Text>
          {isMaster ? (
            <View style={[styles.expertBadge, { backgroundColor: '#D97706' }]}>
              <Text style={styles.expertBadgeText}>🏆 마스터</Text>
            </View>
          ) : isExpert ? (
            <View style={styles.expertBadge}>
              <Text style={styles.expertBadgeText}>고급 자동 전환</Text>
            </View>
          ) : null}
          {onExit && (
            <TouchableOpacity onPress={onExit} style={styles.exitButton}>
              <Text style={styles.exitButtonText}>홈</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Two-segment bar */}
        <View style={styles.scoreBarOuter}>
          {/* Segment 1: 0 → 80 (80% width of total bar) */}
          <View style={[styles.scoreBarSegment, { flex: 80 }]}>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${seg1Fill * 100}%`, backgroundColor: '#457B9D' }]} />
            </View>
          </View>

          {/* Milestone divider at 80 */}
          <View style={styles.scoreMilestoneDivider} />

          {/* Segment 2: 80 → 100 (20% width of total bar) */}
          <View style={[styles.scoreBarSegment, { flex: 20 }]}>
            <View style={[styles.scoreBarTrack, { backgroundColor: isExpert ? '#FECACA' : '#E5E7EB' }]}>
              <View style={[styles.scoreBarFill, { width: `${seg2Fill * 100}%`, backgroundColor: '#E63946' }]} />
            </View>
          </View>
        </View>

        {/* Milestone labels */}
        <View style={styles.scoreLabelRow}>
          <Text style={styles.scoreMilestoneLabel}>0</Text>
          <Text style={[styles.scoreMilestoneLabel, { position: 'absolute', left: '78%' }]}>80</Text>
          <Text style={[styles.scoreMilestoneLabel, { position: 'absolute', right: 0 }]}>100</Text>
        </View>
      </View>

      {/* Login nudge after human win when not logged in */}
      {winner === HUMAN_PLAYER && !isLoggedIn && onLoginPress && (
        <TouchableOpacity style={styles.loginNudge} onPress={onLoginPress}>
          <Text style={styles.loginNudgeText}>
            🏅 로그인하면 리더보드에 점수가 저장됩니다
          </Text>
          <Text style={styles.loginNudgeAction}>Google 로그인</Text>
        </TouchableOpacity>
      )}
      
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
        <View style={styles.controlsWrapper}>
          <TouchableOpacity style={styles.arrowButton} onPress={scrollControlsToStart}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          <ScrollView
            ref={controlsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.controlBar}
          >
            <View style={styles.inlineGroup}>
              <Text style={styles.controlLabel}>모드</Text>
              <View style={styles.chipGroup}>
                <TouchableOpacity
                  style={[styles.chip, vsAI && styles.chipActive]}
                  onPress={() => {
                    if (!vsAI) toggleAIMode();
                  }}
                >
                  <Text style={[styles.chipText, vsAI && styles.chipTextActive]}>AI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, !vsAI && styles.chipActive]}
                  onPress={() => {
                    if (vsAI) toggleAIMode();
                  }}
                >
                  <Text style={[styles.chipText, !vsAI && styles.chipTextActive]}>2P</Text>
                </TouchableOpacity>
              </View>
            </View>

            {vsAI && (
              <View style={styles.inlineGroup}>
                <Text style={styles.controlLabel}>난이도</Text>
                <View style={styles.chipGroup}>
                  <TouchableOpacity
                    style={[styles.chip, aiDifficulty === 'intermediate' && styles.chipActive]}
                    onPress={() => {
                      if (aiDifficulty !== 'intermediate') toggleAIDifficulty();
                    }}
                  >
                    <Text style={[styles.chipText, aiDifficulty === 'intermediate' && styles.chipTextActive]}>중급</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, aiDifficulty === 'expert' && styles.chipActive]}
                    onPress={() => {
                      if (aiDifficulty !== 'expert') toggleAIDifficulty();
                    }}
                  >
                    <Text style={[styles.chipText, aiDifficulty === 'expert' && styles.chipTextActive]}>고급</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inlineGroup}>
              <Text style={styles.controlLabel}>타이머</Text>
              <View style={styles.chipGroup}>
                <TouchableOpacity
                  style={[styles.chip, timerEnabled && styles.chipActive]}
                  onPress={toggleTimer}
                >
                  <Text style={[styles.chipText, timerEnabled && styles.chipTextActive]}>
                    {timerEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.arrowButton} onPress={scrollControlsToEnd}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.boardWrapper}>
        <Board 
          board={board} 
          onCellPress={handleCellPress} 
          lastMove={lastMove}
        />
        <Fireworks visible={showFireworks} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  scoreBanner: {
    alignSelf: 'stretch',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginRight: 6,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  scoreThreshold: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  scoreBarOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  scoreBarSegment: {
    height: 8,
  },
  scoreBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreMilestoneDivider: {
    width: 2,
    height: 14,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  scoreLabelRow: {
    flexDirection: 'row',
    marginTop: 2,
    position: 'relative',
  },
  scoreMilestoneLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  loginNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 6,
    gap: 8,
  },
  loginNudgeText: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  loginNudgeAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  expertBadge: {
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  expertBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  exitButton: {
    marginLeft: 'auto',
    backgroundColor: '#6C757D',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  boardWrapper: {
    position: 'relative',
    alignSelf: 'stretch',
  },
  timerContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 16,
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
    alignSelf: 'stretch',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  controlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlBar: {
    alignItems: 'center',
    gap: 12,
  },
  arrowButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    lineHeight: 16,
  },
  inlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 44,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: '#457B9D',
    backgroundColor: '#457B9D',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});

export default Game;
