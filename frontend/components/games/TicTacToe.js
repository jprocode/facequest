// frontend/components/games/TicTacToe.js
import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function winnerOf(board){
  for (const [a,b,c] of LINES){
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return 'T'; // tie
  return null;
}

/**
 * Props:
 * - role: 'host' | 'guest'
 * - onSend: (type, payload) => void  // parent wraps useRTC().sendDraw(type, payload)
 * - onVictory: (key) => void         // triggers fireworks overlay
 * - onClose: () => void
 *
 * Parent must forward DataChannel messages here via pushMessage(msg)
 */
const TicTacToe = forwardRef(function TicTacToe({ role='guest', onSend, onVictory, onClose }, ref) {
  const isHost = role === 'host';
  const [board, setBoard] = useState(Array(9).fill(''));
  const [turn, setTurn] = useState('X'); // host=X, guest=O
  const [win, setWin]   = useState(null);
  const [rematchCountdown, setRematchCountdown] = useState(null);

  // imperative inbox from parent
  const inboxRef = useRef([]);
  
  // Expose pushMessage method to parent
  useImperativeHandle(ref, () => ({
    pushMessage: (msg) => {
      inboxRef.current.push(msg);
    }
  }), []);

  useEffect(() => {
    const id = setInterval(() => {
      const msg = inboxRef.current.shift();
      if (!msg) return;

      if (msg.type === 'game:ttt:action' && isHost) {
        // apply guest action only if host && legal
        const { cell } = msg.payload || {};
        setBoard(prev => {
          if (win || prev[cell]) return prev;
          if (turn !== 'O') return prev;
          const next = prev.slice();
          next[cell] = 'O';
          const w = winnerOf(next);
          if (w) {
            setWin(w);
            onSend('game:ttt:victory', { winner: w });
            onVictory?.('ttt');
          } else {
            setTurn('X');
          }
          // broadcast new state
          onSend('game:ttt:state', { board: next, turn: w ? null : 'X', winner: w });
          return next;
        });
      }

      if (msg.type === 'game:ttt:state') {
        const { board: b, turn: t, winner } = msg.payload || {};
        setBoard(b || Array(9).fill(''));
        setTurn(t ?? 'X');
        setWin(winner || null);
      }

      if (msg.type === 'game:ttt:victory') {
        const { winner } = msg.payload || {};
        setWin(winner || 'X');
        onVictory?.('ttt');
      }

      if (msg.type === 'game:ttt:rematch') {
        const { countdown } = msg.payload || {};
        setRematchCountdown(countdown);
        if (countdown === 0) {
          setBoard(Array(9).fill(''));
          setTurn('X');
          setWin(null);
        }
      }
    }, 16);
    return () => clearInterval(id);
  }, [isHost, onSend, onVictory, win, turn]);

  // Click handling
  const myMark = isHost ? 'X' : 'O';
  const canPlay = !win;
  const clickCell = (i) => {
    if (!canPlay || board[i]) return;
    if (isHost && turn === 'X') {
      // host makes move locally and broadcasts state
      const next = board.slice();
      next[i] = 'X';
      const w = winnerOf(next);
      setBoard(next);
      if (w) {
        setWin(w);
        onSend('game:ttt:victory', { winner: w });
        onVictory?.('ttt');
        onSend('game:ttt:state', { board: next, turn: null, winner: w });
      } else {
        setTurn('O');
        onSend('game:ttt:state', { board: next, turn: 'O', winner: null });
      }
    } else if (!isHost && turn === 'O') {
      // guest requests action; host will validate & broadcast
      onSend('game:ttt:action', { cell: i });
    }
  };

  const startRematch = () => {
    if (!isHost) return;
    // simple 3-2-1 sync
    let c = 3;
    const tick = () => {
      onSend('game:ttt:rematch', { countdown: c });
      setRematchCountdown(c);
      if (c === 0) {
        const empty = Array(9).fill('');
        setBoard(empty);
        setTurn('X');
        setWin(null);
        onSend('game:ttt:state', { board: empty, turn: 'X', winner: null });
        return;
      }
      c -= 1;
      setTimeout(tick, 1000);
    };
    tick();
  };

  return (
    <div className="absolute inset-0 z-50 grid place-items-center">
      <div className="bg-white/90 rounded-2xl p-4 shadow-xl w-[340px]">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">Tic-Tac-Toe · You are <b>{myMark}</b></div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded bg-white border">Close</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {board.map((v,i)=>(
            <button
              key={i}
              onClick={()=>clickCell(i)}
              className="h-20 rounded-xl bg-white border text-2xl font-semibold hover:bg-gray-50"
            >
              {v}
            </button>
          ))}
        </div>

        <div className="mt-3 text-center text-sm">
          {win
            ? (win === 'T' ? 'It’s a tie!' : `Winner: ${win}`)
            : `Turn: ${turn}`}
        </div>

        {win && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={startRematch}
              disabled={!isHost}
              title={isHost ? '' : 'Host controls rematch'}
              className="px-3 py-1 rounded bg-rose-500 text-white disabled:opacity-50"
            >
              Rematch
            </button>
          </div>
        )}

        {rematchCountdown !== null && (
          <div className="mt-2 text-center text-xs text-gray-600">
            New game in… {rematchCountdown}
          </div>
        )}
      </div>
    </div>
  );
});

export default TicTacToe;