import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialSeconds = 0, onEnd = null) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive || seconds <= 0) {
      if (seconds <= 0 && onEnd) {
        onEnd();
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, seconds, onEnd]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback((newSeconds = 0) => {
    setSeconds(newSeconds);
    setIsActive(false);
  }, []);

  const formatTime = (totalSeconds) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return {
    seconds,
    isActive,
    start,
    pause,
    reset,
    formatted: formatTime(seconds),
  };
}
