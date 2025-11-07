// Placeholder for ICE server config provider; return STUN only for local dev.
export function getIceServers(){
  return [{ urls: 'stun:stun.l.google.com:19302' }];
}