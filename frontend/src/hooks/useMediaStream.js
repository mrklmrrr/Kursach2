import { useEffect, useRef, useState, useCallback } from 'react';

export function useMediaStream(options = { video: true, audio: true }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const getErrorMessage = (err) => {
      if (err.name === 'NotAllowedError') {
        return 'Доступ к камере/микрофону запрещен. Проверьте разрешения браузера.';
      } else if (err.name === 'NotFoundError') {
        return 'Камера или микрофон не найдены.';
      } else if (err.name === 'NotReadableError') {
        return 'Камера или микрофон заняты другим приложением.';
      } else if (err.name === 'OverconstrainedError') {
        return 'Камера не поддерживает запрошенные параметры.';
      }
      return err.message || 'Ошибка доступа к медиа устройствам';
    };

    const startMedia = async () => {
      try {
        // Try with advanced constraints first
        let userStream;
        try {
          userStream = await navigator.mediaDevices.getUserMedia(options);
        } catch (constraintErr) {
          // If constraints fail, try without them
          console.warn('Advanced constraints not supported, trying basic', constraintErr);
          userStream = await navigator.mediaDevices.getUserMedia({
            video: options.video ? true : false,
            audio: options.audio ? true : false
          });
        }
        
        if (mounted) {
          streamRef.current = userStream;
          setStream(userStream);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
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
  }, [options]);

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
