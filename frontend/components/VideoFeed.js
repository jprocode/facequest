// frontend/components/VideoFeed.js
import { useEffect, useRef } from 'react';

/**
 * VideoFeed
 * Props:
 *  - stream: MediaStream
 *  - className: optional Tailwind class
 *  - mirrored: boolean (default false)
 *  - showPlaceholder?: boolean (default false) -> shows avatar card instead of video
 */
export default function VideoFeed({ stream, className = '', mirrored = false, showPlaceholder = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream && !showPlaceholder) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showPlaceholder]);

  if (showPlaceholder) {
    return (
      <div className={`${className} grid place-items-center bg-linear-to-br from-rose-200/60 to-purple-200/60`}>
        <div className="w-20 h-20 rounded-full bg-white/90 shadow grid place-items-center">
          <span className="text-2xl">👤</span>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`${className} ${mirrored ? 'scale-x-[-1]' : ''}`}
    />
  );
}