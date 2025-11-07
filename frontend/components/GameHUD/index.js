// frontend/components/GameHUD/index.js
import { forwardRef, useImperativeHandle, useRef } from 'react';
import TicTacToe from '../games/TicTacToe';
import ConnectFour from '../games/ConnectFour';

const GameHUD = forwardRef(function GameHUD({
  activeGame,            // 'ttt' | 'c4' | null
  setActiveGame,
  onGameRequest,         // (gameKey) => void - sends invitation to peer
  role = 'host',
  onSend,                // (type, payload) => void  (parent wraps useRTC().sendDraw)
  onVictory,             // () => void (fireworks)
}, ref){
  // Refs to active game components
  const tttRef = useRef(null);
  const c4Ref = useRef(null);

  // Expose handleMessage to parent
  useImperativeHandle(ref, () => ({
    handleMessage(msg){
      // only forward game messages
      if (!msg?.type?.startsWith('game:')) return;
      
      // Route to appropriate game component
      if (msg.type.startsWith('game:ttt:')) {
        tttRef.current?.pushMessage?.(msg);
      } else if (msg.type.startsWith('game:c4:')) {
        c4Ref.current?.pushMessage?.(msg);
      }
    }
  }), []);

  const closeGame = () => setActiveGame(null);

  const gameProps = {
    role,
    onSend: (type, payload) => onSend?.(type, payload),
    onVictory,
    onClose: closeGame,
  };

  // Helper to initiate a game
  const initiateGame = (gameKey) => {
    if (onGameRequest) {
      onGameRequest(gameKey); // Send invitation
    } else {
      setActiveGame(gameKey); // Fallback for backward compatibility
    }
  };

  return (
    <>
      {/* launcher pill */}
      {!activeGame && (
        <div className="absolute top-20 right-5 z-40 bg-white/85 backdrop-blur rounded-2xl shadow-lg p-3">
          <div className="text-xs mb-2 font-medium text-gray-700">🎮 Mini-Games</div>
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 text-white text-sm font-medium hover:shadow-md transition-all"
              onClick={() => initiateGame('ttt')}
            >
              Tic-Tac-Toe
            </button>
            <button 
              className="px-3 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm font-medium hover:shadow-md transition-all"
              onClick={() => initiateGame('c4')}
            >
              Connect Four
            </button>
          </div>
        </div>
      )}

      {/* active game overlays */}
      {activeGame === 'ttt' && (
        <TicTacToe ref={tttRef} {...gameProps} />
      )}
      {activeGame === 'c4' && (
        <ConnectFour ref={c4Ref} {...gameProps} />
      )}
    </>
  );
});

export default GameHUD;