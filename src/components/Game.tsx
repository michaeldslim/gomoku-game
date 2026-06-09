import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Audio } from 'expo-av';
import Board from './Board';
import GameStatus from './GameStatus';
import Fireworks from './Fireworks';
import VictoryPopup from './VictoryPopup';
import { 
  BOARD_SIZE,
  TABLET_BOARD_PORTRAIT_SIZE,
  TABLET_BOARD_LANDSCAPE_SIZE,
  initializeBoard, 
  isValidMove, 
  checkWin, 
  isBoardFull,
  getWinningCells,
} from '../utils/gameLogic';
import { findBestMove, AIDifficulty } from '../utils/aiLogic';
import { t } from '../utils/i18n';

const TIMER_DURATION = 15; // 15 seconds per turn
const EXPERT_THRESHOLD = 80;

interface GameProps {
  initialScore?: number;
  onScoreUpdate?: (score: number) => void;
  onStartFreshRun?: (currentScore: number) => Promise<void> | void;
  onLeaderboard?: () => void;
  onSettings?: () => void;
  timerEnabled?: boolean;
  intermediateTopPoolSize?: number;
  expertTopPool?: number;
  language?: 'ko' | 'en';
  bgMusicEnabled?: boolean;
  bgMusicVolume?: number;
}

