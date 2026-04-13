import { useEffect, useRef, useState, useCallback } from 'react';

export function useMediaStream(options = { video: true, audio: true }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startMedia = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia(options);
        if (mounted) {
          streamRef.current = userStream;
          setStream(userStream);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          console.error('Ошибка доступа к камере/микрофону:', err);
        }
      }
    };

    startMedia();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [options.video, options.audio]);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn((prev) => !prev);
    }
  }, [isCameraOn]);

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicOn;
      });
      setIsMicOn((prev) => !prev);
    }
  }, [isMicOn]);

  return {
    stream,
    error,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    streamRef,
  };
}
