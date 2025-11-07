// frontend/components/VictoryFX.js
import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * VictoryFX
 * Lightweight confetti + emoji fireworks overlay.
 * Props:
 *  - open: boolean
 *  - onDone?: () => void   // called after auto-clean delay
 *  - durationMs?: number   // total animation length (default 2200ms)
 *  - emojis?: string[]     // optional set, default ["🎉","🏆","✨","🔥","🎊"]
 */
export default function VictoryFX({
  open,
  onDone,
  durationMs = 2200,
  emojis = ['🎉', '🏆', '✨', '🔥', '🎊'],
}) {
  // Pre-compute a particle batch
  const batch = useMemo(() => {
    if (!open) return [];
    const N = 36;
    const now = Date.now();
    const rnd = (a, b) => Math.random() * (b - a) + a;
    const rndi = (a, b) => Math.floor(rnd(a, b));
    return Array.from({ length: N }).map((_, i) => {
      const e = emojis[rndi(0, emojis.length)];
      const x = rnd(8, 92);    // vw
      const y = rnd(22, 58);   // vh start (upper half-ish)
      const ampX = rnd(8, 22); // side sway
      const up = rnd(28, 46);  // vertical rise
      const rot = rnd(-60, 60);
      const size = rndi(22, 36);
      const delay = rnd(0, 0.12); // cascade
      return {
        id: `${now}-${i}`,
        e, x, y, ampX, up, rot, size, delay,
      };
    });
  }, [open, emojis]);

  // Auto-clean callback
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { onDone?.(); }, durationMs + 300);
    return () => clearTimeout(t);
  }, [open, onDone, durationMs]);

  if (!open) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {/* subtle flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="absolute inset-0 bg-white"
        style={{ mixBlendMode: 'overlay' }}
      />
      {/* particles */}
      {batch.map(p => {
        const xKF = [`${p.x}vw`, `${p.x + p.ampX}vw`, `${p.x - p.ampX * 0.6}vw`, `${p.x}vw`];
        const yKF = [`${p.y}vh`, `${p.y - p.up * 0.55}vh`, `${p.y - p.up}vh`];
        const oKF = [0, 1, 0];
        const rKF = [0, p.rot, 0];
        const sKF = [0.9, 1.0, 1.0];

        return (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, x: `${p.x}vw`, y: `${p.y}vh`, scale: 0.9 }}
            animate={{ x: xKF, y: yKF, opacity: oKF, rotate: rKF, scale: sKF }}
            transition={{
              duration: durationMs / 1000,
              ease: [0.22, 1, 0.36, 1],
              delay: p.delay,
            }}
            style={{
              position: 'absolute',
              fontSize: `${p.size}px`,
              textShadow: '0 1px 0 rgba(0,0,0,0.06)',
              mixBlendMode: 'plus-lighter',
              willChange: 'transform, opacity',
            }}
          >
            {p.e}
          </motion.span>
        );
      })}
    </div>
  );
}