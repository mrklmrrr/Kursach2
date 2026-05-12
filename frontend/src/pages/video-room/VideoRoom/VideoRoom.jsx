import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { VideoCall } from '../../../components/features';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastProvider/useToast';
import PageLayout from '../../../components/layout/PageLayout/PageLayout';
import { videoRoomApi } from '../../../services/videoRoomApi';
import { ROUTES } from '../../../constants';
import './VideoRoom.css';

export default function VideoRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [prep, setPrep] = useState({ loading: true, error: null });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [endSignal, setEndSignal] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState(null);
  const startedAtRef = useRef(null);

  const consultationId = String(location.state?.consultationId || roomId || '').trim();

  useEffect(() => {
    if (!roomId || !consultationId) return undefined;

    let cancelled = false;
    let pollIv;

    const readStartedFromInfo = (infoBody) => {
      const room = infoBody?.data ?? infoBody;
      const sa = room?.startedAt;
      if (!sa) return null;
      const ms = new Date(sa).getTime();
      return Number.isNaN(ms) ? null : ms;
    };

    (async () => {
      setPrep({ loading: true, error: null });
      startedAtRef.current = null;
      setStartedAtMs(null);
      try {
        await videoRoomApi.createRoom(consultationId);
        await videoRoomApi.joinRoom(roomId);
        const info = await videoRoomApi.getRoomInfo(roomId);
        const ms = readStartedFromInfo(info);
        if (ms != null) {
          startedAtRef.current = ms;
          if (!cancelled) setStartedAtMs(ms);
        }
        if (!cancelled) setPrep({ loading: false, error: null });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Ошибка подготовки видео';
        if (!cancelled) {
          setPrep({ loading: false, error: msg });
          showToast(msg, 'error');
        }
      }
    })();

    pollIv = window.setInterval(async () => {
      if (cancelled || startedAtRef.current != null) return;
      try {
        const info = await videoRoomApi.getRoomInfo(roomId);
        const ms = readStartedFromInfo(info);
        if (ms != null) {
          startedAtRef.current = ms;
          if (!cancelled) setStartedAtMs(ms);
        }
      } catch {
        /* ignore */
      }
    }, 1000);

    return () => {
      cancelled = true;
      if (pollIv) window.clearInterval(pollIv);
    };
  }, [roomId, consultationId, showToast]);

  useEffect(() => {
    if (startedAtMs == null) {
      setElapsedSeconds(0);
      return undefined;
    }
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAtMs]);

  const formatted = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const handleEndCall = () => {
    if (consultationId) {
      navigate(ROUTES.CHAT_ROOM(consultationId), { replace: true });
    } else {
      navigate(ROUTES.CHATS);
    }
  };

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

  if (prep.error) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <div className="video-room-error">
            <p>{prep.error}</p>
            <button type="button" className="video-room-end-btn" onClick={() => navigate(consultationId ? ROUTES.CHAT_ROOM(consultationId) : ROUTES.CHATS)}>
              В чат
            </button>
          </div>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  const callLive = startedAtMs != null;

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
            <div className={`timer ${!callLive ? 'timer-waiting' : ''}`}>
              <span className="material-icons">schedule</span>
              {prep.loading ? 'Подключение…' : callLive ? formatted : 'Ожидание…'}
            </div>
          </div>

          <div className="video-room-content">
            {!prep.loading && (
              <VideoCall
                roomId={roomId}
                onEndCall={handleEndCall}
                endSignal={endSignal}
              />
            )}
          </div>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
