import { BOARD_SIZE, checkWin, isValidMove } from './gameLogic';

const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const WIN_SCORE = 100000000;
const BLOCK_WIN_SCORE = 90000000;

const getOffensiveScore = (count: number, openEnds: number): number => {
  if (count >= 5) return WIN_SCORE;
  if (count === 4 && openEnds === 2) return 1000000;
  if (count === 4 && openEnds === 1) return 100000;
  if (count === 3 && openEnds === 2) return 20000;
  if (count === 3 && openEnds === 1) return 2000;
  if (count === 2 && openEnds === 2) return 500;
  if (count === 2 && openEnds === 1) return 100;
  if (count === 1 && openEnds === 2) return 20;
  return 0;
};

const getDefensiveScore = (count: number, openEnds: number): number => {
  if (count >= 5) return WIN_SCORE;
  if (count === 4 && openEnds >= 1) return 800000;
  if (count === 3 && openEnds === 2) return 50000;
  if (count === 3 && openEnds === 1) return 5000;
  if (count === 2 && openEnds === 2) return 1000;
  if (count === 2 && openEnds === 1) return 200;
  return 0;
};

const evaluateLine = (
  board: number[][],
  row: number,
  col: number,
  player: number,
  dx: number,
  dy: number
): { count: number; openEnds: number } => {
  let count = 1;
  let openEnds = 0;

  // Positive direction
  for (let i = 1; i < 5; i++) {
    const newRow = row + i * dx;
    const newCol = col + i * dy;

    if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
      break;
    }

    if (board[newRow][newCol] === player) {
      count++;
    } else if (board[newRow][newCol] === 0) {
      openEnds++;
      break;
    } else {
      break;
    }
  }

  // Negative direction
  for (let i = 1; i < 5; i++) {
    const newRow = row - i * dx;
    const newCol = col - i * dy;

    if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
      break;
    }

    if (board[newRow][newCol] === player) {
      count++;
    } else if (board[newRow][newCol] === 0) {
      openEnds++;
      break;
    } else {
      break;
    }
  }

  return { count, openEnds };
};

const getCandidateMoves = (board: number[][]): { row: number; col: number }[] => {
  const candidates: { row: number; col: number }[] = [];
  const seen = new Set<string>();
  let hasStone = false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== 0) {
        hasStone = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (isValidMove(board, r, c)) {
              const key = `${r},${c}`;
              if (!seen.has(key)) {
                seen.add(key);
                candidates.push({ row: r, col: c });
              }
            }
          }
        }
      }
    }
  }

  if (!hasStone) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [{ row: center, col: center }];
  }

  return candidates;
};

// Evaluate a position for the AI
const evaluatePosition = (board: number[][], row: number, col: number, aiPlayer: number): number => {
  if (!isValidMove(board, row, col)) return -1;
  
  let score = 0;
  const humanPlayer = aiPlayer === 1 ? 2 : 1;
  const aiBoard = board.map(r => [...r]);
  const humanBoard = board.map(r => [...r]);
  aiBoard[row][col] = aiPlayer;
  humanBoard[row][col] = humanPlayer;

  // Immediate win
  if (checkWin(aiBoard, row, col, aiPlayer)) {
    return WIN_SCORE;
  }

  // Immediate block of opponent win
  if (checkWin(humanBoard, row, col, humanPlayer)) {
    score += BLOCK_WIN_SCORE;
  }

  // Check in all directions
  for (const [dx, dy] of directions) {
    const { count: aiCount, openEnds: aiOpenEnds } = evaluateLine(aiBoard, row, col, aiPlayer, dx, dy);
    score += getOffensiveScore(aiCount, aiOpenEnds);

    const { count: humanCount, openEnds: humanOpenEnds } = evaluateLine(humanBoard, row, col, humanPlayer, dx, dy);
    score += getDefensiveScore(humanCount, humanOpenEnds);
  }

  // Add a tiny randomness for variety without making moves feel random
  score += Math.floor(Math.random() * 3);
  
  // Prefer center positions
  const centerDistance = Math.abs(row - BOARD_SIZE / 2) + Math.abs(col - BOARD_SIZE / 2);
  score += (BOARD_SIZE - centerDistance) * 2;
  
  return score;
};

export type AIDifficulty = 'intermediate' | 'expert';

export const findBestMove = (
  board: number[][],
  aiPlayer: number,
  difficulty: AIDifficulty = 'intermediate',
): { row: number; col: number } => {
  const candidates = getCandidateMoves(board);
  const humanPlayer = aiPlayer === 1 ? 2 : 1;

  if (difficulty === 'intermediate') {
    let bestScore = -1;
    let bestMove = candidates[0] ?? { row: 0, col: 0 };

    for (const { row, col } of candidates) {
      const score = evaluatePosition(board, row, col, aiPlayer);
      if (score > bestScore) {
        bestScore = score;
        bestMove = { row, col };
      }
    }

    return bestMove;
  }

  let bestMove = candidates[0] ?? { row: 0, col: 0 };
  let bestValue = -Infinity;

  for (const { row, col } of candidates) {
    const aiScore = evaluatePosition(board, row, col, aiPlayer);

    const boardAfterAIMove = board.map(r => [...r]);
    boardAfterAIMove[row][col] = aiPlayer;

    const replyCandidates = getCandidateMoves(boardAfterAIMove);
    let worstForAI = -Infinity;

    for (const reply of replyCandidates) {
      const replyScore = evaluatePosition(boardAfterAIMove, reply.row, reply.col, humanPlayer);
      if (replyScore > worstForAI) {
        worstForAI = replyScore;
      }
    }

    const value = aiScore - worstForAI;

    if (value > bestValue) {
      bestValue = value;
      bestMove = { row, col };
    }
  }

  return bestMove;
};
