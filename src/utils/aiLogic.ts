import { BOARD_SIZE, checkWin, isValidMove } from './gameLogic';

// Directions for checking (horizontal, vertical, diagonal)
const directions = [
  [1, 0],   // horizontal
  [0, 1],   // vertical
  [1, 1],   // diagonal \
  [1, -1],  // diagonal /
];

// Evaluate a position for the AI
const evaluatePosition = (board: number[][], row: number, col: number, aiPlayer: number): number => {
  if (!isValidMove(board, row, col)) return -1;
  
  let score = 0;
  const humanPlayer = aiPlayer === 1 ? 2 : 1;
  
  // Check in all directions
  for (const [dx, dy] of directions) {
    // Count AI's stones in a row
    let aiCount = 0;
    let humanCount = 0;
    let openEnds = 0;
    
    // Check in positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
        break;
      }
      
      if (board[newRow][newCol] === aiPlayer) {
        aiCount++;
      } else if (board[newRow][newCol] === humanPlayer) {
        humanCount++;
        break;
      } else {
        openEnds++;
        break;
      }
    }
    
    // Check in negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
        break;
      }
      
      if (board[newRow][newCol] === aiPlayer) {
        aiCount++;
      } else if (board[newRow][newCol] === humanPlayer) {
        humanCount++;
        break;
      } else {
        openEnds++;
        break;
      }
    }
    
    // Calculate score based on consecutive stones and open ends
    if (aiCount >= 4) {
      score += 10000; // Winning move
    } else if (aiCount === 3 && openEnds === 2) {
      score += 5000;  // Open four (very strong)
    } else if (aiCount === 3 && openEnds === 1) {
      score += 1000;  // Four
    } else if (aiCount === 2 && openEnds === 2) {
      score += 500;   // Open three
    } else if (aiCount === 2 && openEnds === 1) {
      score += 100;   // Three
    } else if (aiCount === 1 && openEnds === 2) {
      score += 50;    // Open two
    }
    
    // Defensive scoring - block opponent's potential wins
    if (humanCount >= 3 && openEnds >= 1) {
      score += 2000;  // Block opponent's potential win
    }
  }
  
  // Add some randomness for variety
  score += Math.floor(Math.random() * 10);
  
  // Prefer center positions
  const centerDistance = Math.abs(row - BOARD_SIZE / 2) + Math.abs(col - BOARD_SIZE / 2);
  score += (BOARD_SIZE - centerDistance) * 2;
  
  return score;
};

// Find the best move for the AI
export const findBestMove = (board: number[][], aiPlayer: number): { row: number; col: number } => {
  let bestScore = -1;
  let bestMove = { row: -1, col: -1 };
  
  // If board is empty, play near the center
  if (board.flat().every(cell => cell === 0)) {
    const center = Math.floor(BOARD_SIZE / 2);
    return { row: center, col: center };
  }
  
  // Evaluate all possible moves
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, row, col)) {
        const score = evaluatePosition(board, row, col, aiPlayer);
        if (score > bestScore) {
          bestScore = score;
          bestMove = { row, col };
        }
      }
    }
  }
  
  return bestMove;
};
