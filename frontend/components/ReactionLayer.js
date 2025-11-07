// frontend/components/ReactionLayer.js
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import { getJSON } from '../utils/storage';
import { bumpReaction } from '../utils/analytics';

const EMOJI_MAP = {
  heart: '❤️',
  laugh: '😂',
  thumbs: '👍',
  fire: '🔥',
  sparkle: '✨',
};

const rand = (min, max) => Math.random() * (max - min) + min;
const randi = (min, max) => Math.floor(rand(min, max));

const ReactionLayer = forwardRef(function ReactionLayer(_, ref) {
  const [items, setItems] = useState([]); // [{id, emoji, x, y, amp, dur, rot, blur, scale, size}]
  const idRef = useRef(0);
  const soundsOnRef = useRef(true);
  const lastBurstRef = useRef({ at: 0, type: null }); // track last burst for memories

  // keep sounds flag in sync with Settings
  useEffect(() => {
    const apply = () => {
      const s = getJSON('fq.settings') || {};
      soundsOnRef.current = s.reactionSounds !== false;
    };
    apply();
    const on = () => apply();
    window.addEventListener('fq:settings:update', on);
    return () => window.removeEventListener('fq:settings:update', on);
  }, []);

  // soft pop
  const { play: pop } = useSound('/sounds/pop1.mp3', { volume: 0.35, pool: 6 });

  useImperativeHandle(ref, () => ({
    /**
     * spawn('heart'|'laugh'|'thumbs'|'fire'|'sparkle', count?)
     */
    spawn: (type = 'heart', count) => {
      try { bumpReaction(type); } catch {}
      const emoji = EMOJI_MAP[type] ?? EMOJI_MAP.heart;

      // record last burst
      lastBurstRef.current = { at: Date.now(), type };

      // lush burst
      const n = typeof count === 'number' ? count : randi(22, 36);
      const now = Date.now();

      const batch = Array.from({ length: n }).map(() => {
        const startX = rand(10, 90);     // vw
        const startY = rand(58, 78);     // vh
        const amp = rand(6, 16);         // vw
        const dur = rand(2.8, 4.2);      // s
        const rot = rand(-14, 14);       // deg
        const blur = Math.random() < 0.25 ? 2 : 0;
        const scale = rand(0.9, 1.25);
        const size = randi(26, 38);      // px

        return {
          id: `${now}-${idRef.current++}`,
          emoji, x: startX, y: startY, amp, dur, rot, blur, scale, size,
        };
      });

      setItems(prev => [...prev, ...batch]);

      if (soundsOnRef.current) {
        try { pop(); } catch {}
      }

      // clean after longest animation completes
      setTimeout(() => {
        setItems(prev => prev.filter(p => !p.id.startsWith(String(now))));
      }, Math.ceil(Math.max(...batch.map(b => b.dur)) * 1000) + 600);
    },

    /** Expose last burst metadata (optional analytics/memories tag) */
    getLastBurstMeta: () => lastBurstRef.current,

    /**
     * Snapshot current reactions to a target canvas context.
     * Note: This renders an approximate static frame (start positions),
     * not the exact eased positions inside the animation timeline.
     */
    snapshotToCanvas: (ctx, width, height) => {
      if (!ctx || !width || !height) return;
      // draw each emoji using current "start" state as a reasonable approximation
      items.forEach(p => {
        const px = (p.x / 100) * width;   // vw → px
        const py = (p.y / 100) * height;  // vh → px
        const fontPx = Math.max(8, Math.round(p.size * (p.scale || 1)));

        ctx.save();
        try {
          ctx.translate(px, py);
          ctx.rotate((p.rot || 0) * Math.PI / 180);
          // optional blur using canvas filter (supported in modern browsers)
          ctx.filter = p.blur ? 'blur(2px)' : 'none';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `${fontPx}px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif`;
          // a little glow similar to mix-blend + textShadow vibe
          ctx.shadowColor = 'rgba(0,0,0,0.06)';
          ctx.shadowBlur = 1;
          ctx.fillText(p.emoji, 0, 0);
        } catch {}
        ctx.restore();
      });
    },
  }), [items, pop]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {items.map(p => {
        // Side-to-side sway while drifting up
        const xKF = [
          `${p.x}vw`,
          `${p.x + p.amp * 0.6}vw`,
          `${p.x - p.amp * 0.35}vw`,
          `${p.x + p.amp * 0.2}vw`,
          `${p.x}vw`,
        ];
        const yKF = [
          `${p.y}vh`,
          `${p.y - 18}vh`,
          `${p.y - 36}vh`,
          `${p.y - 60}vh`,
          `${p.y - 82}vh`,
        ];
        const opacityKF = [0, 0.98, 0.98, 0.78, 0];
        const rotateKF = [p.rot * 0.3, p.rot, -p.rot * 0.6, p.rot * 0.4, 0];
        const scaleKF = [0.7 * p.scale, 1.05 * p.scale, 1.0 * p.scale, 1.0 * p.scale, 1.0 * p.scale];

        return (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: `${p.y}vh`, x: `${p.x}vw`, scale: 0.7 * p.scale }}
            animate={{
              x: xKF,
              y: yKF,
              opacity: opacityKF,
              rotate: rotateKF,
              scale: scaleKF,
            }}
            transition={{
              duration: p.dur,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.18, 0.45, 0.78, 1],
            }}
            style={{
              position: 'absolute',
              fontSize: `${p.size}px`,
              filter: p.blur ? 'blur(2px)' : 'none',
              mixBlendMode: 'plus-lighter',
              willChange: 'transform, opacity',
              textShadow: '0 1px 0 rgba(0,0,0,0.06)',
            }}
          >
            {p.emoji}
          </motion.span>
        );
      })}
    </div>
  );
});

export default ReactionLayer;