import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoCall } from '../../../components/features';
import { useAuth } from '../../../hooks/useAuth';
import PageLayout from '../../../components/layout/PageLayout/PageLayout';
import './VideoRoom.css';

export default function VideoRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [endSignal, setEndSignal] = useState(0);

  useEffect(() => {
    if (!isSessionStarted) return undefined;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionStarted]);

  const formatted = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const handlePeerJoinedChange = useCallback((joined) => {
    setIsSessionStarted(joined);
    if (joined) return;
    setElapsedSeconds(0);
  }, []);

  const handleEndCall = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleEndCallClick = () => {
    setEndSignal((prev) => prev + 1);
  };

  if (!roomId) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <div className="video-room-error">
            <p>Видео комната не найдена</p>
          </div>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Content>
        <div className="video-room-wrapper">
          <div className="video-room-header">
            <button type="button" className="video-room-end-btn" onClick={handleEndCallClick}>
              <span className="material-icons">call_end</span>
              Завершить
            </button>
            <div className="video-room-title-block">
              <div className="video-room-title">Видеоконсультация</div>
              <div className="video-room-subtitle">{user?.role === 'doctor' ? 'Кабинет врача' : 'Кабинет пациента'}</div>
            </div>
            <div className={`timer ${!isSessionStarted ? 'timer-waiting' : ''}`}>
              <span className="material-icons">schedule</span>
              {isSessionStarted ? formatted : 'Ожидание...'}
            </div>
          </div>

          <div className="video-room-content">
            <VideoCall
              roomId={roomId}
              onEndCall={handleEndCall}
              endSignal={endSignal}
              onPeerJoinedChange={handlePeerJoinedChange}
            />
          </div>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
