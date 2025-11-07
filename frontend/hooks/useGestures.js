// Placeholder – wire MediaPipe later. Expose `lastGesture` state.
import { useState } from 'react';
export function useGestures(){
  const [lastGesture, setLastGesture] = useState(null);
  return { lastGesture, setLastGesture };
}
