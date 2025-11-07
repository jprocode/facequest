// frontend/games/tictactoe.js
// Pure Tic-Tac-Toe engine (no UI / no network deps)

const LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6],         // diagonals
];

export function createGame(seed = null) {
  return {
    board: Array(9).fill(null), // null | 'X' | 'Y'
    turn: 'X',                   // 'X' starts
    status: 'playing',           // 'playing' | 'win' | 'draw'
    winner: null,                // 'X' | 'Y' | null
    line: null,                  // winning line indices or null
    moves: 0,
    seed,                        // optional deterministic room seed
  };
}

export function clone(state) {
  return {
    board: state.board.slice(),
    turn: state.turn,
    status: state.status,
    winner: state.winner,
    line: state.line ? state.line.slice() : null,
    moves: state.moves,
    seed: state.seed ?? null,
  };
}

export function nextTurn(turn) {
  return turn === 'X' ? 'Y' : 'X';
}

export function isValidMove(state, idx, asPlayer) {
  if (state.status !== 'playing') return false;
  if (idx < 0 || idx > 8) return false;
  if (state.board[idx] !== null) return false;
  if (asPlayer && asPlayer !== state.turn) return false;
  return true;
}

export function checkWinner(board) {
  for (const [a,b,c] of LINES) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, line: [a,b,c] };
    }
  }
  return null;
}

export function applyMove(state, idx, asPlayer = null) {
  if (!isValidMove(state, idx, asPlayer)) return state;

  const s = clone(state);
  s.board[idx] = s.turn;
  s.moves += 1;

  const win = checkWinner(s.board);
  if (win) {
    s.status = 'win';
    s.winner = win.winner;
    s.line = win.line;
    return s;
  }

  if (s.moves >= 9) {
    s.status = 'draw';
    return s;
  }

  s.turn = nextTurn(s.turn);
  return s;
}

export function resetGame(prev, seed = null) {
  const s = createGame(seed ?? prev?.seed ?? null);
  return s;
}

// Compact wire format for RTC messages
export function serialize(state) {
  return {
    b: state.board, // array of 9 ('X'|'Y'|null)
    t: state.turn,
    s: state.status,
    w: state.winner,
    l: state.line,
    m: state.moves,
    d: state.seed ?? null,
  };
}

export function deserialize(payload) {
  return {
    board: (payload?.b ?? Array(9).fill(null)).slice(0, 9),
    turn: payload?.t ?? 'X',
    status: payload?.s ?? 'playing',
    winner: payload?.w ?? null,
    line: payload?.l ?? null,
    moves: payload?.m ?? 0,
    seed: payload?.d ?? null,
  };
}

// Simple reducer helpers for UI
export function reduce(state, action) {
  switch (action?.type) {
    case 'reset':
      return resetGame(state, action?.seed ?? null);
    case 'move':
      return applyMove(state, action.idx, action.asPlayer ?? null);
    case 'sync':
      // authoritative replace from network
      return deserialize(action.payload);
    default:
      return state || createGame();
  }
}