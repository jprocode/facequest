// frontend/components/Toolbelt.js
import { useEffect } from 'react';

const Btn = ({ children, onClick, title, active = false }) => (
  <button
    className={
      "px-3 py-2 rounded-xl shadow transition " +
      (active
        ? "bg-white ring-2 ring-rose-400"
        : "bg-white/80 hover:bg-white")
    }
    onClick={onClick}
    title={title}
    type="button"
    aria-pressed={active}
  >
    {children}
  </button>
);

/**
 * Props:
 * - onReaction(type)
 * - onInvite?: () => void
 * - onOpenSettings?: () => void
 * - micOn?: boolean, camOn?: boolean
 * - onToggleMic?: (bool) => void
 * - onToggleCam?: (bool) => void
 * - drawingOn?: boolean
 * - onToggleDraw?: () => void
 * - onOpenGames?: () => void
 * - musicOn?: boolean
 * - onToggleMusic?: () => void
 * - onCapture?: () => void            // save Memory/postcard
 * - onEnd?: () => void                // end/leave call
 */
export default function Toolbelt({
  onReaction,
  onInvite,
  onOpenSettings,
  micOn = true,
  camOn = true,
  onToggleMic,
  onToggleCam,
  drawingOn = false,
  onToggleDraw,
  onOpenGames,
  musicOn = true,
  onToggleMusic,
  onCapture,
  onEnd,
}) {
  // Keyboard shortcuts: 1..5 trigger common reactions
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const map = {
        '1': 'heart',
        '2': 'laugh',
        '3': 'thumbs',
        '4': 'fire',
        '5': 'sparkle',
      };
      const type = map[e.key];
      if (type) {
        e.preventDefault();
        onReaction?.(type);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onReaction]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
      {/* AV controls */}
      <Btn title={micOn ? "Mic on" : "Mic off"} onClick={() => onToggleMic?.(!micOn)} active={micOn}>
        {micOn ? '🎙️' : '🔇'}
      </Btn>
      <Btn title={camOn ? "Camera on" : "Camera off"} onClick={() => onToggleCam?.(!camOn)} active={camOn}>
        {camOn ? '🎥' : '🚫🎥'}
      </Btn>

      {/* Draw / Games / Music */}
      <Btn title={drawingOn ? "Disable drawing" : "Enable drawing"} onClick={onToggleDraw} active={drawingOn}>
        ✏️
      </Btn>
      <Btn title="Open Games" onClick={onOpenGames}>
        🎮
      </Btn>
      <Btn title={musicOn ? "Hide Music HUD" : "Show Music HUD"} onClick={onToggleMusic} active={musicOn}>
        🎵
      </Btn>

      {/* Reactions row */}
      <div className="mx-1 flex gap-1">
        <Btn title="Heart (1)" onClick={() => onReaction?.('heart')}>❤️</Btn>
        <Btn title="Laugh (2)" onClick={() => onReaction?.('laugh')}>😂</Btn>
        <Btn title="Thumbs (3)" onClick={() => onReaction?.('thumbs')}>👍</Btn>
        <Btn title="Fire (4)" onClick={() => onReaction?.('fire')}>🔥</Btn>
        <Btn title="Sparkle (5)" onClick={() => onReaction?.('sparkle')}>✨</Btn>
      </div>

      {/* Utilities */}
      <Btn title="Copy Invite Link" onClick={onInvite}>🔗</Btn>
      <Btn title="Settings" onClick={onOpenSettings}>⚙️</Btn>
      <Btn title="Save Memory" onClick={onCapture}>📸</Btn>
      <Btn title="End Call" onClick={onEnd}>🔚</Btn>
    </div>
  );
}