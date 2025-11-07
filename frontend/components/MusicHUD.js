// frontend/components/MusicHUD.js
import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getJSON, setJSON } from '../utils/storage';

// Client-only YouTube player
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

export default function MusicHUD({
  enabled = true,
  role = 'host',
  sendMusicState,
  onMusicEvent,
}) {
  // 1) Hooks are ALWAYS declared in the same order, every render
  const [mounted, setMounted] = useState(false);

  const [url, setUrl] = useState('');          // init empty; hydrate later
  const [videoId, setVideoId] = useState('');  // init empty; hydrate later
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [driftMs, setDriftMs] = useState(0);
  const [loadError, setLoadError] = useState(null);

  const playerRef = useRef(null);
  const tickRef = useRef(null);

  // 2) Mount flag (safe)
  useEffect(() => { setMounted(true); }, []);

  // 3) Load from storage ONLY after mount (prevents SSR mismatch)
  useEffect(() => {
    if (!mounted) return;
    const saved = getJSON('fq.music.url') || '';
    setUrl(saved);
    setVideoId(extractYouTubeId(saved));
  }, [mounted]);

  // 4) Persist URL when it changes (client only)
  useEffect(() => {
    if (!mounted) return;
    setJSON('fq.music.url', url);
  }, [mounted, url]);

  // 5) Subscribe to RTC music messages
  useEffect(() => {
    if (!mounted || !onMusicEvent) return;
    const off = onMusicEvent((msg) => {
      if (!msg || msg.type !== 'music:state') return;
      const { url: u, videoId: vid, playing: p, time } = msg;

      if (typeof u === 'string' && u && u !== url) {
        setUrl(u);
        setVideoId(extractYouTubeId(u));
      } else if (typeof vid === 'string' && vid && vid !== videoId) {
        setVideoId(vid);
      }

      if (playerRef.current && typeof time === 'number') {
        try {
          const ct = playerRef.current.getCurrentTime?.() ?? 0;
          const delta = Math.abs(ct - time);
          setDriftMs(Math.round(delta * 1000));
          if (delta > 0.4) playerRef.current.seekTo(time, true);
        } catch { }
      }

      if (typeof p === 'boolean') {
        setPlaying(p);
        try {
          if (playerRef.current) {
            if (p) playerRef.current.playVideo?.();
            else playerRef.current.pauseVideo?.();
          }
        } catch { }
      }
    });
    return () => off?.();
  }, [mounted, onMusicEvent, url, videoId]);

  // 6) Periodic broadcast while playing
  useEffect(() => {
    if (!mounted || !sendMusicState || !ready || !playing || !playerRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      try {
        const time = playerRef.current.getCurrentTime?.() ?? 0;
        sendMusicState({ type: 'music:state', url, videoId, playing: true, time });
      } catch { }
    }, 3000);
    return () => { clearInterval(tickRef.current); tickRef.current = null; };
  }, [mounted, sendMusicState, ready, playing, url, videoId]);

  // 7) Helpers
  const notify = useCallback((next) => {
    if (!sendMusicState) return;
    const t = typeof next.time === 'number'
      ? next.time
      : (playerRef.current?.getCurrentTime?.() ?? 0);
    sendMusicState({ type: 'music:state', url, videoId, playing: !!next.playing, time: t });
  }, [sendMusicState, url, videoId]);

  const onReady = (e) => { playerRef.current = e.target; setReady(true); setLoadError(null); };
  const onPlay = () => { setPlaying(true); notify({ playing: true }); };
  const onPause = () => { setPlaying(false); notify({ playing: false }); };
  const onStateChange = () => { };
  const onError = () => { setLoadError('Load failed. Check the link and try again.'); };

  const handleLoad = (e) => {
    e.preventDefault();
    setLoadError(null);
    const vid = extractYouTubeId(url);
    setVideoId(vid);
    notify({ playing, time: playerRef.current?.getCurrentTime?.() ?? 0 });
  };

  const handleSeek = async (dir) => {
    if (!playerRef.current) return;
    const cur = playerRef.current.getCurrentTime?.() ?? 0;
    const next = Math.max(0, cur + dir);
    playerRef.current.seekTo(next, true);
    notify({ playing, time: next });
  };

  // 8) Only then decide to render nothing (after all hooks ran)
  if (!mounted || !enabled) return null;

  const opts = {
    width: '360',
    height: '202',
    playerVars: { playsinline: 1, controls: 1, modestbranding: 1 },
  };

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/75 backdrop-blur rounded-2xl px-4 py-3 shadow z-40 w-[380px]"
      suppressHydrationWarning
    >
      <div className="text-sm mb-2 flex items-center justify-between">
        <span>🎶 Music Together {role === 'host' ? '(Host)' : '(Guest)'}</span>
        <span className="text-xs text-gray-500">
          {ready ? (driftMs > 400 ? `Syncing… (${driftMs}ms)` : 'Synced') : 'Loading…'}
        </span>
      </div>
      {/* Mini visualizer */}
      <MiniViz playing={playing} />

      <form onSubmit={handleLoad} className="flex gap-2 mb-2">
        <input
          className="flex-1 border rounded-lg px-2 py-1 text-sm"
          placeholder="Paste YouTube link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="px-2 py-1 rounded bg-white text-sm border" type="submit">Load</button>
      </form>

      {loadError && <p className="text-xs text-rose-600 mb-1">{loadError}</p>}

      {videoId ? (
        <div className="rounded-xl overflow-hidden">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
            onStateChange={onStateChange}
            onError={onError}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded bg-white border" onClick={() => handleSeek(-5)} type="button" title="Back 5s">⟲ 5s</button>
              <button className="px-2 py-1 rounded bg-white border" onClick={() => handleSeek(+5)} type="button" title="Forward 5s">⟳ 5s</button>
            </div>
            <div className="flex gap-2">
              {!playing ? (
                <button className="px-2 py-1 rounded bg-white border" onClick={onPlay} type="button" title="Play">▶</button>
              ) : (
                <button className="px-2 py-1 rounded bg-white border" onClick={onPause} type="button" title="Pause">⏸</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600">Paste a YouTube URL to start.</p>
      )}
    </div>
  );
}

function extractYouTubeId(link) {
  if (!link) return '';
  try {
    const u = new URL(link);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v'); if (v) return v;
      const m = u.pathname.match(/\/embed\/([^/]+)/); if (m) return m[1];
    }
  } catch { }
  if (/^[\w-]{6,}$/.test(link)) return link;
  return '';
}

function MiniViz({ playing }) {
  const [levels, setLevels] = useState([0.2, 0.4, 0.3, 0.5, 0.35]);

  useEffect(() => {
    let raf;
    const animate = (t) => {
      const base = playing ? 0.55 : 0.28;
      const amp = playing ? 0.35 : 0.08;
      const next = levels.map((_, i) => {
        const phase = (t / 500) + i * 0.6;
        return Math.max(0.05, Math.min(1, base + Math.sin(phase) * amp));
      });
      setLevels(next);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <div className="flex items-end gap-1 h-4 mb-2">
      {levels.map((lv, i) => (
        <div
          key={i}
          style={{ height: `${Math.round(lv * 16)}px` }}
          className="w-1.5 bg-black/30 rounded-sm"
        />
      ))}
    </div>
  );
}