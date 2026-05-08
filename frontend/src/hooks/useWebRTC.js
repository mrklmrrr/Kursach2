import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { chatApi } from '../services/chatApi';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export function useWebRTC(roomId, token, shouldCreateOffer = false, onCallEnded = null) {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [hasPeerJoined, setHasPeerJoined] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef();
  const peerConnectionRef = useRef();
  const localStreamRef = useRef();
  const creatingOfferRef = useRef(false);
  const endedRef = useRef(false);
  const onCallEndedRef = useRef(onCallEnded);
  const pendingIceCandidatesRef = useRef([]);
  const hasPeerJoinedRef = useRef(false);

  useEffect(() => {
    onCallEndedRef.current = onCallEnded;
  }, [onCallEnded]);

  const markPeerJoined = useCallback(() => {
    if (hasPeerJoinedRef.current) return;
    hasPeerJoinedRef.current = true;
    setHasPeerJoined(true);
  }, []);

  const cleanupConnection = useCallback((stopLocalTracks = false) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (stopLocalTracks && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
    setIsConnected(false);
    setHasPeerJoined(false);
    hasPeerJoinedRef.current = false;
    pendingIceCandidatesRef.current = [];
  }, []);

  const initPeerConnection = useCallback((iceServersConfig) => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersConfig,
      iceCandidatePoolSize: 10
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      markPeerJoined();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('webrtc-ice-candidate', {
          roomId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('PC state:', pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE state:', pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
  }, [roomId, markPeerJoined]);

  const handleOffer = useCallback(async (data) => {
    if (!peerConnectionRef.current || peerConnectionRef.current.remoteDescription) return;

    await peerConnectionRef.current.setRemoteDescription(data.offer);
    if (pendingIceCandidatesRef.current.length > 0) {
      const pending = [...pendingIceCandidatesRef.current];
      pendingIceCandidatesRef.current = [];
      await Promise.allSettled(pending.map((candidate) => peerConnectionRef.current.addIceCandidate(candidate)));
    }
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socketRef.current.emit('webrtc-answer', {
      roomId,
      answer
    });
  }, [roomId]);

  const handleAnswer = useCallback(async (data) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(data.answer);
    if (pendingIceCandidatesRef.current.length > 0) {
      const pending = [...pendingIceCandidatesRef.current];
      pendingIceCandidatesRef.current = [];
      await Promise.allSettled(pending.map((candidate) => peerConnectionRef.current.addIceCandidate(candidate)));
    }
  }, []);

  const handleCandidate = useCallback(async (data) => {
    if (!peerConnectionRef.current) return;
    if (!peerConnectionRef.current.remoteDescription) {
      pendingIceCandidatesRef.current.push(data.candidate);
      return;
    }
    await peerConnectionRef.current.addIceCandidate(data.candidate);
  }, []);

  const sendOffer = useCallback(async () => {
    if (!peerConnectionRef.current || creatingOfferRef.current) return;
    creatingOfferRef.current = true;
    try {
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit('webrtc-offer', { roomId, offer });
    } finally {
      creatingOfferRef.current = false;
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !token) return;

    socketRef.current = io(chatApi.getBackendOrigin(), {
      auth: { token },
      // Keep WebRTC signaling isolated from chat socket manager.
      forceNew: true,
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 800,
      timeout: 10000
    });

    socketRef.current.on('connect', () => {
      console.log('WebRTC socket connected');
      socketRef.current.emit('join-video-room', roomId);
    });

    socketRef.current.on('room-joined', async (data) => {
      setRoomStatus(data.status);
      setIsConnected(true);
      setError(null);
      const activeParticipants = Array.isArray(data.participants)
        ? data.participants.filter((participant) => !participant?.leftAt)
        : [];
      if (activeParticipants.length >= 2 || data.status === 'active') {
        markPeerJoined();
      }
      initPeerConnection(data.iceServers || DEFAULT_ICE_SERVERS);

      if (shouldCreateOffer) {
        try {
          await sendOffer();
        } catch {
          setError('Не удалось инициализировать звонок');
        }
      }
    });

    socketRef.current.on('webrtc-offer', handleOffer);
    socketRef.current.on('webrtc-answer', handleAnswer);
    socketRef.current.on('webrtc-ice-candidate', handleCandidate);
    socketRef.current.on('participant-joined', ({ userId, role }) => {
      console.log('Participant joined:', userId, role);
      markPeerJoined();
      if (shouldCreateOffer && peerConnectionRef.current && !peerConnectionRef.current.remoteDescription) {
        sendOffer().catch(() => {
          setError('Не удалось начать трансляцию');
        });
      }
    });
    socketRef.current.on('participant-left', ({ userId }) => {
      console.log('Participant left:', userId);
      const wasAlreadyEnded = endedRef.current;
      endedRef.current = true;
      cleanupConnection();
      if (!wasAlreadyEnded && typeof onCallEndedRef.current === 'function') {
        onCallEndedRef.current();
      }
    });
    socketRef.current.on('video-call-ended', () => {
      if (endedRef.current) return;
      endedRef.current = true;
      cleanupConnection(true);
      if (typeof onCallEndedRef.current === 'function') {
        onCallEndedRef.current();
      }
    });
    socketRef.current.on('video-error', (err) => {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Неизвестная ошибка');
      setError(errorMsg);
      setIsConnected(false);
    });

    return () => {
      // Do not emit leave on cleanup: React StrictMode remount in dev would
      // otherwise produce false "participant-left" events.
      socketRef.current?.off();
      socketRef.current?.disconnect();
      cleanupConnection(true);
    };
  }, [roomId, token, shouldCreateOffer, initPeerConnection, handleOffer, handleAnswer, handleCandidate, sendOffer, cleanupConnection, markPeerJoined]);

  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) return;
    
    const offer = await peerConnectionRef.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await peerConnectionRef.current.setLocalDescription(offer);
    
    socketRef.current.emit('webrtc-offer', {
      roomId,
      offer
    });
  }, [roomId]);

  const leaveRoom = useCallback((endForAll = false) => {
    if (socketRef.current) {
      if (endForAll) {
        endedRef.current = true;
        socketRef.current.emit('end-video-call', { roomId });
      }
      socketRef.current.emit('leave-video-room', roomId);
    }
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsConnected(false);
    setRemoteStream(null);
    setHasPeerJoined(false);
    hasPeerJoinedRef.current = false;
  }, [roomId]);

  const setLocalStream = useCallback((stream) => {
    if (!stream) return;
    
    localStreamRef.current = stream;
    
    // Add tracks to peer connection if it exists
    if (peerConnectionRef.current) {
      stream.getTracks().forEach(track => {
        // Check if track already added
        const senders = peerConnectionRef.current.getSenders();
        const isDuplicate = senders.some(s => s.track === track);
        if (!isDuplicate) {
          peerConnectionRef.current.addTrack(track, stream);
        }
      });
    }
  }, []);

  return {
    isConnected,
    remoteStream,
    roomStatus,
    hasPeerJoined,
    error,
    createOffer,
    leaveRoom,
    setLocalStream
  };
}

