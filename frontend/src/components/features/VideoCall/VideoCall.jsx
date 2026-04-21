import { useEffect, useMemo, useRef } from 'react';
import { useMediaStream } from '../../../hooks/useMediaStream';
import './VideoCall.css';

export default function VideoCall() {
  const mediaOptions = useMemo(() => ({ video: true, audio: true }), []);
  const { stream, error, isCameraOn, isMicOn, toggleCamera, toggleMic } =
    useMediaStream(mediaOptions);
  const myVideoRef = useRef(null);

  useEffect(() => {
    if (stream && myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-call-container">
      <video
        autoPlay
        playsInline
        className="remote-video"
        poster="https://via.placeholder.com/1280x720/1e2937/64748b?text=Врач+на+связи"
      />

      <video
        ref={myVideoRef}
        autoPlay
        muted
        playsInline
        className="self-video"
      />

      {error && (
        <div className="video-error">
          Нет доступа к камере/микрофону
        </div>
      )}

      <div className="video-controls">
        <button
          className={`control-btn ${!isMicOn ? 'disabled' : ''}`}
          onClick={toggleMic}
        >
          {isMicOn ? '🎤' : '🎤❌'}
        </button>
        <button
          className={`control-btn ${!isCameraOn ? 'disabled' : ''}`}
          onClick={toggleCamera}
        >
          {isCameraOn ? '📷' : '📷❌'}
        </button>
      </div>
    </div>
  );
}
