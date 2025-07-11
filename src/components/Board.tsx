import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Stone from './Stone';

interface BoardProps {
  board: number[][];
  onCellPress: (row: number, col: number) => void;
}

const CELL_SIZE = 30;
const BOARD_SIZE = 15;
const BOARD_PADDING = 15;
const STONE_SIZE = 24; // Match the stone size

const Board: React.FC<BoardProps> = ({ board, onCellPress }) => {
  // Create grid lines
  const renderGridLines = () => {
    const lines = [];
    
    // Horizontal lines
    for (let i = 0; i < BOARD_SIZE; i++) {
      lines.push(
        <View 
          key={`h-${i}`} 
          style={[styles.line, styles.horizontalLine, { top: i * CELL_SIZE }]} 
        />
      );
    }
    
    // Vertical lines
    for (let i = 0; i < BOARD_SIZE; i++) {
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
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const stoneValue = board[row][col];
        points.push(
          <TouchableOpacity
            key={`point-${row}-${col}`}
            style={[styles.intersection, { 
              left: col * CELL_SIZE, 
              top: row * CELL_SIZE 
            }]}
            onPress={() => onCellPress(row, col)}
            activeOpacity={0.7}
          >
            {stoneValue !== 0 && <Stone player={stoneValue} />}
          </TouchableOpacity>
        );
      }
    }
    
    return points;
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {renderGridLines()}
        {renderIntersections()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  board: {
    width: CELL_SIZE * (BOARD_SIZE - 1) + BOARD_PADDING * 2,
    height: CELL_SIZE * (BOARD_SIZE - 1) + BOARD_PADDING * 2,
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
  intersection: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    // Offset to center the touch area on the intersection
    marginLeft: -CELL_SIZE/2,
    marginTop: -CELL_SIZE/2,
  },
});

export default Board;
