import { useEffect, useRef, useState } from 'react';
import { useMediaStream } from '../../../hooks/useMediaStream';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { useAuth } from '../../../hooks/useAuth';
import './VideoCall.css';

export default function VideoCall({ roomId, onEndCall }) {
  const { token, user } = useAuth();
  const { stream, error: mediaError, isCameraOn, isMicOn, toggleCamera, toggleMic } =
    useMediaStream({ 
      video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
      audio: true 
    });
  const { 
    isConnected, 
    remoteStream, 
    roomStatus, 
    error: webrtcError, 
    createOffer,
    leaveRoom,
    setLocalStream
  } = useWebRTC(roomId, user?.role, token);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    if (user?.role === 'doctor') {
      setIsDoctor(true);
      // Doctor creates offer
      const timer = setTimeout(() => {
        if (isConnected && !remoteStream) createOffer();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, createOffer, user?.role, remoteStream]);

  useEffect(() => {
    if (stream && myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
      // Pass local stream to WebRTC
      setLocalStream(stream);
    }
  }, [stream, setLocalStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    leaveRoom();
    onEndCall?.();
  };

  const errorMsg = mediaError || webrtcError;
  const statusText = !isConnected ? 'Подключение...' : roomStatus === 'active' ? 'В эфире' : roomStatus || 'Ожидание';

  return (
    <div className="video-call-container">
      <div className="status-bar">
        <span className={`status-indicator ${isConnected ? 'connected' : 'connecting'}`}>
          {statusText}
        </span>
      </div>

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="remote-video"
        poster={isConnected ? undefined : "https://via.placeholder.com/1280x720/1e2937/64748b?text=Подключение..."}
      />

      <video
        ref={myVideoRef}
        autoPlay
        muted
        playsInline
        className="self-video"
      />

      {errorMsg && (
        <div className="video-error">
          {typeof errorMsg === 'string' ? errorMsg : 'Ошибка при подключении'}
        </div>
      )}

      <div className="video-controls">
        <button
          className={`control-btn ${!isMicOn ? 'disabled' : ''}`}
          onClick={toggleMic}
          title="Микрофон"
        >
          {isMicOn ? '🎤' : '🎤❌'}
        </button>
        <button
          className={`control-btn ${!isCameraOn ? 'disabled' : ''}`}
          onClick={toggleCamera}
          title="Камера"
        >
          {isCameraOn ? '📷' : '📷❌'}
        </button>
        <button 
          className="control-btn end-call" 
          onClick={handleEndCall}
          title="Завершить"
        >
          <span className="material-icons">call_end</span>
        </button>
      </div>
    </div>
  );
}

