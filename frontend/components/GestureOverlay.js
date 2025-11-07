// frontend/components/GestureOverlay.js
export default function GestureOverlay({ last }){
  return (
    <div className="pointer-events-none absolute top-2 right-2 z-30 bg-white/60 rounded-xl px-3 py-1 text-sm shadow">
      {last ? `Gesture: ${last}` : 'Gestures active (👍 ❤️ ✊ ☝️)'}
    </div>
  );
}