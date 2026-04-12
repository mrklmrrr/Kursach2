import { useEffect, useRef, useState } from 'react';

export default function VideoCall() {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const myVideoRef = useRef();
  const remoteVideoRef = useRef();
  const streamRef = useRef(null); // используем ref, чтобы избежать зависимости

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((userStream) => {
        streamRef.current = userStream;
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = userStream;
        }
      })
      .catch((err) => console.error('Ошибка доступа к медиа:', err));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // массив зависимостей пуст, так как streamRef стабилен

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => track.enabled = !cameraEnabled);
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => track.enabled = !micEnabled);
      setMicEnabled(!micEnabled);
    }
  };

  return (
    <div className="video-call-container">
      <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
      <video ref={myVideoRef} autoPlay muted playsInline className="self-video" />
      <div className="video-controls">
        <button onClick={toggleMic}>{micEnabled ? '🔊 Микрофон' : '🔇 Микрофон выкл'}</button>
        <button onClick={toggleCamera}>{cameraEnabled ? '📷 Камера' : '📷 Камера выкл'}</button>
      </div>
    </div>
  );
}