import { useEffect, useMemo, useRef } from 'react';
import { useMediaStream } from '../../../hooks/useMediaStream';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { useAuth } from '../../../hooks/useAuth';
import './VideoCall.css';

export default function VideoCall({ roomId, onEndCall, endSignal = 0, onPeerJoinedChange = null }) {
  const { token, user } = useAuth();
  const mediaOptions = useMemo(() => ({ video: true, audio: true }), []);
  const { stream, error, isCameraOn, isMicOn, toggleCamera, toggleMic } =
    useMediaStream(mediaOptions);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isDoctor = user?.role === 'doctor';
  const {
    remoteStream,
    isConnected,
    hasPeerJoined,
    error: rtcError,
    leaveRoom,
    setLocalStream
  } = useWebRTC(roomId, token, isDoctor, onEndCall);

  useEffect(() => {
    if (stream && myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
      setLocalStream(stream);
    }
  }, [stream, setLocalStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    leaveRoom(true);
    if (onEndCall) onEndCall();
  };

  useEffect(() => {
    if (typeof onPeerJoinedChange === 'function') {
      onPeerJoinedChange(hasPeerJoined);
    }
  }, [hasPeerJoined, onPeerJoinedChange]);

  useEffect(() => {
    if (endSignal > 0) {
      handleEndCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endSignal]);

  return (
    <div className="video-call-container">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="remote-video"
      />

      <video
        ref={myVideoRef}
        autoPlay
        muted
        playsInline
        className="self-video"
      />

      {!isConnected && (
        <div className="status-bar">Подключение к звонку...</div>
      )}

      {!remoteStream && (
        <div className="remote-placeholder">
          <span className="material-icons">videocam_off</span>
          <p>{hasPeerJoined ? 'Устанавливаем видео-соединение...' : 'Ожидание подключения второго участника...'}</p>
        </div>
      )}

      {(error || rtcError) && (
        <div className="video-error">
          {error || rtcError}
        </div>
      )}

      <div className="video-controls">
        <button
          className={`control-btn ${!isMicOn ? 'disabled' : ''}`}
          onClick={toggleMic}
          title={isMicOn ? 'Выключить микрофон' : 'Включить микрофон'}
        >
          <span className="material-icons">{isMicOn ? 'mic' : 'mic_off'}</span>
        </button>
        <button
          className={`control-btn ${!isCameraOn ? 'disabled' : ''}`}
          onClick={toggleCamera}
          title={isCameraOn ? 'Выключить камеру' : 'Включить камеру'}
        >
          <span className="material-icons">{isCameraOn ? 'videocam' : 'videocam_off'}</span>
        </button>
        <button
          className="control-btn end-call"
          onClick={handleEndCall}
          title="Завершить звонок"
        >
          <span className="material-icons">call_end</span>
        </button>
      </div>
    </div>
  );
}
