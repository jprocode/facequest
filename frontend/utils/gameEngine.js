// frontend/utils/gameEngine.js

// ---------- Tic-Tac-Toe ----------
export function tttInitialState(seed = Date.now()) {
  return {
    kind: 'ttt',
    board: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    mapping: { host: 'X', guest: 'O' },
    turn: 'host',         // 'host' | 'guest'
    winner: null,         // 'host' | 'guest' | 'draw' | null
    seed,
  };
}

export function tttApplyMove(state, role, at) {
  // role: 'host'|'guest'
  // at: { r, c }
  if (state.winner) return state;
  if (state.turn !== role) return state;
  const { r, c } = at || {};
  if (r == null || c == null) return state;
  if (state.board[r][c]) return state; // occupied

  const next = structuredClone(state);
  next.board[r][c] = state.mapping[role];
  const res = tttCheckWin(next.board, next.mapping);
  if (res === 'X')       next.winner = 'host';
  else if (res === 'O')  next.winner = 'guest';
  else if (res === 'draw') next.winner = 'draw';
  else                    next.turn = role === 'host' ? 'guest' : 'host';
  return next;
}

export function tttCheckWin(board, mapping) {
  const lines = [
    // rows
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
    // cols
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    // diags
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]],
  ];
  for (const L of lines) {
    if (L[0] && L[0] === L[1] && L[1] === L[2]) return L[0]; // 'X' or 'O'
  }
  const full = board.every(row => row.every(c => c));
  if (full) return 'draw';
  return null;
}