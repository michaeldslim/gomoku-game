// Game board size
export const BOARD_SIZE = 16;

// Initialize an empty board
export const initializeBoard = (): number[][] => {
  return Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
};

// Check if the move is valid (cell is empty)
export const isValidMove = (board: number[][], row: number, col: number): boolean => {
  return (
    row > 0 &&
    row < BOARD_SIZE &&
    col > 0 &&
    col < BOARD_SIZE &&
    board[row][col] === 0
  );
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

    for (let i = 1; i < 5; i++) {
      const r = row + i * dx;
      const c = col + i * dy;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        cells.push({ row: r, col: c });
      } else break;
    }

    for (let i = 1; i < 5; i++) {
      const r = row - i * dx;
      const c = col - i * dy;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        cells.push({ row: r, col: c });
      } else break;
    }

    if (cells.length === 5) return cells;
  }

  return null;
};

// Check if the board is full (draw)
export const isBoardFull = (board: number[][]): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 0) {
        return false;
      }
    }
  }
  return true;
};
