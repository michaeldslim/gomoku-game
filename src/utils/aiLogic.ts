import { BOARD_SIZE, checkWin, isValidMove } from './gameLogic';

const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const WIN_SCORE = 100000000;
const BLOCK_WIN_SCORE = 90000000;

// keeping it in 1 (hardest) - 5 (easier) range for balance
const INTERMEDIATE_TOP_POOL_SIZE = 4;

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

// Count cells where a player can win in one move (used for fork detection)
const countWinThreats = (board: number[][], player: number): number => {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!isValidMove(board, r, c)) continue;
      const test = board.map(row => [...row]);
      test[r][c] = player;
      if (checkWin(test, r, c, player)) count++;
    }
  }
  return count;
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

// Expert-level move evaluator with priority tiers and fork detection
const evaluateExpertMove = (
  board: number[][],
  row: number,
  col: number,
  aiPlayer: number,
  humanPlayer: number,
): number => {
  if (!isValidMove(board, row, col)) return -1;

  const aiBoard = board.map(r => [...r]);
  aiBoard[row][col] = aiPlayer;

  const humanBoard = board.map(r => [...r]);
  humanBoard[row][col] = humanPlayer;

  // Tier 1: Win immediately
  if (checkWin(aiBoard, row, col, aiPlayer)) return WIN_SCORE;

  // Tier 2: Block opponent's immediate win
  if (checkWin(humanBoard, row, col, humanPlayer)) return BLOCK_WIN_SCORE;

  // Tier 3: Create a fork — AI gains 2+ simultaneous winning threats (opponent can't block both)
  const aiThreatsAfter = countWinThreats(aiBoard, aiPlayer);
  if (aiThreatsAfter >= 2) return 50_000_000;

  // Tier 4: Block opponent fork — if human places here they'd have 2+ winning threats
  const humanThreatsHere = countWinThreats(humanBoard, humanPlayer);
  if (humanThreatsHere >= 2) return 40_000_000;

  // Tier 5+: Score by pattern strength (attack + defense)
  let score = 0;
  for (const [dx, dy] of directions) {
    const { count: aiCount, openEnds: aiOpenEnds } = evaluateLine(aiBoard, row, col, aiPlayer, dx, dy);
    score += getOffensiveScore(aiCount, aiOpenEnds);

    const { count: humanCount, openEnds: humanOpenEnds } = evaluateLine(humanBoard, row, col, humanPlayer, dx, dy);
    score += getDefensiveScore(humanCount, humanOpenEnds);
  }

  score += Math.floor(Math.random() * 3);
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
    const scoredMoves = candidates
      .map(({ row, col }) => ({ row, col, score: evaluatePosition(board, row, col, aiPlayer) }))
      .sort((a, b) => b.score - a.score);

    if (scoredMoves[0] && scoredMoves[0].score >= BLOCK_WIN_SCORE) {
      return { row: scoredMoves[0].row, col: scoredMoves[0].col };
    }

    const topPool = scoredMoves.slice(0, Math.min(INTERMEDIATE_TOP_POOL_SIZE, scoredMoves.length));
    const pick = topPool[Math.floor(Math.random() * topPool.length)] ?? { row: 0, col: 0 };
    return { row: pick.row, col: pick.col };
  }

  // Expert mode: priority-tiered scoring with fork detection
  let bestScore = -Infinity;
  let bestMove = candidates[0] ?? { row: 0, col: 0 };

  for (const { row, col } of candidates) {
    const score = evaluateExpertMove(board, row, col, aiPlayer, humanPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = { row, col };
    }
  }

  return bestMove;
};
