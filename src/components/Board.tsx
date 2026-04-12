import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, useWindowDimensions } from 'react-native';
import Stone from './Stone';
import { BOARD_SIZE } from '../utils/gameLogic';

interface BoardProps {
  board: number[][];
  onCellPress: (row: number, col: number) => void;
  lastMove?: { row: number; col: number } | null;
}

const CELL_SIZE = 30;
const BOARD_PADDING = 15;
const STONE_SIZE = 24; // Match the stone size

const Board: React.FC<BoardProps> = ({ board, onCellPress, lastMove }) => {
  const { height: screenHeight } = useWindowDimensions();
  // Reserve space for UI above the board (status bar, controls, etc.)
  const maxBoardVisibleHeight = screenHeight * 0.55;
  const webNoOutlineStyle = Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
    : null;
  const boardSize = board.length > 0 ? board.length : BOARD_SIZE;
  const boardPixelSize = CELL_SIZE * (boardSize - 1) + BOARD_PADDING * 2;
  const centerLineIndex = Math.floor(boardSize / 2);
  const boardCenterOffset = centerLineIndex * CELL_SIZE;

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
            {stoneValue !== 0 && <Stone player={stoneValue} isHighlighted={isHighlighted} />}
          </TouchableOpacity>
        );
      }
    }
    
    return points;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.horizontalScroll, { maxHeight: maxBoardVisibleHeight }]}
        contentContainerStyle={styles.scrollContentCenter}
        horizontal
        showsHorizontalScrollIndicator
      >
        <ScrollView
          style={{ maxHeight: maxBoardVisibleHeight }}
          contentContainerStyle={styles.scrollContentCenter}
          showsVerticalScrollIndicator
          nestedScrollEnabled
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
