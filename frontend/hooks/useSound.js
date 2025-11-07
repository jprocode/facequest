// frontend/hooks/useSound.js
import { useEffect, useRef, useCallback } from 'react';

/**
 * Safe, client-only audio pool.
 * Usage:
 *   const { play } = useSound('/sounds/pop1.mp3', { volume: 0.35, pool: 6 });
 *   play();
 */
export function useSound(url, { volume = 1, pool = 4 } = {}) {
  const playersRef = useRef([]);
  const idxRef = useRef(0);
  const isClient = typeof window !== 'undefined' && typeof Audio !== 'undefined';

  useEffect(() => {
    if (!isClient || !url) return;

    const players = Array.from({ length: pool }, () => {
      const a = new Audio(url);
      a.preload = 'auto';
      a.volume = volume;
      return a;
    });

    playersRef.current = players;

    return () => {
      // cleanup
      playersRef.current.forEach((a) => {
        try {
          a.pause();
          a.src = '';
        } catch {}
      });
      playersRef.current = [];
    };
  }, [isClient, url, volume, pool]);

  const play = useCallback(() => {
    if (!isClient || playersRef.current.length === 0) return;
    const i = idxRef.current++ % playersRef.current.length;
    const a = playersRef.current[i];
    try {
      a.currentTime = 0;
      // Some browsers need a prior user gesture; ignore rejections silently.
      a.play().catch(() => {});
    } catch {}
  }, [isClient]);

  return { play };
}