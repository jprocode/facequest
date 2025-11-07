// frontend/hooks/useMusicSync.js
// Placeholder progressive API for future host/guest negotiation.
// For Week 2, the MusicHUD already manages broadcasting + drift correction.
export function useMusicSync() {
  return {
    isHost: true,
    state: { playing: false, currentTime: 0, url: '', videoId: '' },
    // no-ops for now; MusicHUD calls sendMusicState directly
    setUrl: () => {},
    play: () => {},
    pause: () => {},
    seek: () => {},
  };
}