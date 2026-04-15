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
}

const CELL_SIZE = 30;
const BOARD_PADDING = 15;
const STONE_SIZE = 24; // Match the stone size

const Board: React.FC<BoardProps> = ({ board, onCellPress, lastMove, winningCells, centerTrigger = 0 }) => {
  const { height: screenHeight } = useWindowDimensions();
  const horizontalScrollRef = useRef<ScrollView | null>(null);
  const verticalScrollRef = useRef<ScrollView | null>(null);
  const hasAutoCenteredRef = useRef(false);
  const [horizontalViewportWidth, setHorizontalViewportWidth] = useState(0);
  const [verticalViewportHeight, setVerticalViewportHeight] = useState(0);
  // Reserve space for UI above the board (status bar, controls, etc.)
  const maxBoardVisibleHeight = screenHeight * 0.55;
  const webNoOutlineStyle = Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
    : null;
  const boardSize = board.length > 0 ? board.length : BOARD_SIZE;
  const boardPixelSize = CELL_SIZE * (boardSize - 1) + BOARD_PADDING * 2;
  const centerLineIndex = Math.floor(boardSize / 2);
  const boardCenterOffset = centerLineIndex * CELL_SIZE;

  const centerBoard = useCallback(
    (animated: boolean) => {
      if (!horizontalViewportWidth || !verticalViewportHeight) return;

      const targetX = Math.max(0, (boardPixelSize - horizontalViewportWidth) / 2);
      const targetY = Math.max(0, (boardPixelSize - verticalViewportHeight) / 2);

      horizontalScrollRef.current?.scrollTo({ x: targetX, y: 0, animated });
      verticalScrollRef.current?.scrollTo({ x: 0, y: targetY, animated });
    },
    [boardPixelSize, horizontalViewportWidth, verticalViewportHeight]
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

  // Create grid lines
  const renderGridLines = () => {
    const lines = [];
    
    // Horizontal lines
    for (let i = 0; i < boardSize; i++) {
      lines.push(
        <View 
          key={`h-${i}`} 
          style={[styles.line, styles.horizontalLine, { top: i * CELL_SIZE }]} 
        />
      );
    }
    
    // Vertical lines
    for (let i = 0; i < boardSize; i++) {
      lines.push(
        <View 
          key={`v-${i}`} 
          style={[styles.line, styles.verticalLine, { left: i * CELL_SIZE }]} 
        />
      );
    }
    
    return lines;
  };

  // Create intersection points where stones can be placed
  const renderIntersections = () => {
    const points = [];
    
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const stoneValue = board[row]?.[col] ?? 0;
        const isHighlighted = !!lastMove && lastMove.row === row && lastMove.col === col;
        const isWinningStone = !!winningSet?.has(`${row},${col}`);
        points.push(
          <TouchableOpacity
            key={`point-${row}-${col}`}
            style={[styles.intersection, { 
              left: col * CELL_SIZE, 
              top: row * CELL_SIZE 
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
  };

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
            {renderGridLines()}
            <View
              pointerEvents="none"
              style={[styles.centerDot, { left: boardCenterOffset, top: boardCenterOffset }]}
            />
            {renderIntersections()}
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
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    borderWidth: 0,
    borderColor: 'transparent',
    // Offset to center the touch area on the intersection
    marginLeft: -CELL_SIZE/2,
    marginTop: -CELL_SIZE/2,
  },
});

export default Board;
