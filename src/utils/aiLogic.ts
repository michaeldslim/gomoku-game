import { checkWin, isValidMove } from './gameLogic';

const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const WIN_SCORE = 100000000;
const BLOCK_WIN_SCORE = 90000000;
const FORK_CREATE_SCORE = 50_000_000;
const FORK_BLOCK_SCORE = 40_000_000;
// Matches getDefensiveScore(4, openEnds >= 1) — open-four blocks must not lose to top-pool randomness.
const URGENT_DEFENSE_SCORE = 800000;
const MINIMAX_TOP_N = 8;
const MINIMAX_HUMAN_RESPONSES = 3;

// keeping it in 1 (hardest) - 5 (easier) range for balance
const INTERMEDIATE_TOP_POOL_SIZE = 4;
// Relaxed pick pools for the easiest intermediate settings (wider = weaker).
const INTERMEDIATE_RELAXED_POOL_4 = 7;
const INTERMEDIATE_RELAXED_POOL_5 = 10;

// Expert sub-level pool sizes: 1 (hardest), 2 (medium), 3 (easiest)
const EXPERT_TOP_POOL_EASY = 3; // default
const EXPERT_TOP_POOL_MEDIUM = 2;
const EXPERT_TOP_POOL_HARD = 1;
// Easy expert uses a wider random pool than the stored setting value.
const EXPERT_EASY_EFFECTIVE_POOL = 6;

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
  const size = board.length;
  let count = 1;
  let openEnds = 0;

  // Positive direction
  for (let i = 1; i < 5; i++) {
    const newRow = row + i * dx;
    const newCol = col + i * dy;

    if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
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

    if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
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
  const size = board.length;
  const candidates: { row: number; col: number }[] = [];
  const seen = new Set<string>();
  let hasStone = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
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
    const center = Math.floor(size / 2);
    return [{ row: center, col: center }];
  }

  return candidates;
};

// Count cells where a player can win in one move (used for fork detection).
// Scans only candidate cells near existing stones — sufficient for threats and much
// faster on 23×23 than a full-board pass.
const countWinThreats = (
  board: number[][],
  player: number,
  cells?: { row: number; col: number }[],
): number => {
  const toCheck = cells ?? getCandidateMoves(board);
  let count = 0;
  for (const { row: r, col: c } of toCheck) {
    if (board[r][c] !== 0) continue;
    board[r][c] = player;
    if (checkWin(board, r, c, player)) count++;
    board[r][c] = 0;
  }
  return count;
};

const countStones = (board: number[][]): number => {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== 0) count++;
    }
  }
  return count;
};

const applyMove = (board: number[][], row: number, col: number, player: number): number[][] => {
  const next = board.map((r) => [...r]);
  next[row][col] = player;
  return next;
};

const evaluateOpeningMove = (
  board: number[][],
  row: number,
  col: number,
  aiPlayer: number,
  center: number,
): number => {
  if (!isValidMove(board, row, col)) return -1;

  const size = board.length;
  let score = (size - (Math.abs(row - center) + Math.abs(col - center))) * 4;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] !== 0) {
        score += board[r][c] === aiPlayer ? 30 : 20;
      }
    }
  }

  return score;
};