const Game: React.FC<GameProps> = ({
  initialScore = 0,
  onScoreUpdate,
  onStartFreshRun,
  onLeaderboard,
  onSettings,
  timerEnabled = false,
  intermediateTopPoolSize = 4,
  expertTopPool = 3,
  language = 'ko',
  bgMusicEnabled = true,
  bgMusicVolume = 0.2,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, screenHeight) >= 600;
  const isLandscape = screenWidth > screenHeight;
  const isTabletLandscape = isTablet && isLandscape;
  const activeBoardSize = isTablet
    ? (isLandscape ? TABLET_BOARD_LANDSCAPE_SIZE : TABLET_BOARD_PORTRAIT_SIZE)
    : BOARD_SIZE;
  const [board, setBoard] = useState<number[][]>(() => initializeBoard(activeBoardSize));
  const [currentPlayer, setCurrentPlayer] = useState<number>(1); // 1 for black, 2 for white
  const [winner, setWinner] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATION);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(
    initialScore >= EXPERT_THRESHOLD ? 'expert' : 'intermediate'
  );
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
  const [showVictoryPopup, setShowVictoryPopup] = useState<boolean>(false);
  const [popupText, setPopupText] = useState<string | undefined>(undefined);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [winningCells, setWinningCells] = useState<{ row: number; col: number }[] | null>(null);
  const [boardSize, setBoardSize] = useState<{ width: number; height: number }>({ width: 300, height: 300 });
  const [boardCenterTrigger, setBoardCenterTrigger] = useState(0);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<number[][]>(initializeBoard());
  const currentPlayerRef = useRef<number>(1);
  const lastMoveRef = useRef<{ row: number; col: number } | null>(null);
  const controlsScrollRef = useRef<ScrollView | null>(null);
  const winSoundRef = useRef<Audio.Sound | null>(null);
  const loseSoundRef = useRef<Audio.Sound | null>(null);
  const stoneSoundRef = useRef<Audio.Sound | null>(null);
  const wowSoundRef = useRef<Audio.Sound | null>(null);
  const bgMusicRef = useRef<Audio.Sound | null>(null);
  const lastPlayedWinnerRef = useRef<number | null>(null);
  const soundsReadyRef = useRef<boolean>(false);
  const soundsReadyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveSoundsReadyRef = useRef<(() => void) | null>(null);

  if (!soundsReadyPromiseRef.current) {
    soundsReadyPromiseRef.current = new Promise<void>((resolve) => {
      resolveSoundsReadyRef.current = resolve;
    });
  }
  
  // Keep refs in sync with state so stale-closure callbacks can read the latest values
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentPlayerRef.current = currentPlayer; }, [currentPlayer]);
  useEffect(() => { lastMoveRef.current = lastMove; }, [lastMove]);

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

        // Load background music separately so a failure here never blocks
        // the other sounds from playing.
        try {
          const bgResult = await Audio.Sound.createAsync(
            require('../../assets/sounds/bm.mp3'),
            { shouldPlay: bgMusicEnabled, isLooping: true, volume: bgMusicVolume }
          );

          if (cancelled) {
            await bgResult.sound.stopAsync();
            await bgResult.sound.unloadAsync();
            return;
          }

          bgMusicRef.current = bgResult.sound;
        } catch {
          // Background music failed to load — other sounds still work
        }
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
          if (bgMusicRef.current) {
            await bgMusicRef.current.stopAsync();
            await bgMusicRef.current.unloadAsync();
          }
        } catch {
          // Ignore unload errors
        } finally {
          winSoundRef.current = null;
          loseSoundRef.current = null;
          stoneSoundRef.current = null;
          wowSoundRef.current = null;
          bgMusicRef.current = null;
          soundsReadyRef.current = false;
          soundsReadyPromiseRef.current = null;
          resolveSoundsReadyRef.current = null;
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (initialScore >= EXPERT_THRESHOLD) {
      setAiDifficulty('expert');
    }
  }, [initialScore]);

  // Sync background music enabled/volume with the live sound object
  useEffect(() => {
    (async () => {
      try {
        if (!bgMusicRef.current) return;
        if (bgMusicEnabled) {
          await bgMusicRef.current.setVolumeAsync(bgMusicVolume);
          await bgMusicRef.current.playAsync();
        } else {
          await bgMusicRef.current.pauseAsync();
        }
      } catch {
        // Ignore
      }
    })();
  }, [bgMusicEnabled, bgMusicVolume]);

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
      setWinningCells(getWinningCells(newBoard, row, col, player));
      // Award score only when human wins vs AI
      if (vsAI && player === HUMAN_PLAYER) {
        const gained = Math.max(0, 10 - undosUsedThisGameRef.current);
        setTotalScore(prev => {
          // Clamp gain to what's actually remaining so displayed gain = actual delta
          const actualGained = Math.min(gained, 100 - prev);
          const next = prev + actualGained;
          if (next >= 80) {
            setAiDifficulty('expert');
          }
          return next;
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
    aiTimeoutRef.current = setTimeout(() => {
      aiTimeoutRef.current = null;
      const aiMoveOptions: any = {
        expertTopK: expertTopPool,
        intermediateTopPoolSize,
      };
      const { row, col } = findBestMove(boardState, AI_PLAYER, aiDifficulty, aiMoveOptions);
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
    
    // Make the human move — AI turn is triggered by the currentPlayer useEffect
    makeMove(row, col, currentPlayer, board);
  };

  const handleRestart = ({ forceHumanStart = false }: { forceHumanStart?: boolean } = {}) => {
    // Cancel any pending AI move from the previous game
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setAiThinking(false);

    // If AI won the last game, let AI start on restart unless explicitly overridden.
    const shouldAIStart = !forceHumanStart && vsAI && winner === AI_PLAYER;
    const nextStartingPlayer = shouldAIStart ? AI_PLAYER : HUMAN_PLAYER;

    const newBoard = initializeBoard(activeBoardSize);
    setBoard(newBoard);
    setCurrentPlayer(nextStartingPlayer);
    setWinner(null);
    setWinningCells(null);
    setLastMove(null);
    lastPlayedWinnerRef.current = null;
    setBoardHistory([]);
    setUndoCount(3);
    undosUsedThisGameRef.current = 0;
    setBoardCenterTrigger(prev => prev + 1);
    const nextTurnIsHuman = !vsAI || nextStartingPlayer === HUMAN_PLAYER;
    if (nextTurnIsHuman) {
      setTimeLeft(TIMER_DURATION);
    }
    setTimerActive(timerEnabled && nextTurnIsHuman);
    // AI turn will auto-trigger via currentPlayer useEffect when nextStartingPlayer is AI.
  };

  const handleUndo = () => {
    if (undoCount <= 0 || boardHistory.length === 0 || aiThinking || winner !== null) return;
    const prev = boardHistory[boardHistory.length - 1];
    setBoardHistory(h => h.slice(0, -1));
    setBoard(prev.board);
    setCurrentPlayer(prev.currentPlayer);
    setLastMove(prev.lastMove);
    setWinner(null);
    setWinningCells(null);
    setUndoCount(c => c - 1);
    undosUsedThisGameRef.current += 1;
  };
  
  // Toggle between playing against human or AI
  const toggleAIMode = () => {
    setVsAI(!vsAI);
    handleRestart({ forceHumanStart: true });
  };
 
  const scrollControlsToStart = () => {
    controlsScrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scrollControlsToEnd = () => {
    controlsScrollRef.current?.scrollToEnd({ animated: true });
  };

  // Handle time up - player loses their turn or makes a random move
  const handleTimeUp = () => {
    // Read from refs so this always operates on the latest board/player,
    // even when called from inside a stale setInterval closure.
    const currentBoard = boardRef.current;
    const player = currentPlayerRef.current;

    // Timer is human-only in vsAI mode.
    if (vsAI && player === AI_PLAYER) {
      return;
    }
    
    // For human players, either make a random move or forfeit turn
    const emptyPositions: {row: number, col: number}[] = [];
    
    // Find all empty positions
    const currentBoardSize = currentBoard.length;
    for (let row = 0; row < currentBoardSize; row++) {
      for (let col = 0; col < currentBoardSize; col++) {
        if (isValidMove(currentBoard, row, col)) {
          emptyPositions.push({row, col});
        }
      }
    }
    
    // If there are empty positions, make a random move
    if (emptyPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      const {row, col} = emptyPositions[randomIndex];
      // Save undo snapshot so the player can undo a timer-forced move
      setBoardHistory(prev => [...prev, { board: currentBoard.map(r => [...r]), currentPlayer: player, lastMove: lastMoveRef.current }]);
      makeMove(row, col, player, currentBoard);
    } else {
      // No empty positions, game is a draw
      setWinner(0);
    }
  };
  
  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
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
      makeAIMove(boardRef.current);
    }
  }, [currentPlayer, vsAI, winner]);
  
  // Reset timer when player changes
  useEffect(() => {
    // Reset timer for new turn
    setTimeLeft(TIMER_DURATION);
    
    // Start timer if enabled, game is active, and this is a human turn.
    setTimerActive(timerEnabled && !(vsAI && currentPlayer === AI_PLAYER) && winner === null);
  }, [currentPlayer, winner, timerEnabled]);

  // Trigger fireworks on each human win
  useEffect(() => {
    if (winner !== HUMAN_PLAYER) return;
    // If score just hit 100, the score-100 effect handles fireworks (4.5 s)
    if (totalScore >= 100) return;
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    setShowFireworks(true);
    setShowVictoryPopup(true);
    popupTimeoutRef.current = setTimeout(() => {
      setShowFireworks(false);
      setShowVictoryPopup(false);
      popupTimeoutRef.current = null;
    }, 3000);
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    };
  }, [winner]);

  // Show loss popup when AI wins
  useEffect(() => {
    if (winner !== AI_PLAYER) return;
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    setShowVictoryPopup(true);
    popupTimeoutRef.current = setTimeout(() => {
      setShowVictoryPopup(false);
      popupTimeoutRef.current = null;
    }, 3000);
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    };
  }, [winner]);

  // Trigger fireworks when score first reaches 100; sync score to DB
  useEffect(() => {
    if (!hasMountedScoreEffectRef.current) {
      hasMountedScoreEffectRef.current = true;
      return;
    }
    if (totalScore >= 100 && prevTotalScoreRef.current < 100) {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
      setShowFireworks(true);
      setPopupText(t(language, 'scoreGreat'));
      setShowVictoryPopup(true);
      popupTimeoutRef.current = setTimeout(() => {
        setShowFireworks(false);
        setShowVictoryPopup(false);
        setPopupText(undefined);
        setTotalScore(0);
        setAiDifficulty('intermediate');
        popupTimeoutRef.current = null;
      }, 4500);
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

  const MASTER_THRESHOLD = 100;
  const isMaster = totalScore >= MASTER_THRESHOLD;
  const isExpert = totalScore >= EXPERT_THRESHOLD;
  const isAITurnForTimer = vsAI && currentPlayer === AI_PLAYER;
  const showMoodTimer = winner === null && timerEnabled;
  const timerMood = timeLeft > 10
    ? { emoji: '🙂', bg: '#DCFCE7', text: '#166534' }
    : timeLeft > 6
    ? { emoji: '😐', bg: '#FEF9C3', text: '#854D0E' }
    : timeLeft > 3
    ? { emoji: '😰', bg: '#FFEDD5', text: '#9A3412' }
    : { emoji: '😭', bg: '#FEE2E2', text: '#991B1B' };
  // Segment widths: segment1 is 80% of bar, segment2 is 20%
  const seg1Fill = Math.min(1, totalScore / EXPERT_THRESHOLD);
  const seg2Fill = isExpert ? Math.min(1, (totalScore - EXPERT_THRESHOLD) / (MASTER_THRESHOLD - EXPERT_THRESHOLD)) : 0;

  // In landscape the board lives in the right 62% column
  const boardColumnWidth = isTabletLandscape ? screenWidth * 0.62 : screenWidth;

  // ── Reusable UI blocks ──────────────────────────────────────────────────────

  const gameStatusBlock = (
    <GameStatus
      currentPlayer={currentPlayer}
      winner={winner}
      onRestart={handleRestart}
      onUndo={handleUndo}
      undoCount={undoCount}
      onLeaderboard={onLeaderboard}
      language={language}
    />
  );

  const scoreBannerBlock = (
    <View style={styles.scoreBanner}>
      <View style={styles.scoreBannerContent}>
        <View style={[styles.scoreInfoBlock, showMoodTimer && styles.scoreInfoBlockNarrow]}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreMain}>
              <Text style={styles.scoreLabel}>{t(language, 'score')}</Text>
              <Text style={[styles.scoreValue, isMaster && { color: '#D97706' }, isExpert && !isMaster && { color: '#E63946' }]}>
                {totalScore}
              </Text>
              <Text style={styles.scoreThreshold}> / {isMaster ? MASTER_THRESHOLD : EXPERT_THRESHOLD}</Text>
              {isMaster ? (
                <View style={[styles.expertBadge, { backgroundColor: '#D97706' }]}>
                  <Text style={styles.expertBadgeText}>{t(language, 'masterBadge')}</Text>
                </View>
              ) : isExpert ? (
                <View style={styles.expertBadge}>
                  <Text style={styles.expertBadgeText}>{t(language, 'expertAutoBadge')}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Two-segment bar */}
          <View style={styles.scoreBarOuter}>
            <View style={[styles.scoreBarSegment, { flex: 80 }]}>
              <View style={styles.scoreBarTrack}>
                <View style={[styles.scoreBarFill, { width: `${seg1Fill * 100}%`, backgroundColor: '#457B9D' }]} />
              </View>
            </View>
            <View style={styles.scoreMilestoneDivider} />
            <View style={[styles.scoreBarSegment, { flex: 20 }]}>
              <View style={[styles.scoreBarTrack, { backgroundColor: isExpert ? '#FECACA' : '#E5E7EB' }]}>
                <View style={[styles.scoreBarFill, { width: `${seg2Fill * 100}%`, backgroundColor: '#E63946' }]} />
              </View>
            </View>
          </View>

          <View style={styles.scoreLabelRow}>
            <Text style={styles.scoreMilestoneLabel}>0</Text>
            <Text style={[styles.scoreMilestoneLabel, { position: 'absolute', left: '78%' }]}>80</Text>
            <Text style={[styles.scoreMilestoneLabel, { position: 'absolute', right: 0 }]}>100</Text>
          </View>
        </View>
        {showMoodTimer && (
          <View style={[styles.moodTimerBox, { backgroundColor: isAITurnForTimer ? '#DBEAFE' : timerMood.bg }]}>
            <Text style={styles.moodEmoji}>{isAITurnForTimer ? '🦊' : timerMood.emoji}</Text>
            <Text style={[styles.moodTimeText, { color: isAITurnForTimer ? '#1E40AF' : timerMood.text }]}>
              {isAITurnForTimer ? 'AI' : `${timeLeft}s`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const controlsBlock = (
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
            <Text style={styles.controlLabel}>{t(language, 'modeLabel')}</Text>
            <View style={styles.chipGroup}>
              <TouchableOpacity
                style={[styles.chip, vsAI && styles.chipActive]}
                onPress={() => { if (!vsAI) toggleAIMode(); }}
              >
                <Text style={[styles.chipText, vsAI && styles.chipTextActive]}>AI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, !vsAI && styles.chipActive]}
                onPress={() => { if (vsAI) toggleAIMode(); }}
              >
                <Text style={[styles.chipText, !vsAI && styles.chipTextActive]}>2P</Text>
              </TouchableOpacity>
            </View>
          </View>
          {onSettings && (
            <View style={styles.inlineGroup}>
              <Text style={styles.controlLabel}>{t(language, 'settingsLabel')}</Text>
              <View style={styles.chipGroup}>
                <TouchableOpacity style={styles.chip} onPress={onSettings}>
                  <Text style={styles.chipText}>{t(language, 'openSettings')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.arrowButton} onPress={scrollControlsToEnd}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const boardBlock = (
    <View
      style={styles.boardWrapper}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setBoardSize({ width, height });
      }}
    >
      <Board
        board={board}
        onCellPress={handleCellPress}
        lastMove={lastMove}
        winningCells={winningCells}
        centerTrigger={boardCenterTrigger}
        availableWidth={boardColumnWidth}
      />
      <Fireworks visible={showFireworks} width={boardSize.width} height={boardSize.height} />
      <VictoryPopup
        visible={showVictoryPopup}
        winner={winner}
        text={popupText}
        duration={3000}
        language={language}
      />
      {aiThinking && vsAI && (
        <View style={styles.aiThinkingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#457B9D" />
          <Text style={styles.aiThinkingText}>{t(language, 'aiThinking')}</Text>
        </View>
      )}
    </View>
  );

  // ── Landscape tablet: left sidebar + right board ────────────────────────────
  if (isTabletLandscape) {
    return (
      <View style={[styles.container, styles.containerLandscape]}>
        {/* Left sidebar: all controls */}
        <View style={styles.landscapeSidebar}>
          <ScrollView contentContainerStyle={styles.landscapeSidebarContent} showsVerticalScrollIndicator={false}>
            {gameStatusBlock}
            {scoreBannerBlock}
            {controlsBlock}
          </ScrollView>
        </View>

        {/* Right column: board only */}
        <View style={styles.landscapeBoardColumn}>
          {boardBlock}
        </View>
      </View>
    );
  }

  // ── Portrait (phone or tablet) ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {gameStatusBlock}
      {scoreBannerBlock}
      {controlsBlock}
      {boardBlock}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  containerLandscape: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingBottom: 0,
  },
  landscapeSidebar: {
    flex: 38,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  landscapeSidebarContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  landscapeBoardColumn: {
    flex: 62,
    justifyContent: 'center',
    alignItems: 'center',
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
  scoreBannerContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreInfoBlock: {
    flex: 1,
  },
  scoreInfoBlockNarrow: {
    width: '85%',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  moodTimerBox: {
    width: '15%',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodTimeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  boardWrapper: {
    position: 'relative',
    alignSelf: 'stretch',
  },
  aiThinkingOverlay: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiThinkingText: {
    fontSize: 12,
    color: '#457B9D',
    fontWeight: '600',
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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  chipDisabled: {
    opacity: 0.35,
  },
  chipActive: {
    borderColor: '#457B9D',
    backgroundColor: '#457B9D',
  },
  chipActiveExpert: {
    borderColor: '#E63946',
    backgroundColor: '#E63946',
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
