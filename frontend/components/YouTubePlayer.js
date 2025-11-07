// frontend/components/YouTubePlayer.js
import dynamic from 'next/dynamic';
import { forwardRef, useImperativeHandle, useRef } from 'react';

// Wrap react-youtube so we can expose a consistent control surface
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

const YouTubePlayer = forwardRef(function YouTubePlayer(
  { videoId, width = 360, height = 202, onReady, onPlay, onPause, onStateChange },
  ref
) {
  const playerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    playVideo: () => playerRef.current?.playVideo?.(),
    pauseVideo: () => playerRef.current?.pauseVideo?.(),
    seekTo: (t, allowSeekAhead = true) => playerRef.current?.seekTo?.(t, allowSeekAhead),
  }));

  return (
    <YouTube
      videoId={videoId}
      opts={{
        width: String(width),
        height: String(height),
        playerVars: { playsinline: 1, controls: 1, modestbranding: 1 },
      }}
      onReady={(e) => {
        playerRef.current = e.target;
        onReady?.(e);
      }}
      onPlay={onPlay}
      onPause={onPause}
      onStateChange={onStateChange}
    />
  );
});

export default YouTubePlayer;