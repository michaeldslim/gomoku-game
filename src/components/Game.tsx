import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import Board from './Board';
import GameStatus from './GameStatus';
import Fireworks from './Fireworks';
import VictoryPopup from './VictoryPopup';
import {
  initializeBoard,
  isValidMove,
  checkWin,
  isBoardFull,
  getWinningCells,
  resolveBoardSizeFromWindow,
} from '../utils/gameLogic';
import { findBestMove } from '../utils/aiLogic';
import { MASTER_SCORE_THRESHOLD } from '../constants/scoring';
import { AI_PLAYER, EXPERT_THRESHOLD, HUMAN_PLAYER } from '../constants/game';
import { useGameSounds } from '../hooks/useGameSounds';
import { useGameTimer } from '../hooks/useGameTimer';
import { useScoreProgression } from '../hooks/useScoreProgression';
import { t } from '../utils/i18n';

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
  bgMusicEnabled = false,
  bgMusicVolume = 0.2,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, screenHeight) >= 600;
  const isLandscape = screenWidth > screenHeight;
  const isTabletLandscape = isTablet && isLandscape;

  const [board, setBoard] = useState<number[][]>(() =>
    initializeBoard(resolveBoardSizeFromWindow(screenWidth, screenHeight)),
  );
  const [currentPlayer, setCurrentPlayer] = useState<number>(HUMAN_PLAYER);
  const [winner, setWinner] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [boardHistory, setBoardHistory] = useState<Array<{
    board: number[][];
    currentPlayer: number;
    lastMove: { row: number; col: number } | null;
  }>>([]);
  const [undoCount, setUndoCount] = useState<number>(3);
  const undosUsedThisGameRef = useRef<number>(0);
  const [winningCells, setWinningCells] = useState<{ row: number; col: number }[] | null>(null);
  const [boardSize, setBoardSize] = useState<{ width: number; height: number }>({ width: 300, height: 300 });
  const [boardCenterTrigger, setBoardCenterTrigger] = useState(0);

  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<number[][]>(
    initializeBoard(resolveBoardSizeFromWindow(screenWidth, screenHeight)),
  );
  const currentPlayerRef = useRef<number>(HUMAN_PLAYER);
  const lastMoveRef = useRef<{ row: number; col: number } | null>(null);
  const controlsScrollRef = useRef<ScrollView | null>(null);
  const undoGenerationRef = useRef(0);
  const handleTimeUpRef = useRef<() => void>(() => {});

  const {
    totalScore,
    aiDifficulty,
    isMaster,
    isExpert,
    seg1Fill,
    seg2Fill,
    showFireworks,
    fireworksNonce,
    showVictoryPopup,
    popupText,
    popupScoreGain,
    showExpertToast,
    awardHumanWin,
    resetCelebration,
  } = useScoreProgression({
    initialScore,
    language,
    winner,
    vsAI,
    onScoreUpdate,
    onStartFreshRun,
    undosUsedThisGameRef,
    playWowSound: () => playWowSoundRef.current(),
  });

  const playWowSoundRef = useRef<() => void>(() => {});
  const { playStoneSound, playWowSound, resetWinnerSound } = useGameSounds({
    bgMusicEnabled,
    bgMusicVolume,
    winner,
    vsAI,
    totalScore,
  });
  playWowSoundRef.current = playWowSound;

  const cancelPendingAI = () => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setAiThinking(false);
  };

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentPlayerRef.current = currentPlayer; }, [currentPlayer]);
  useEffect(() => { lastMoveRef.current = lastMove; }, [lastMove]);

  const makeMove = useCallback((row: number, col: number, player: number, boardState: number[][]) => {
    const newBoard = boardState.map((r) => [...r]);
    newBoard[row][col] = player;

    playStoneSound();
    setLastMove({ row, col });

    if (checkWin(newBoard, row, col, player)) {
      setBoard(newBoard);
      setWinner(player);
      setWinningCells(getWinningCells(newBoard, row, col, player));
      if (vsAI && player === HUMAN_PLAYER) {
        awardHumanWin();
      }
      return true;
    }

    if (isBoardFull(newBoard)) {
      setBoard(newBoard);
      setWinner(0);
      return true;
    }

    setBoard(newBoard);
    setCurrentPlayer(player === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER);
    return false;
  }, [vsAI, playStoneSound, awardHumanWin]);

  const handleTimeUp = useCallback(() => {
    const currentBoard = boardRef.current;
    const player = currentPlayerRef.current;

    if (vsAI && player === AI_PLAYER) {
      return;
    }

    const emptyPositions: { row: number; col: number }[] = [];
    const currentBoardSize = currentBoard.length;
    for (let row = 0; row < currentBoardSize; row++) {
      for (let col = 0; col < currentBoardSize; col++) {
        if (isValidMove(currentBoard, row, col)) {
          emptyPositions.push({ row, col });
        }
      }
    }

    if (emptyPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      const { row, col } = emptyPositions[randomIndex];
      setBoardHistory((prev) => [
        ...prev,
        { board: currentBoard.map((r) => [...r]), currentPlayer: player, lastMove: lastMoveRef.current },
      ]);
      makeMove(row, col, player, currentBoard);
    } else {
      setWinner(0);
    }
  }, [vsAI, makeMove]);

  handleTimeUpRef.current = handleTimeUp;

  const {
    timeLeft,
    isAITurnForTimer,
    showMoodTimer,
    showTimerWarning,
    timerMood,
    resetTimerForTurn,
    pauseTimer,
  } = useGameTimer({
    timerEnabled,
    winner,
    vsAI,
    currentPlayer,
    aiThinking,
    onTimeUp: () => handleTimeUpRef.current(),
  });

  const makeAIMove = useCallback(() => {
    const turnToken = undoGenerationRef.current;
    setAiThinking(true);

    aiTimeoutRef.current = setTimeout(() => {
      aiTimeoutRef.current = null;
      if (turnToken !== undoGenerationRef.current) {
        setAiThinking(false);
        return;
      }
      if (currentPlayerRef.current !== AI_PLAYER) {
        setAiThinking(false);
        return;
      }

      const liveBoard = boardRef.current;
      const aiMoveOptions = {
        expertTopK: expertTopPool,
        intermediateTopPoolSize,
      };
      const { row, col } = findBestMove(liveBoard, AI_PLAYER, aiDifficulty, aiMoveOptions);
      makeMove(row, col, AI_PLAYER, liveBoard);
      setAiThinking(false);
    }, 1000);
  }, [aiDifficulty, expertTopPool, intermediateTopPoolSize, makeMove]);

  const handleCellPress = (row: number, col: number) => {
    if (winner !== null || aiThinking || !isValidMove(board, row, col)) {
      return;
    }
    if (vsAI && currentPlayer !== HUMAN_PLAYER) {
      return;
    }

    setBoardHistory((prev) => [...prev, { board: board.map((r) => [...r]), currentPlayer, lastMove }]);
    makeMove(row, col, currentPlayer, board);
  };

  const handleRestart = ({ forceHumanStart = false }: { forceHumanStart?: boolean } = {}) => {
    undoGenerationRef.current += 1;
    cancelPendingAI();

    const shouldAIStart = !forceHumanStart && vsAI && winner === AI_PLAYER;
    const nextStartingPlayer = shouldAIStart ? AI_PLAYER : HUMAN_PLAYER;

    const nextBoardSize = resolveBoardSizeFromWindow(screenWidth, screenHeight);
    setBoard(initializeBoard(nextBoardSize));
    setCurrentPlayer(nextStartingPlayer);
    setWinner(null);
    setWinningCells(null);
    setLastMove(null);
    resetWinnerSound();
    resetCelebration();
    setBoardHistory([]);
    setUndoCount(3);
    undosUsedThisGameRef.current = 0;
    setBoardCenterTrigger((prev) => prev + 1);
    resetTimerForTurn(!vsAI || nextStartingPlayer === HUMAN_PLAYER);
  };

  const handleUndo = () => {
    if (undoCount <= 0 || boardHistory.length === 0 || winner !== null) return;

    undoGenerationRef.current += 1;
    cancelPendingAI();

    const prev = boardHistory[boardHistory.length - 1];
    setBoardHistory((h) => h.slice(0, -1));
    setBoard(prev.board);
    setCurrentPlayer(prev.currentPlayer);
    setLastMove(prev.lastMove);
    setWinner(null);
    setWinningCells(null);
    setUndoCount((c) => c - 1);
    undosUsedThisGameRef.current += 1;
    resetTimerForTurn(!vsAI || prev.currentPlayer === HUMAN_PLAYER);
  };

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

  useEffect(() => {
    if (vsAI && currentPlayer === AI_PLAYER && winner === null && !aiThinking) {
      pauseTimer();
      makeAIMove();
    }
  }, [currentPlayer, vsAI, winner, aiThinking, makeAIMove, pauseTimer]);

  const boardColumnWidth = isTabletLandscape ? screenWidth * 0.62 : screenWidth;

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
              <Text style={styles.scoreThreshold}> / {isMaster ? MASTER_SCORE_THRESHOLD : EXPERT_THRESHOLD}</Text>
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
            <Text style={[styles.scoreMilestoneLabel, { position: 'absolute', right: 0 }]}>{MASTER_SCORE_THRESHOLD}</Text>
          </View>
        </View>
        {showMoodTimer && (
          <View
            style={[styles.moodTimerBox, { backgroundColor: isAITurnForTimer ? '#DBEAFE' : timerMood.bg }]}
            accessibilityLabel={showTimerWarning ? t(language, 'timerExpiryWarning') : undefined}
          >
            <Text style={styles.moodEmoji}>
              {showTimerWarning ? '⚠️' : isAITurnForTimer ? '🦊' : timerMood.emoji}
            </Text>
            <Text
              style={[
                styles.moodTimeText,
                {
                  color: showTimerWarning
                    ? '#B91C1C'
                    : isAITurnForTimer
                      ? '#1E40AF'
                      : timerMood.text,
                },
              ]}
            >
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
      onLayout={(e) => {
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
      <Fireworks
        key={fireworksNonce}
        visible={showFireworks}
        width={boardSize.width}
        height={boardSize.height}
      />
      <VictoryPopup
        visible={showVictoryPopup}
        winner={winner}
        text={popupText}
        subtitle={popupScoreGain != null && popupScoreGain > 0 ? `+${popupScoreGain}` : undefined}
        duration={popupText ? 4500 : 3000}
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

  const expertToastBlock = showExpertToast ? (
    <View style={styles.expertToast} pointerEvents="none">
      <Text style={styles.expertToastText}>{t(language, 'expertSwitchToast')}</Text>
    </View>
  ) : null;

  if (isTabletLandscape) {
    return (
      <View style={[styles.container, styles.containerLandscape]}>
        <View style={styles.landscapeSidebar}>
          <ScrollView contentContainerStyle={styles.landscapeSidebarContent} showsVerticalScrollIndicator={false}>
            {gameStatusBlock}
            {vsAI && scoreBannerBlock}
            {controlsBlock}
          </ScrollView>
        </View>
        <View style={styles.landscapeBoardColumn}>
          {boardBlock}
        </View>
        {expertToastBlock}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {gameStatusBlock}
      {vsAI && scoreBannerBlock}
      {controlsBlock}
      {boardBlock}
      {expertToastBlock}
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
  expertToast: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(30, 64, 175, 0.94)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 10000,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  expertToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Game;
