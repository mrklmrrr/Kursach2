import { useParams, useNavigate } from 'react-router-dom';
import { useTimer } from '../../../hooks/useTimer';
import { VideoCall } from '../../../components/features';
import { useAuth } from '../../../hooks/useAuth';
import PageLayout from '../../../components/layout/PageLayout/PageLayout';
import './VideoRoom.css';

export default function VideoRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { formatted } = useTimer(3600, () => {
    // Timer ended - 1 hour max
  });

  const handleEndCall = () => {
    navigate(-1);
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
            <button type="button" className="video-room-end-btn" onClick={handleEndCall}>
              <span className="material-icons">call_end</span>
              Завершить
            </button>
            <div className="video-room-title-block">
              <div className="video-room-title">Видеоконсультация</div>
              <div className="video-room-subtitle">{user?.role === 'doctor' ? 'Кабинет врача' : 'Кабинет пациента'}</div>
            </div>
            <div className="timer">
              <span className="material-icons">schedule</span>
              {formatted}
            </div>
          </div>

          <div className="video-room-content">
            <VideoCall roomId={roomId} onEndCall={handleEndCall} />
          </div>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
