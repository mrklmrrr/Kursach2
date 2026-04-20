import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

export function useWebRTC(roomId, userRole, token) {
  const config = {
    apiBase: 'http://localhost:5000'
  };

  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef();
  const peerConnectionRef = useRef();
  const localStreamRef = useRef();

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  useEffect(() => {
    if (!roomId || !token) return;

    // Init socket
    socketRef.current = io(config.apiBase, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('WebRTC socket connected');
      socketRef.current.emit('join-video-room', roomId);
    });

    socketRef.current.on('room-joined', (data) => {
      setRoomStatus(data.status);
      setIsConnected(true);
      setError(null);
      initPeerConnection(data.iceServers || iceServers);
    });

    socketRef.current.on('webrtc-offer', handleOffer);
    socketRef.current.on('webrtc-answer', handleAnswer);
    socketRef.current.on('webrtc-ice-candidate', handleCandidate);
    socketRef.current.on('participant-joined', ({ userId, role }) => {
      console.log('Participant joined:', userId, role);
    });
    socketRef.current.on('participant-left', ({ userId }) => {
      console.log('Participant left:', userId);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    });
    socketRef.current.on('video-error', (err) => {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Неизвестная ошибка');
      setError(errorMsg);
      setIsConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, token]);

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
  }, [roomId]);

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

  const handleOffer = useCallback(async (data) => {
    if (!peerConnectionRef.current || peerConnectionRef.current.remoteDescription) return;

    await peerConnectionRef.current.setRemoteDescription(data.offer);
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
  }, []);

  const handleCandidate = useCallback(async (data) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.addIceCandidate(data.candidate);
  }, []);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
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
    error,
    peerConnection: peerConnectionRef.current,
    createOffer,
    leaveRoom,
    setLocalStream
  };
}

