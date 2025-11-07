// frontend/components/GameHUD.js
import { useEffect, useMemo, useReducer, useState, useCallback } from 'react';
import { createGame, reduce, applyMove, serialize, deserialize } from '../games/tictactoe';
import VictoryFX from './VictoryFX';

/**
 * Props:
 * - onClose: () => void
 * - onData: (handler) => unsubscribeFn         // from useRTC
 * - sendGame: (payload) => void                // wrapper -> sendDraw('game:t3', payload)
 */
export default function GameHUD({ onClose, onData, sendGame }) {
  const [me, setMe] = useState(() => (Math.random() < 0.5 ? 'X' : 'Y')); // lightweight local seat
  const [countdown, setCountdown] = useState(0);

  const [state, dispatch] = useReducer(reduce, null, () => createGame(Date.now()));

  // --- helpers ---
  const isMyTurn = state.status === 'playing' && state.turn === me;

  const sendMove = useCallback((idx) => {
    sendGame?.({ action: 'move', idx });
  }, [sendGame]);

  const sendReset = useCallback((seed) => {
    sendGame?.({ action: 'reset', seed });
  }, [sendGame]);

  // --- inbound network messages ---
  useEffect(() => {
    if (!onData) return;
    return onData((msg) => {
      if (!msg || msg.type !== 'game:t3') return;

      if (msg.action === 'move' && Number.isInteger(msg.idx)) {
        // Apply move with NO player lock here; remote is considered source of truth
        const next = applyMove(state, msg.idx, null);
        dispatch({ type: 'sync', payload: serialize(next) });
      } else if (msg.action === 'reset') {
        const seed = msg.seed ?? Date.now();
        dispatch({ type: 'reset', seed });
      } else if (msg.action === 'sync' && msg.payload) {
        // optional full-state sync path
        dispatch({ type: 'sync', payload: msg.payload });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onData, state]);

  // --- click on a cell ---
  const onCellClick = (i) => {
    if (state.status !== 'playing') return;
    if (!isMyTurn) return;
    if (state.board[i] != null) return;

    // local optimistic
    const optimistic = applyMove(state, i, me);
    dispatch({ type: 'sync', payload: serialize(optimistic) });

    // broadcast
    sendMove(i);
  };

  // --- rematch with countdown ---
  const onRematch = () => {
    if (countdown) return;
    setCountdown(3);
  };

  useEffect(() => {
    if (!countdown) return;
    const t = setTimeout(() => {
      if (countdown <= 1) {
        const seed = Date.now();
        dispatch({ type: 'reset', seed });
        sendReset(seed);
        setCountdown(0);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown, sendReset]);

  // --- UI ---
  const winnerBanner =
    state.status === 'win' ? `Winner: ${state.winner}` :
    state.status === 'draw' ? 'Draw' : (isMyTurn ? 'Your turn' : `Waiting for ${state.turn}`);

  return (
    <>
      {/* Victory fireworks (shows on BOTH peers when a win is detected) */}
      <VictoryFX open={state.status === 'win'} />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[320px]">
        <div className="rounded-2xl bg-white/85 backdrop-blur shadow-lg ring-1 ring-black/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">
              <strong>Tic-Tac-Toe</strong>
              <div className="text-xs text-gray-600">
                You are <span className="font-semibold">{me}</span> • {winnerBanner}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-xs px-2 py-1 rounded bg-white border"
                onClick={onRematch}
                type="button"
                title="Rematch"
              >
                {countdown ? `Rematch in ${countdown}` : 'Rematch'}
              </button>
              <button
                className="text-xs px-2 py-1 rounded bg-white border"
                onClick={onClose}
                type="button"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Board */}
          <div className="grid grid-cols-3 gap-2">
            {state.board.map((v, i) => {
              const active = state.line?.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onCellClick(i)}
                  className={
                    "h-20 rounded-xl grid place-items-center text-2xl font-semibold " +
                    "bg-white shadow-inner border " +
                    (active ? "ring-2 ring-rose-400" : "hover:bg-gray-50")
                  }
                  disabled={!!v || state.status !== 'playing' || !isMyTurn}
                >
                  {v ?? ''}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-2 text-[11px] text-gray-600">
            Click a cell when it’s your turn. First to 3 in a row wins.
          </div>
        </div>
      </div>
    </>
  );
}