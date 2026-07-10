// Game board size (phone default)
export const BOARD_SIZE = 15;
// Larger board for tablets
export const TABLET_BOARD_PORTRAIT_SIZE = 23;
export const TABLET_BOARD_LANDSCAPE_SIZE = 23;

const TABLET_BREAKPOINT = 600;

/** Board dimension for the current device layout (does not account for in-game rotation). */
export const resolveBoardSize = (isTablet: boolean, isLandscape: boolean): number => {
  if (!isTablet) return BOARD_SIZE;
  return isLandscape ? TABLET_BOARD_LANDSCAPE_SIZE : TABLET_BOARD_PORTRAIT_SIZE;
};

/** Board dimension from window size — use once at game start / restart, not on every rotation. */
export const resolveBoardSizeFromWindow = (width: number, height: number): number => {
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;
  return resolveBoardSize(isTablet, width > height);
};

// Initialize an empty board
export const initializeBoard = (size: number = BOARD_SIZE): number[][] => {
  return Array(size).fill(0).map(() => Array(size).fill(0));
};

// Check if the move is valid (cell is empty and within board bounds)
export const isValidMove = (board: number[][], row: number, col: number): boolean => {
  const size = board.length;
  if (row < 0 || row >= size || col < 0 || col >= size) return false;
  return board[row][col] === 0;
};

// Check for a win (5 in a row)
export const checkWin = (board: number[][], row: number, col: number, player: number): boolean => {
  return getWinningCells(board, row, col, player) !== null;
};

// Return the coordinates of the 5 (or more) stones forming the winning line, or null if no win.
export const getWinningCells = (
  board: number[][],
  row: number,
  col: number,
  player: number,
): { row: number; col: number }[] | null => {
  const directions = [
    [1, 0],   // horizontal
    [0, 1],   // vertical
    [1, 1],   // diagonal \
    [1, -1],  // diagonal /
  ];

  for (const [dx, dy] of directions) {
    const cells: { row: number; col: number }[] = [{ row, col }];
    const size = board.length;

    for (let i = 1; i < 5; i++) {
      const r = row + i * dx;
      const c = col + i * dy;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        cells.push({ row: r, col: c });
      } else break;
    }

    for (let i = 1; i < 5; i++) {
      const r = row - i * dx;
      const c = col - i * dy;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        cells.push({ row: r, col: c });
      } else break;
    }

    if (cells.length === 5) return cells;
  }

  return null;
};

// Check if the board is full (draw)
export const isBoardFull = (board: number[][]): boolean => {
  // Check entire board (all cells playable)
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        return false;
      }
    }
  }
  return true;
};
