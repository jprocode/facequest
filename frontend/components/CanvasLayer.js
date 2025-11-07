// frontend/components/CanvasLayer.js
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

/**
 * CanvasLayer
 * - Local: emits onDraw('draw:begin'|'draw:point'|'draw:end', payload)
 * - Remote: expose begin/point/end imperative methods (DPR-aware)
 * - Week 3 add: getSnapshot({ scale, mime, quality, background }) -> dataURL
 * - Week 3 add: getCanvas() -> HTMLCanvasElement (for compositing)
 */
const CanvasLayer = forwardRef(function CanvasLayer({ onDraw }, ref) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const lastRef = useRef(null);
  const dprRef = useRef(1);
  const lastEmitRef = useRef(0); // throttle ~30Hz

  // Setup & DPR resize
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const resize = () => {
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (c.width !== width) c.width = width;
      if (c.height !== height) c.height = height;
      const ctx = c.getContext('2d');
      // logical pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,107,129,0.95)';
      ctx.lineWidth = 4;
      lastRef.current = null;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Convert pointer to logical canvas coords (not device pixels)
  function cssToLogical(e) {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: Date.now(), dpr: dprRef.current };
  }

  function drawSegLogical(a, b) {
    const c = canvasRef.current; if (!c || !a || !b) return;
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Local pointer handlers
  const onPointerDown = (e) => {
    e.preventDefault();
    setDrawing(true);
    const p = cssToLogical(e);
    lastRef.current = p;
    lastEmitRef.current = 0;
    onDraw?.('draw:begin', { x: p.x, y: p.y, dpr: p.dpr });
  };

  const onPointerMove = (e) => {
    if (!drawing) return;
    const p = cssToLogical(e);
    drawSegLogical(lastRef.current, p);
    lastRef.current = p;

    // ~30Hz emit throttle (every ~33ms)
    const now = performance.now();
    if (now - lastEmitRef.current >= 33) {
      lastEmitRef.current = now;
      onDraw?.('draw:point', { x: p.x, y: p.y, dpr: p.dpr });
    }
  };

  const onPointerUp = () => {
    if (!drawing) return;
    setDrawing(false);
    lastRef.current = null;
    onDraw?.('draw:end', {});
  };

  // Imperative API for remote drawing (payload is logical coords)
  useImperativeHandle(ref, () => ({
    begin: ({ x, y }) => {
      lastRef.current = { x, y };
    },
    point: ({ x, y }) => {
      drawSegLogical(lastRef.current, { x, y });
      lastRef.current = { x, y };
    },
    end: () => {
      lastRef.current = null;
    },
    clear: () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      const rect = c.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    },
    /**
     * Week 3: snapshot the drawing layer as a compressed image (for Memories)
     */
    getSnapshot: (opts = {}) => {
      const { scale = 1, mime = 'image/jpeg', quality = 0.82, background = null } = opts;
      const src = canvasRef.current;
      if (!src) return null;

      // compute logical size (CSS pixels)
      const rect = src.getBoundingClientRect();
      const outW = Math.max(1, Math.floor(rect.width * scale));
      const outH = Math.max(1, Math.floor(rect.height * scale));

      // draw onto an offscreen canvas to control scale/flatten bg
      const off = document.createElement('canvas');
      off.width = outW;
      off.height = outH;
      const octx = off.getContext('2d');

      if (background) {
        octx.fillStyle = background;
        octx.fillRect(0, 0, outW, outH);
      }

      // draw the visible (logical) canvas content scaled to the export size
      octx.drawImage(src, 0, 0, outW, outH);

      try {
        return off.toDataURL(mime, mime === 'image/jpeg' ? quality : undefined);
      } catch {
        return off.toDataURL('image/png');
      }
    },
    /** Week 3: expose raw canvas for compositing */
    getCanvas: () => canvasRef.current || null,
  }), []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto block w-full h-full z-40"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    />
  );
});

export default CanvasLayer;