const getOpeningBookMove = (
  board: number[][],
  aiPlayer: number,
): { row: number; col: number } | null => {
  const stoneCount = countStones(board);
  if (stoneCount >= 3) return null;

  const size = board.length;
  const center = Math.floor(size / 2);

  if (stoneCount === 0) {
    return { row: center, col: center };
  }

  const findFirstStone = (): { row: number; col: number } | null => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] !== 0) return { row: r, col: c };
      }
    }
    return null;
  };

  const uniqueValidMoves = (moves: { row: number; col: number }[]) => {
    const seen = new Set<string>();
    return moves.filter(({ row, col }) => {
      if (!isValidMove(board, row, col)) return false;
      const key = `${row},${col}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  if (stoneCount === 1) {
    const lone = findFirstStone();
    if (!lone) return null;

    const towardCenter = () => {
      const dr = lone.row === center ? 0 : lone.row < center ? 1 : -1;
      const dc = lone.col === center ? 0 : lone.col < center ? 1 : -1;
      return { row: lone.row + dr, col: lone.col + dc };
    };

    const adjacent = uniqueValidMoves([
      towardCenter(),
      { row: lone.row + 1, col: lone.col },
      { row: lone.row - 1, col: lone.col },
      { row: lone.row, col: lone.col + 1 },
      { row: lone.row, col: lone.col - 1 },
      { row: lone.row + 1, col: lone.col + 1 },
      { row: lone.row + 1, col: lone.col - 1 },
      { row: lone.row - 1, col: lone.col + 1 },
      { row: lone.row - 1, col: lone.col - 1 },
    ]);
    if (adjacent.length === 0) return null;

    adjacent.sort((a, b) => {
      const distA = Math.abs(a.row - center) + Math.abs(a.col - center);
      const distB = Math.abs(b.row - center) + Math.abs(b.col - center);
      return distA - distB;
    });
    return adjacent[0];
  }

  const candidates = getCandidateMoves(board);
  const scored = candidates
    .map(({ row, col }) => ({
      row,
      col,
      score: evaluateOpeningMove(board, row, col, aiPlayer, center),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0] ? { row: scored[0].row, col: scored[0].col } : null;
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
  const size = board.length;
  const centerDistance = Math.abs(row - size / 2) + Math.abs(col - size / 2);
  score += (size - centerDistance) * 2;
  
  return score;
};

// Expert-level move evaluator with priority tiers and fork detection
const evaluateExpertMove = (
  board: number[][],
  row: number,
  col: number,
  aiPlayer: number,
  humanPlayer: number,
  threatCells?: { row: number; col: number }[],
): number => {
  if (!isValidMove(board, row, col)) return -1;

  const aiBoard = board.map(r => [...r]);
  aiBoard[row][col] = aiPlayer;

  const humanBoard = board.map(r => [...r]);
  humanBoard[row][col] = humanPlayer;

  const cells = threatCells ?? getCandidateMoves(board);

  // Tier 1: Win immediately
  if (checkWin(aiBoard, row, col, aiPlayer)) return WIN_SCORE;

  // Tier 2: Block opponent's immediate win
  if (checkWin(humanBoard, row, col, humanPlayer)) return BLOCK_WIN_SCORE;

  // Tier 3: Create a fork — AI gains 2+ simultaneous winning threats (opponent can't block both)
  const aiThreatsAfter = countWinThreats(aiBoard, aiPlayer, cells);
  if (aiThreatsAfter >= 2) return FORK_CREATE_SCORE;

  // Tier 4: Block opponent fork — if human places here they'd have 2+ winning threats
  const humanThreatsHere = countWinThreats(humanBoard, humanPlayer, cells);
  if (humanThreatsHere >= 2) return FORK_BLOCK_SCORE;

  // Tier 5+: Score by pattern strength (attack + defense)
  let score = 0;
  for (const [dx, dy] of directions) {
    const { count: aiCount, openEnds: aiOpenEnds } = evaluateLine(aiBoard, row, col, aiPlayer, dx, dy);
    score += getOffensiveScore(aiCount, aiOpenEnds);

    const { count: humanCount, openEnds: humanOpenEnds } = evaluateLine(humanBoard, row, col, humanPlayer, dx, dy);
    score += getDefensiveScore(humanCount, humanOpenEnds);
  }

  const expertSize = board.length;
  const centerDistance = Math.abs(row - expertSize / 2) + Math.abs(col - expertSize / 2);
  score += (expertSize - centerDistance) * 2;

  return score;
};

const evaluateBoardStatic = (
  board: number[][],
  aiPlayer: number,
  humanPlayer: number,
  threatCells: { row: number; col: number }[],
): number => {
  let bestAi = 0;
  let bestHuman = 0;
  for (const { row, col } of threatCells) {
    if (!isValidMove(board, row, col)) continue;
    const aiScore = evaluateExpertMove(board, row, col, aiPlayer, humanPlayer, threatCells);
    const humanScore = evaluateExpertMove(board, row, col, humanPlayer, aiPlayer, threatCells);
    if (aiScore > bestAi) bestAi = aiScore;
    if (humanScore > bestHuman) bestHuman = humanScore;
  }
  return bestAi - bestHuman;
};

const pickMinimaxDepth2 = (
  board: number[][],
  aiPlayer: number,
  humanPlayer: number,
  scoredMoves: { row: number; col: number; score: number }[],
  threatCells: { row: number; col: number }[],
): { row: number; col: number } => {
  const top = scoredMoves.slice(0, Math.min(MINIMAX_TOP_N, scoredMoves.length));
  let bestMove = top[0];
  let bestValue = -Infinity;

  for (const aiMove of top) {
    const afterAi = applyMove(board, aiMove.row, aiMove.col, aiPlayer);
    if (checkWin(afterAi, aiMove.row, aiMove.col, aiPlayer)) {
      return { row: aiMove.row, col: aiMove.col };
    }

    const humanCandidates = getCandidateMoves(afterAi);
    let worstForAi = Infinity;

    if (humanCandidates.length === 0) {
      worstForAi = evaluateBoardStatic(afterAi, aiPlayer, humanPlayer, threatCells);
    } else {
      const humanScored = humanCandidates
        .map(({ row, col }) => ({
          row,
          col,
          score: evaluateExpertMove(afterAi, row, col, humanPlayer, aiPlayer, humanCandidates),
        }))
        .sort((a, b) => b.score - a.score);

      const humanTop = humanScored.slice(0, Math.min(MINIMAX_HUMAN_RESPONSES, humanScored.length));
      for (const humanMove of humanTop) {
        const afterHuman = applyMove(afterAi, humanMove.row, humanMove.col, humanPlayer);
        if (checkWin(afterHuman, humanMove.row, humanMove.col, humanPlayer)) {
          worstForAi = Math.min(worstForAi, -BLOCK_WIN_SCORE);
          continue;
        }
        const val = evaluateBoardStatic(
          afterHuman,
          aiPlayer,
          humanPlayer,
          getCandidateMoves(afterHuman),
        );
        worstForAi = Math.min(worstForAi, val);
      }
    }

    if (worstForAi > bestValue) {
      bestValue = worstForAi;
      bestMove = aiMove;
    }
  }

  return { row: bestMove.row, col: bestMove.col };
};

export type AIDifficulty = 'intermediate' | 'expert';
export { EXPERT_TOP_POOL_EASY, EXPERT_TOP_POOL_MEDIUM, EXPERT_TOP_POOL_HARD };

const normalizeIntermediatePoolSize = (value: number): number => {
  if (!Number.isFinite(value)) return INTERMEDIATE_TOP_POOL_SIZE;
  return Math.min(5, Math.max(1, Math.floor(value)));
};

const normalizeExpertTopK = (value: number): number => {
  if (!Number.isFinite(value)) return EXPERT_TOP_POOL_EASY;
  return Math.min(EXPERT_TOP_POOL_EASY, Math.max(EXPERT_TOP_POOL_HARD, Math.floor(value)));
};

const resolveIntermediatePickCount = (poolSize: number, moveCount: number): number => {
  if (poolSize === 4) return Math.min(moveCount, INTERMEDIATE_RELAXED_POOL_4);
  if (poolSize === 5) return Math.min(moveCount, INTERMEDIATE_RELAXED_POOL_5);
  return Math.min(moveCount, poolSize);
};

const resolveExpertPickCount = (topK: number, moveCount: number): number => {
  if (topK === EXPERT_TOP_POOL_EASY) {
    return Math.min(moveCount, EXPERT_EASY_EFFECTIVE_POOL);
  }
  return Math.min(moveCount, topK);
};

const pickRandomMove = <T extends { row: number; col: number }>(moves: T[]): T => {
  return moves[Math.floor(Math.random() * moves.length)] ?? moves[0];
};

interface FindBestMoveOptions {
  expertTopK?: number;
  intermediateTopPoolSize?: number;
}

export function findBestMove(
  board: number[][],
  aiPlayer: number,
  difficulty: AIDifficulty = 'intermediate',
  optionsOrExpertTopK: FindBestMoveOptions | number = {},
  intermediateTopPoolSizeArg?: number,
): { row: number; col: number } {
  const candidates = getCandidateMoves(board);
  const humanPlayer = aiPlayer === 1 ? 2 : 1;
  const options: FindBestMoveOptions =
    typeof optionsOrExpertTopK === 'number'
      ? { expertTopK: optionsOrExpertTopK, intermediateTopPoolSize: intermediateTopPoolSizeArg }
      : (optionsOrExpertTopK ?? {});
  const resolvedIntermediateTopPoolSize = normalizeIntermediatePoolSize(
    options.intermediateTopPoolSize ?? INTERMEDIATE_TOP_POOL_SIZE
  );
  const resolvedExpertTopK = normalizeExpertTopK(options.expertTopK ?? EXPERT_TOP_POOL_EASY);

  const openingMove = getOpeningBookMove(board, aiPlayer);
  if (openingMove) {
    return openingMove;
  }

  if (difficulty === 'intermediate') {
    const scoredMoves = candidates
      .map(({ row, col }) => ({ row, col, score: evaluatePosition(board, row, col, aiPlayer) }))
      .sort((a, b) => b.score - a.score);

    const criticalMoves = scoredMoves.filter((move) => move.score >= BLOCK_WIN_SCORE);
    if (criticalMoves.length > 0) {
      return { row: criticalMoves[0].row, col: criticalMoves[0].col };
    }

    const urgentDefense = scoredMoves.filter((move) => move.score >= URGENT_DEFENSE_SCORE);
    if (urgentDefense.length > 0) {
      return { row: urgentDefense[0].row, col: urgentDefense[0].col };
    }

    const pickCount = resolveIntermediatePickCount(resolvedIntermediateTopPoolSize, scoredMoves.length);
    const topPool = scoredMoves.slice(0, pickCount);
    const pick = pickRandomMove(topPool);
    return { row: pick.row, col: pick.col };
  }

  // Expert mode: priority-tiered scoring with fork detection
  const threatCells = candidates;
  const expertScored = candidates
    .map(({ row, col }) => ({
      row,
      col,
      score: evaluateExpertMove(board, row, col, aiPlayer, humanPlayer, threatCells),
    }))
    .sort((a, b) => b.score - a.score);

  const best = expertScored[0];
  if (!best) {
    return { row: 0, col: 0 };
  }

  // Win / immediate block — always forced at every expert sub-level.
  if (best.score >= BLOCK_WIN_SCORE) {
    return { row: best.row, col: best.col };
  }

  // Fork tiers: forced for medium/hard; easy falls through to a wider random pool.
  if (best.score >= FORK_BLOCK_SCORE && resolvedExpertTopK !== EXPERT_TOP_POOL_EASY) {
    return { row: best.row, col: best.col };
  }

  if (resolvedExpertTopK === EXPERT_TOP_POOL_HARD) {
    return pickMinimaxDepth2(board, aiPlayer, humanPlayer, expertScored, threatCells);
  }

  const pickCount = resolveExpertPickCount(resolvedExpertTopK, expertScored.length);
  const topK = expertScored.slice(0, pickCount);
  const pick = pickRandomMove(topK);
  return { row: pick.row, col: pick.col };
}
