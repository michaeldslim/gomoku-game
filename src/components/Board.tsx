import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, View, StyleSheet, TouchableOpacity, Platform, ScrollView, useWindowDimensions } from 'react-native';
import Stone from './Stone';
import { BOARD_SIZE } from '../utils/gameLogic';

interface BoardProps {
  board: number[][];
  onCellPress: (row: number, col: number) => void;
  lastMove?: { row: number; col: number } | null;
  winningCells?: { row: number; col: number }[] | null;
  centerTrigger?: number;
  /** Override the width used for cell-size calculation (e.g. when board lives in a column) */
  availableWidth?: number;
}

const BOARD_PADDING = 15;
const OUTER_LINE_THICKNESS = 4;
const TABLET_BREAKPOINT = 600;

const Board: React.FC<BoardProps> = ({ board, onCellPress, lastMove, winningCells, centerTrigger = 0, availableWidth }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, screenHeight) >= TABLET_BREAKPOINT;
  const isLandscape = screenWidth > screenHeight;
  const boardSize = board.length > 0 ? board.length : BOARD_SIZE;
  // Use caller-supplied width if given (landscape split), otherwise full screen width
  const effectiveWidth = availableWidth ?? screenWidth;
  // On tablet, fit the board width exactly into the available column width
  const CELL_SIZE = isTablet
    ? Math.min(48, Math.floor((effectiveWidth - 32 - BOARD_PADDING * 2) / (boardSize - 1)))
    : 30;
  // In landscape the screen is short — use nearly all height; portrait caps at 55%
  const maxBoardVisibleHeight = isTablet
    ? (isLandscape ? screenHeight * 0.95 : screenHeight * 0.85)
    : screenHeight * 0.55;
  const horizontalScrollRef = useRef<ScrollView | null>(null);
  const verticalScrollRef = useRef<ScrollView | null>(null);
  const hasAutoCenteredRef = useRef(false);
  const [horizontalViewportWidth, setHorizontalViewportWidth] = useState(0);
  const [verticalViewportHeight, setVerticalViewportHeight] = useState(0);
  const webNoOutlineStyle = Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
    : null;
  const boardPixelSize = CELL_SIZE * (boardSize - 1) + BOARD_PADDING * 2;
  const centerLineIndex = Math.floor(boardSize / 2);
  const boardCenterOffset = centerLineIndex * CELL_SIZE;

  const centerBoard = useCallback(
    (animated: boolean) => {
      if (!horizontalViewportWidth || !verticalViewportHeight) return;

      // Center the board on the center intersection (red dot). This is more
      // robust when line thickness or padding changes affect visual bounds.
      const centerX = BOARD_PADDING + boardCenterOffset;
      const centerY = BOARD_PADDING + boardCenterOffset;

      const targetX = Math.max(0, centerX - horizontalViewportWidth / 2);
      const targetY = Math.max(0, centerY - verticalViewportHeight / 2);

      horizontalScrollRef.current?.scrollTo({ x: targetX, y: 0, animated });
      verticalScrollRef.current?.scrollTo({ x: 0, y: targetY, animated });
    },
    [boardPixelSize, horizontalViewportWidth, verticalViewportHeight, CELL_SIZE]
  );

  useEffect(() => {
    if (hasAutoCenteredRef.current) return;
    if (!horizontalViewportWidth || !verticalViewportHeight) return;

    hasAutoCenteredRef.current = true;
    centerBoard(false);
  }, [centerBoard, horizontalViewportWidth, verticalViewportHeight]);

  useEffect(() => {
    if (!horizontalViewportWidth || !verticalViewportHeight) return;
    centerBoard(true);
  }, [centerTrigger, centerBoard, horizontalViewportWidth, verticalViewportHeight]);

  const handleHorizontalLayout = (event: LayoutChangeEvent) => {
    setHorizontalViewportWidth(event.nativeEvent.layout.width);
  };

  const handleVerticalLayout = (event: LayoutChangeEvent) => {
    setVerticalViewportHeight(event.nativeEvent.layout.height);
  };

  // Build a Set for O(1) winning-cell lookup
  const winningSet = winningCells
    ? new Set(winningCells.map(c => `${c.row},${c.col}`))
    : null;

  // Create grid lines (memoized)
  const gridLines = React.useMemo(() => {
    const lines: React.ReactNode[] = [];

    // Horizontal lines
    for (let i = 0; i < boardSize; i++) {
      const isOuter = i === 0 || i === boardSize - 1;
      const topBase = BOARD_PADDING + i * CELL_SIZE;
      const top = isOuter ? topBase - (OUTER_LINE_THICKNESS - 1) / 2 : topBase;
      lines.push(
        <View
          key={`h-${i}`}
          style={[
            styles.line,
            styles.horizontalLine,
            isOuter ? { height: OUTER_LINE_THICKNESS } : undefined,
            { top },
          ]}
        />
      );
    }

    // Vertical lines
    for (let i = 0; i < boardSize; i++) {
      const isOuter = i === 0 || i === boardSize - 1;
      const leftBase = BOARD_PADDING + i * CELL_SIZE;
      const left = isOuter ? leftBase - (OUTER_LINE_THICKNESS - 1) / 2 : leftBase;
      lines.push(
        <View
          key={`v-${i}`}
          style={[
            styles.line,
            styles.verticalLine,
            isOuter ? { width: OUTER_LINE_THICKNESS } : undefined,
            { left },
          ]}
        />
      );
    }

    return lines;
  }, [boardSize, CELL_SIZE]);

  // Create intersection points where stones can be placed (memoized).
  const intersections = React.useMemo(() => {
    const points: React.ReactNode[] = [];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        // All intersections (including outermost rows/cols) are playable.
        const stoneValue = board[row]?.[col] ?? 0;
        const isHighlighted = !!lastMove && lastMove.row === row && lastMove.col === col;
        const isWinningStone = !!winningSet?.has(`${row},${col}`);
        points.push(
          <TouchableOpacity
            key={`point-${row}-${col}`}
              style={[styles.intersection, {
                left: BOARD_PADDING + col * CELL_SIZE,
                top: BOARD_PADDING + row * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                marginLeft: -CELL_SIZE / 2,
                marginTop: -CELL_SIZE / 2,
              }, webNoOutlineStyle]}
            onPress={() => onCellPress(row, col)}
            activeOpacity={1}
          >
            {stoneValue !== 0 && <Stone player={stoneValue} isHighlighted={isHighlighted} isWinningStone={isWinningStone} />}
          </TouchableOpacity>
        );
      }
    }

    return points;
  }, [board, boardSize, CELL_SIZE, lastMove, winningSet, onCellPress, webNoOutlineStyle]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={horizontalScrollRef}
        style={[styles.horizontalScroll, { maxHeight: maxBoardVisibleHeight }]}
        contentContainerStyle={styles.scrollContentCenter}
        horizontal
        showsHorizontalScrollIndicator
        onLayout={handleHorizontalLayout}
      >
        <ScrollView
          ref={verticalScrollRef}
          style={{ maxHeight: maxBoardVisibleHeight }}
          contentContainerStyle={styles.scrollContentCenter}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          onLayout={handleVerticalLayout}
        >
          <View style={[styles.board, { width: boardPixelSize, height: boardPixelSize }]}>
            {gridLines}
            <View
              pointerEvents="none"
              style={[styles.centerDot, { left: BOARD_PADDING + boardCenterOffset, top: BOARD_PADDING + boardCenterOffset }]}
            />
              {intersections}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  horizontalScroll: {
    width: '100%',
  },
  verticalScroll: {},
  scrollContentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    backgroundColor: '#E8B96F', // Wooden board color
    borderRadius: 5,
    padding: BOARD_PADDING,
    position: 'relative',
  },
  line: {
    position: 'absolute',
    backgroundColor: '#000',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D62828',
    marginLeft: -4,
    marginTop: -4,
    zIndex: 4,
  },
  intersection: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    borderWidth: 0,
    borderColor: 'transparent',
  },
});

export default Board;
