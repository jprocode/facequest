// frontend/hooks/useRTC.js
import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

export function useRTC(roomId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // device controls / errors
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  // NEW: reflect datachannel connectivity for UI
  const [peerConnected, setPeerConnected] = useState(false); // NEW
  const [isInitiator, setIsInitiator] = useState(null); // Track if we're host (true) or guest (false)

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const activeRoomRef = useRef(null);

  const dataHandlersRef = useRef(new Set());
  const musicHandlersRef = useRef(new Set());
  const pendingSignalsRef = useRef([]);

  const REACT_MAX_PER_SEC = 8;
  const reactWindowRef = useRef({ windowStart: 0, count: 0 });

  const applyTrackStates = useCallback((stream, { mic, cam }) => {
    if (!stream) return;
    try {
      const a = stream.getAudioTracks();
      const v = stream.getVideoTracks();
      if (a[0]) a[0].enabled = !!mic;
      if (v[0]) v[0].enabled = !!cam;
    } catch {}
  }, []);

  const send = useCallback((obj) => {
    try {
      if (peerRef.current && peerRef.current.connected) {
        peerRef.current.send(JSON.stringify(obj));
      }
    } catch {}
  }, []);

  // NEW: generic message sender (for games or any future channel messages)
  const sendMessage = useCallback((obj) => {
    send(obj);
  }, [send]);

  const onData = useCallback((fn) => {
    dataHandlersRef.current.add(fn);
    return () => dataHandlersRef.current.delete(fn);
  }, []);

  const onMusicEvent = useCallback((fn) => {
    musicHandlersRef.current.add(fn);
    return () => musicHandlersRef.current.delete(fn);
  }, []);

  const sendDraw = useCallback(
    (type, payload) => { send({ type, payload }); },
    [send]
  );

  const sendStroke = useCallback(
    (seg) => send({ type: 'draw:point', payload: seg }),
    [send]
  );

  const sendReaction = useCallback(
    (emojiType) => {
      const now = Date.now();
      const bucket = reactWindowRef.current;
      if (bucket.windowStart === 0 || now - bucket.windowStart >= 1000) {
        bucket.windowStart = now;
        bucket.count = 0;
      }
      if (bucket.count >= REACT_MAX_PER_SEC) return;
      bucket.count += 1;
      send({ type: 'reaction', emoji: emojiType });
    },
    [send]
  );

  const sendMusicState = useCallback(
    (state) => {
      if (!state) return;
      if (state.type === 'music:state') send(state);
      else {
        const { url, videoId, playing, time } = state;
        send({ type: 'music:state', url, videoId, playing, time });
      }
    },
    [send]
  );

  const setMic = useCallback((enabled) => {
    setMicOn(Boolean(enabled));
    if (localStreamRef.current) applyTrackStates(localStreamRef.current, { mic: enabled, cam: camOn });
  }, [camOn, applyTrackStates]);

  const setCam = useCallback((enabled) => {
    setCamOn(Boolean(enabled));
    if (localStreamRef.current) applyTrackStates(localStreamRef.current, { mic: micOn, cam: enabled });
  }, [micOn, applyTrackStates]);

  useEffect(() => {
    if (!roomId) return;
    if (activeRoomRef.current === roomId) return;

    activeRoomRef.current = roomId;
    let stopped = false;
    const myRoom = roomId;

    (async () => {
      // 1) Start media request, but DON'T block peer creation on it
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((media) => {
          if (stopped || activeRoomRef.current !== myRoom) return;
          localStreamRef.current = media;
          setLocalStream(media);
          applyTrackStates(media, { mic: micOn, cam: camOn });

          // If peer already exists, add tracks now (important!)
          if (peerRef.current && media) {
            try {
              media.getTracks().forEach(t => peerRef.current.addTrack(t, media));
            } catch {}
          }
        })
        .catch((err) => {
          if (stopped || activeRoomRef.current !== myRoom) return;
          setMediaError(err?.message || 'Failed to access camera/microphone');
        });

      // 2) Setup signaling immediately (don’t wait for media)
      const url = process.env.NEXT_PUBLIC_SIGNALING_URL;
      const socket = io(url, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (activeRoomRef.current !== myRoom) return;
        socket.emit('room:join', { roomId: myRoom });
      });

      socket.on('rtc:role', ({ initiator }) => {
        if (activeRoomRef.current !== myRoom) return;
        if (peerRef.current) return;

        // Store role for game logic
        setIsInitiator(initiator);

        // IMPORTANT: Create peer WITHOUT the stream to avoid race.
        const peer = new Peer({
          initiator,
          trickle: true,
          // stream: OMITTED ON PURPOSE
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });
        wirePeer(peer, myRoom);

        // If media is already available, add it now
        if (localStreamRef.current) {
          try {
            localStreamRef.current.getTracks().forEach(t => peer.addTrack(t, localStreamRef.current));
          } catch {}
        }
      });

      socket.on('rtc:peer-joined', () => {
        if (activeRoomRef.current !== myRoom) return;
        // no-op; useful for logs if you want
      });

      socket.on('signal', ({ data }) => {
        if (activeRoomRef.current !== myRoom) return;
        if (!peerRef.current) {
          pendingSignalsRef.current.push(data);
          return;
        }
        try { peerRef.current.signal(data); } catch {}
      });
    })();

    function wirePeer(peer, room) {
      peerRef.current = peer;

      peer.on('signal', (data) => {
        if (activeRoomRef.current !== room) return;
        socketRef.current?.emit('signal', { roomId: room, data });
      });

      peer.on('stream', (s) => {
        if (activeRoomRef.current !== room) return;
        setRemoteStream(s);
      });

      peer.on('connect', () => {
        if (activeRoomRef.current !== room) return;
        setPeerConnected(true); // NEW: reflect connected state
      });

      // ---------- robust message parsing ----------
      peer.on('data', (buf) => {
        if (activeRoomRef.current !== room) return;
        try {
          let text;
          if (typeof buf === 'string') {
            text = buf;
          } else if (buf && typeof buf.byteLength === 'number') {
            text = new TextDecoder().decode(buf);
          } else {
            text = String(buf);
          }
          const msg = JSON.parse(text);

          if (msg?.type === 'music:state') {
            for (const fn of musicHandlersRef.current) fn(msg);
          }
          for (const fn of dataHandlersRef.current) fn(msg);
        } catch {
          // swallow parse errors to avoid killing the data channel
        }
      });
      // -------------------------------------------

      while (pendingSignalsRef.current.length) {
        try { peer.signal(pendingSignalsRef.current.shift()); } catch {}
      }

      peer.on('close', () => {
        if (activeRoomRef.current !== room) return;
        setPeerConnected(false); // NEW
      });

      peer.on('error', () => {
        if (activeRoomRef.current !== room) return;
        // keep UI simple; you can set error state if desired
      });
    }

    return () => {
      stopped = true;
      if (activeRoomRef.current === myRoom) {
        activeRoomRef.current = null;
        socketRef.current?.disconnect();
        peerRef.current?.destroy();
        socketRef.current = null;
        peerRef.current = null;
        pendingSignalsRef.current = [];
        setPeerConnected(false); // NEW
        // We intentionally keep localStream alive for the PiP; stop here if you want.
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, micOn, camOn, applyTrackStates]);

  // If track flags change after stream exists, re-apply
  useEffect(() => {
    if (localStreamRef.current) applyTrackStates(localStreamRef.current, { mic: micOn, cam: camOn });
  }, [micOn, camOn, applyTrackStates]);

  return {
    localStream,
    remoteStream,
    micOn,
    camOn,
    mediaError,
    setMic,
    setCam,
    // NEW
    peerConnected, // expose for UI state
    isInitiator, // true = host, false = guest, null = not connected yet
    // drawing
    sendDraw,
    sendStroke,
    // reactions
    sendReaction,
    // music
    sendMusicState,
    onMusicEvent,
    // generic
    onData,
    sendMessage, // NEW: generic sender for games/others
  };
}