// frontend/components/games/ConnectFour.js
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

const COLS = 7, ROWS = 6;

function emptyBoard(){
  return Array.from({length: ROWS}, () => Array(COLS).fill(''));
}

function dropPiece(board, col, piece){
  // returns {row, board} or null if full
  const b = board.map(r=>r.slice());
  for (let r = ROWS-1; r >= 0; r--){
    if (!b[r][col]) { b[r][col] = piece; return { row: r, board: b }; }
  }
  return null;
}

function winnerOf(board){
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      const val = board[r][c];
      if (!val) continue;
      for (const [dr,dc] of dirs){
        let cnt=1, rr=r+dr, cc=c+dc;
        while (rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&board[rr][cc]===val){ cnt++; rr+=dr; cc+=dc; }
        if (cnt>=4) return val;
      }
    }
  }
  // tie?
  if (board.every(row => row.every(Boolean))) return 'T';
  return null;
}

/**
 * Props:
 * - role: 'host' | 'guest'
 * - onSend(type, payload)
 * - onVictory(key)
 * - onClose()
 */
const ConnectFour = forwardRef(function ConnectFour({ role='guest', onSend, onVictory, onClose }, ref) {
  const isHost = role === 'host';
  const [board, setBoard] = useState(emptyBoard());
  const [turn, setTurn]   = useState('R'); // host=R, guest=Y
  const [win, setWin]     = useState(null);
  const [rematchCountdown, setRematchCountdown] = useState(null);

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

      if (msg.type === 'game:c4:action' && isHost) {
        const { col } = msg.payload || {};
        setBoard(prev => {
          if (win || turn !== 'Y') return prev;
          const drop = dropPiece(prev, col, 'Y');
          if (!drop) return prev;
          const b = drop.board;
          const w = winnerOf(b);
          if (w) {
            setWin(w);
            onSend('game:c4:victory', { winner: w });
            onVictory?.('c4');
          } else {
            setTurn('R');
          }
          onSend('game:c4:state', { board: b, turn: w ? null : 'R', winner: w });
          return b;
        });
      }

      if (msg.type === 'game:c4:state') {
        const { board: b, turn: t, winner } = msg.payload || {};
        setBoard(b || emptyBoard());
        setTurn(t ?? 'R');
        setWin(winner || null);
      }

      if (msg.type === 'game:c4:victory') {
        const { winner } = msg.payload || {};
        setWin(winner || 'R');
        onVictory?.('c4');
      }

      if (msg.type === 'game:c4:rematch') {
        const { countdown } = msg.payload || {};
        setRematchCountdown(countdown);
        if (countdown === 0) {
          const empty = emptyBoard();
          setBoard(empty);
          setTurn('R');
          setWin(null);
        }
      }
    }, 16);
    return () => clearInterval(id);
  }, [isHost, onSend, onVictory, win, turn]);

  const myPiece = isHost ? 'R' : 'Y';
  const canPlay = !win;
  const playCol = (col) => {
    if (!canPlay) return;
    if (isHost && turn === 'R') {
      const drop = dropPiece(board, col, 'R');
      if (!drop) return;
      const b = drop.board;
      const w = winnerOf(b);
      setBoard(b);
      if (w) {
        setWin(w);
        onSend('game:c4:victory', { winner: w });
        onVictory?.('c4');
        onSend('game:c4:state', { board: b, turn: null, winner: w });
      } else {
        setTurn('Y');
        onSend('game:c4:state', { board: b, turn: 'Y', winner: null });
      }
    } else if (!isHost && turn === 'Y') {
      onSend('game:c4:action', { col });
    }
  };

  const startRematch = () => {
    if (!isHost) return;
    let c = 3;
    const tick = () => {
      onSend('game:c4:rematch', { countdown: c });
      setRematchCountdown(c);
      if (c === 0) {
        const empty = emptyBoard();
        setBoard(empty);
        setTurn('R');
        setWin(null);
        onSend('game:c4:state', { board: empty, turn: 'R', winner: null });
        return;
      }
      c -= 1;
      setTimeout(tick, 1000);
    };
    tick();
  };

  return (
    <div className="absolute inset-0 z-50 grid place-items-center">
      <div className="bg-white/90 rounded-2xl p-4 shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">Connect Four · You are <b>{myPiece}</b></div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded bg-white border">Close</button>
        </div>

        <div className="grid gap-2" style={{gridTemplateColumns:`repeat(${COLS}, 48px)`}}>
          {Array.from({length: COLS}).map((_,c)=>(
            <button
              key={`col-${c}`}
              onClick={()=>playCol(c)}
              className="h-6 rounded bg-gray-100 text-xs hover:bg-gray-200"
            >
              ↓
            </button>
          ))}
          {board.map((row,r)=>row.map((cell,c)=>(
            <div key={`${r}-${c}`} className="w-12 h-12 rounded-full bg-blue-200 grid place-items-center">
              <div className={`w-9 h-9 rounded-full ${cell==='R'?'bg-red-500':cell==='Y'?'bg-yellow-400':'bg-white'}`}/>
            </div>
          )))}
        </div>

        <div className="mt-3 text-center text-sm">
          {win ? (win==='T'?'It’s a tie!':`Winner: ${win}`) : `Turn: ${turn}`}
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

export default ConnectFour;