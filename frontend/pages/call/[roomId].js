// frontend/pages/call/[roomId].js
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useRTC } from '../../hooks/useRTC';
import VideoFeed from '../../components/VideoFeed';
import GestureOverlay from '../../components/GestureOverlay';
import ReactionLayer from '../../components/ReactionLayer';
import CanvasLayer from '../../components/CanvasLayer';
import GameHUD from '../../components/GameHUD/index';
import MusicHUD from '../../components/MusicHUD';
import SettingsModal from '../../components/SettingsModal';
import Toolbelt from '../../components/Toolbelt';
import FireworksLayer from '../../components/FireworksLayer';
import Countdown from '../../components/Countdown';
import Link from 'next/link';
import { getJSON } from '../../utils/storage';

// Week-3 Memories
import MemoryPreviewModal from '../../components/MemoryPreviewModal';
import CaptionModal from '../../components/memories/CaptionModal';
import { saveMemoryBundle, updateMemory } from '../../utils/memories'; // <-- IMPORTANT

export default function CallRoom() {
  const router = useRouter();
  const ready =
    router.isReady &&
    typeof router.query.roomId === 'string' &&
    router.query.roomId.length > 0;
  const room = useMemo(() => (ready ? router.query.roomId : null), [ready, router.query.roomId]);

  const {
    localStream,
    remoteStream,
    micOn,
    camOn,
    mediaError,
    setMic,
    setCam,
    sendDraw,
    sendReaction,
    // music
    sendMusicState,
    onMusicEvent,
    // generic
    onData,
    peerConnected,
    isInitiator, // true = host, false = guest, null = not connected
  } = useRTC(room); // hook no-ops until router is ready

  const reactionRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const fireworksRef = useRef(null);
  const gameHUDRef = useRef(null);

  // ===== Week-3 local UI state =====
  const [openSettings, setOpenSettings] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [drawingOn, setDrawingOn] = useState(true);
  const [activeGame, setActiveGame] = useState(null); // 'ttt' | 'c4' | null
  const [gameInvite, setGameInvite] = useState(null); // { gameKey, from } when receiving invitation
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, or null

  // Memory preview state
  const [memOpen, setMemOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [pendingMemoryId, setPendingMemoryId] = useState(null);
  const [captured, setCaptured] = useState(null); // { merged, video, drawing, reactions }

  // reflect settings updates (Week-2 behavior preserved)
  useEffect(() => {
    const apply = () => {
      const s = getJSON('fq.settings') || {};
      setMusicEnabled(s.musicEnabled !== false);
    };
    apply();
    const on = () => apply();
    window.addEventListener('fq:settings:update', on);
    return () => window.removeEventListener('fq:settings:update', on);
  }, []);

  // Listen for "Clear Canvas" from Settings (Week-2)
  useEffect(() => {
    const onClear = () => {
      try { canvasRef.current?.clear?.(); } catch {}
    };
    window.addEventListener('fq:canvas:clear', onClear);
    return () => window.removeEventListener('fq:canvas:clear', onClear);
  }, []);

  // Peer data (reactions + drawing + games)
  useEffect(() => {
    return onData((msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === 'reaction' && msg.emoji) {
        reactionRef.current?.spawn(msg.emoji);
        return;
      }

      if (msg.type === 'draw:begin' && msg.payload) {
        canvasRef.current?.begin?.(msg.payload);
      } else if (msg.type === 'draw:point' && msg.payload) {
        canvasRef.current?.point?.(msg.payload);
      } else if (msg.type === 'draw:end') {
        canvasRef.current?.end?.();
      }

      // Handle game invitations
      if (msg.type === 'game:invite') {
        const { gameKey } = msg.payload || {};
        setGameInvite({ gameKey, from: 'peer' });
        return;
      }

      if (msg.type === 'game:invite:accept') {
        const { gameKey } = msg.payload || {};
        setActiveGame(gameKey);
        setGameInvite(null);
        return;
      }

      if (msg.type === 'game:invite:decline') {
        setGameInvite(null);
        return;
      }

      // Forward game messages to GameHUD
      if (msg.type?.startsWith('game:')) {
        gameHUDRef.current?.handleMessage?.(msg);
        
        // Show rematch countdown on main overlay
        if (msg.type.includes(':rematch')) {
          const { countdown: c } = msg.payload || {};
          if (c !== undefined) {
            setCountdown(c);
            if (c === 0) {
              setTimeout(() => setCountdown(null), 800);
            }
          }
        }
      }
    });
  }, [onData]);

  // Local reaction trigger
  const handleReaction = useCallback((emojiType) => {
    reactionRef.current?.spawn(emojiType);
    sendReaction(emojiType);
  }, [sendReaction]);

  // Local drawing -> emit to peer
  const handleDraw = useCallback((type, payload) => {
    if (!drawingOn) return;
    sendDraw(type, payload);
  }, [sendDraw, drawingOn]);

  // Invite link
  const handleInvite = useCallback(() => {
    if (!room) return;
    const href = `${window.location.origin}/call/${room}`;
    navigator.clipboard?.writeText(href);
  }, [room]);

  // Capture merged + per-layer
  const handleCapture = useCallback(async () => {
    try {
      const W = window.innerWidth;
      const H = window.innerHeight;

      const mk = (w = W, h = H) => {
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.floor(w));
        c.height = Math.max(1, Math.floor(h));
        return c;
      };
      const drawCover = (ctx, media, targetW, targetH) => {
        const vw = media.videoWidth || targetW;
        const vh = media.videoHeight || targetH;
        if (!vw || !vh) return;
        const scale = Math.max(targetW / vw, targetH / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (targetW - dw) / 2;
        const dy = (targetH - dh) / 2;
        ctx.drawImage(media, dx, dy, dw, dh);
      };

      // Remote VIDEO frame (select the actual <video> element)
      const videoEl = document.querySelector('video.js-remote');
      const videoCanvas = mk();
      if (videoEl) {
        const vctx = videoCanvas.getContext('2d');
        drawCover(vctx, videoEl, videoCanvas.width, videoCanvas.height);
      }

      // DRAWING layer (raw canvas from CanvasLayer)
      const drawingCanvas = mk();
      const srcCanvas = canvasRef.current?.getCanvas?.();
      if (srcCanvas) {
        const dctx = drawingCanvas.getContext('2d');
        dctx.drawImage(srcCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height);
      }

      // REACTIONS layer
      const reactionsCanvas = mk();
      if (reactionRef.current?.snapshotToCanvas) {
        const rctx = reactionsCanvas.getContext('2d');
        reactionRef.current.snapshotToCanvas(rctx, reactionsCanvas.width, reactionsCanvas.height);
      }

      // MERGE: video → drawing → reactions
      const mergedCanvas = mk();
      const mctx = mergedCanvas.getContext('2d');
      mctx.drawImage(videoCanvas, 0, 0);
      mctx.drawImage(drawingCanvas, 0, 0);
      mctx.drawImage(reactionsCanvas, 0, 0);

      // Data URLs
      const merged = mergedCanvas.toDataURL('image/png', 0.92);
      const video = videoCanvas.toDataURL('image/png', 0.92);
      const drawing = drawingCanvas.toDataURL('image/png', 0.92);
      const reactions = reactionsCanvas.toDataURL('image/png', 0.92);

      // Persist bundle (compressed inside helper)
      const mem = await saveMemoryBundle({
        merged, video, drawing, reactions,
        tags: ['call', room || 'unknown'],
        caption: '',
      });

      // Open preview with the four layers
      setCaptured({ merged, video, drawing, reactions });
      setMemOpen(true);
      
      // Store memory ID for later caption
      setPendingMemoryId(mem.id);
    } catch (e) {
      console.warn('[Memories] capture failed', e);
    }
  }, [room]);

  // Game invitation handlers
  const handleGameRequest = useCallback((gameKey) => {
    // Send invitation to peer
    sendDraw('game:invite', { gameKey });
    // Open game immediately for the initiator
    setActiveGame(gameKey);
  }, [sendDraw]);

  const handleAcceptInvite = useCallback(() => {
    if (!gameInvite) return;
    sendDraw('game:invite:accept', { gameKey: gameInvite.gameKey });
    setActiveGame(gameInvite.gameKey);
    setGameInvite(null);
  }, [gameInvite, sendDraw]);

  const handleDeclineInvite = useCallback(() => {
    if (!gameInvite) return;
    sendDraw('game:invite:decline', { gameKey: gameInvite.gameKey });
    setGameInvite(null);
  }, [gameInvite, sendDraw]);

  // Victory handler - triggers fireworks and auto-captures
  const handleVictory = useCallback(async (gameKey) => {
    // Fire fireworks!
    fireworksRef.current?.fire();
    
    // Auto-capture the victory moment with "wins" tag
    setTimeout(async () => {
      try {
        const W = window.innerWidth;
        const H = window.innerHeight;

        const mk = (w = W, h = H) => {
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.floor(w));
          c.height = Math.max(1, Math.floor(h));
          return c;
        };
        const drawCover = (ctx, media, targetW, targetH) => {
          const vw = media.videoWidth || targetW;
          const vh = media.videoHeight || targetH;
          if (!vw || !vh) return;
          const scale = Math.max(targetW / vw, targetH / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (targetW - dw) / 2;
          const dy = (targetH - dh) / 2;
          ctx.drawImage(media, dx, dy, dw, dh);
        };

        const videoEl = document.querySelector('video.js-remote');
        const videoCanvas = mk();
        if (videoEl) {
          const vctx = videoCanvas.getContext('2d');
          drawCover(vctx, videoEl, videoCanvas.width, videoCanvas.height);
        }

        const drawingCanvas = mk();
        const srcCanvas = canvasRef.current?.getCanvas?.();
        if (srcCanvas) {
          const dctx = drawingCanvas.getContext('2d');
          dctx.drawImage(srcCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height);
        }

        const reactionsCanvas = mk();
        if (reactionRef.current?.snapshotToCanvas) {
          const rctx = reactionsCanvas.getContext('2d');
          reactionRef.current.snapshotToCanvas(rctx, reactionsCanvas.width, reactionsCanvas.height);
        }

        const mergedCanvas = mk();
        const mctx = mergedCanvas.getContext('2d');
        mctx.drawImage(videoCanvas, 0, 0);
        mctx.drawImage(drawingCanvas, 0, 0);
        mctx.drawImage(reactionsCanvas, 0, 0);

        const merged = mergedCanvas.toDataURL('image/png', 0.92);
        const video = videoCanvas.toDataURL('image/png', 0.92);
        const drawing = drawingCanvas.toDataURL('image/png', 0.92);
        const reactions = reactionsCanvas.toDataURL('image/png', 0.92);

        // Save with "wins" tag for filtering
        await saveMemoryBundle({
          merged, video, drawing, reactions,
          tags: ['call', 'wins', gameKey, room || 'unknown'],
          caption: `🏆 Victory in ${gameKey === 'ttt' ? 'Tic-Tac-Toe' : 'Connect Four'}!`,
        });
      } catch (e) {
        console.warn('[Victory] auto-capture failed', e);
      }
    }, 1200); // delay for fireworks to be visible
  }, [room]);

  // Save caption for the captured memory
  const handleSaveCaption = useCallback((caption) => {
    if (pendingMemoryId && caption) {
      updateMemory(pendingMemoryId, { caption });
    }
    setCaptionOpen(false);
    setPendingMemoryId(null);
  }, [pendingMemoryId]);

  // End/leave call
  const handleEnd = useCallback(() => { router.push('/'); }, [router]);

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-black grid place-items-center text-white/85">
        Preparing room…
      </div>
    );
  }

  return (
    <div ref={stageRef} className="fixed inset-0 bg-black">
      {/* Media error overlay */}
      {mediaError && (
        <div className="absolute inset-0 z-60 grid place-items-center bg-black/70 text-white p-6 text-center">
          <div className="max-w-md">
            <h2 className="text-xl font-semibold mb-2">Camera/Microphone Error</h2>
            <p className="text-sm opacity-90">{mediaError}</p>
            <p className="text-sm opacity-75 mt-2">Tip: Allow permissions in your browser and refresh.</p>
          </div>
        </div>
      )}

      {/* Remote video (full screen) or waiting state) */}
      {remoteStream ? (
        <VideoFeed
          className="absolute inset-0 w-full h-full object-cover js-remote"
          stream={remoteStream}
          showPlaceholder={false}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/85 text-lg">
          {peerConnected ? 'Connected — waiting for video…' : 'Waiting for peer…'}
        </div>
      )}

      {/* Local PiP */}
      {localStream && (
        <div className="absolute bottom-5 right-5 w-[260px] h-40 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/20">
          <VideoFeed
            className="w-full h-full object-cover"
            stream={localStream}
            mirrored
            showPlaceholder={!camOn}
          />
        </div>
      )}

      {/* Overlays */}
      <GestureOverlay />
      <ReactionLayer ref={reactionRef} />
      <CanvasLayer ref={canvasRef} onDraw={handleDraw} />
      <FireworksLayer ref={fireworksRef} />
      <Countdown value={countdown} />

      {/* HUDs */}
      <GameHUD
        ref={gameHUDRef}
        activeGame={activeGame}
        setActiveGame={setActiveGame}
        onGameRequest={handleGameRequest}
        role={isInitiator === true ? 'host' : isInitiator === false ? 'guest' : 'host'}
        onSend={(type, payload) => sendDraw(type, payload)}
        onVictory={handleVictory}
      />
      <MusicHUD
        enabled={musicEnabled && musicOn}
        role="host"
        sendMusicState={sendMusicState}
        onMusicEvent={onMusicEvent}
      />

      {/* Toolbelt */}
      <Toolbelt
        onReaction={handleReaction}
        onInvite={handleInvite}
        onOpenSettings={() => setOpenSettings(true)}
        micOn={micOn}
        camOn={camOn}
        onToggleMic={setMic}
        onToggleCam={setCam}
        drawingOn={drawingOn}
        onToggleDraw={() => setDrawingOn(v => !v)}
        onOpenGames={() => setActiveGame(activeGame ? null : 'ttt')}
        musicOn={musicOn}
        onToggleMusic={() => setMusicOn(v => !v)}
        onCapture={handleCapture}
        onEnd={handleEnd}
      />

      {/* Exit */}
      <div className="absolute top-4 left-4 z-60">
        <Link
          href="/"
          className="px-3 py-1 rounded-lg bg-white/80 hover:bg-white text-sm shadow"
        >
          ← Exit
        </Link>
      </div>

      {/* Settings */}
      <SettingsModal
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        micOn={micOn}
        camOn={camOn}
        onToggleMic={setMic}
        onToggleCam={setCam}
      />

      {/* Memory preview modal */}
      {memOpen && captured && (
        <MemoryPreviewModal
          open={memOpen}
          onClose={() => {
            setMemOpen(false);
            // Offer caption modal after preview
            if (pendingMemoryId) {
              setTimeout(() => setCaptionOpen(true), 200);
            }
          }}
          merged={captured.merged}
          video={captured.video}
          drawing={captured.drawing}
          reactions={captured.reactions}
        />
      )}

      {/* Caption modal */}
      <CaptionModal
        open={captionOpen}
        onClose={() => {
          setCaptionOpen(false);
          setPendingMemoryId(null);
        }}
        onSave={handleSaveCaption}
      />

      {/* Game Invitation Modal */}
      {gameInvite && (
        <div className="fixed inset-0 z-[65] grid place-items-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px]">
            <h2 className="text-xl font-bold mb-3">🎮 Game Invitation</h2>
            <p className="text-gray-700 mb-6">
              Your peer wants to play{' '}
              <span className="font-semibold">
                {gameInvite.gameKey === 'ttt' ? 'Tic-Tac-Toe' : 'Connect Four'}
              </span>
              !
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptInvite}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transition-all"
              >
                Accept
              </button>
              <button
                onClick={handleDeclineInvite}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-all"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}