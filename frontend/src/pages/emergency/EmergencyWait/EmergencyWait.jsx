import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, BottomNav, UserSidebar } from '../../../components/layout';
import { Button } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastProvider/useToast';
import { emergencyRequestApi } from '../../../services/emergencyRequestApi';
import { createEmergencyRequestOnce } from '../../../utils/emergencyRequestSingleton';
import { getChatSocket } from '../../../services/chatSocket';
import { ROUTES } from '../../../constants';
import '../Emergency/Emergency.css';
import './EmergencyWait.css';

export default function EmergencyWait() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const navigatedToVideoRef = useRef(false);

  const navigateToVideo = useCallback(
    (consultationId) => {
      const cid = consultationId != null ? String(consultationId).trim() : '';
      if (!cid || navigatedToVideoRef.current) return;
      navigatedToVideoRef.current = true;
      navigate(`/video-room/${cid}`, { replace: true, state: { consultationId: cid } });
    },
    [navigate]
  );

  const applyDto = useCallback((dto) => {
    if (!dto) {
      setCurrent(null);
      return;
    }
    setCurrent({
      id: dto.id,
      status: dto.status,
      expiresAt: dto.expiresAt,
      consultationId: dto.consultationId,
      doctorName: dto.doctorName,
      patientName: dto.patientName
    });
  }, []);

  const pollOnce = useCallback(async () => {
    try {
      const { data } = await emergencyRequestApi.getCurrent();
      applyDto(data);
    } catch {
      // ignore transient errors while polling
    }
  }, [applyDto]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/emergency/wait' } });
      return;
    }
    if (user.role !== 'patient') {
      showToast('Экстренный вызов доступен пациентам', 'error');
      navigate('/home');
    }
  }, [user, navigate, showToast]);

  useEffect(() => {
    if (!user || user.role !== 'patient') return undefined;

    let cancelled = false;
    let socket = null;

    const onAccept = (payload) => {
      const cid = payload?.consultationId;
      if (cid) {
        navigateToVideo(cid);
      }
      pollOnce();
    };

    (async () => {
      setLoading(true);
      navigatedToVideoRef.current = false;
      try {
        await createEmergencyRequestOnce();
        if (cancelled) return;
        await pollOnce();
      } catch (err) {
        if (!cancelled) {
          showToast(err.response?.data?.message || 'Не удалось отправить заявку', 'error');
          navigate(ROUTES.EMERGENCY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    pollRef.current = window.setInterval(() => {
      pollOnce();
    }, 2500);

    const token = localStorage.getItem('token');
    if (token) {
      socket = getChatSocket(token);
      socket.on('emergency-request-accepted', onAccept);
    }

    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (socket) socket.off('emergency-request-accepted', onAccept);
    };
  }, [user, navigate, navigateToVideo, pollOnce, showToast]);

  useEffect(() => {
    if (current?.status === 'accepted' && current?.consultationId) {
      navigateToVideo(current.consultationId);
    }
  }, [current, navigateToVideo]);

  const handleCancel = async () => {
    try {
      await emergencyRequestApi.cancelCurrent();
      showToast('Вызов отменён', 'success');
      navigate(ROUTES.HOME);
    } catch (err) {
      showToast(err.response?.data?.message || 'Не удалось отменить', 'error');
    }
  };

  const accepted = current?.status === 'accepted' && current?.consultationId;
  const waiting = !loading && !accepted;

  return (
    <div className="emergency-page user-panel-page emergency-wait-page">
      <UserSidebar />
      <AppHeader showBack backTo={ROUTES.EMERGENCY} />
      <div className="page-shell page-shell--flex-grow emergency-wait-inner">
        <h1 className="emergency-wait-title">Скорая помощь</h1>
        {loading && <p className="emergency-wait-status">Отправляем заявку врачам общей практики…</p>}
        {accepted && (
          <p className="emergency-wait-status">
            Врач принял вызов{current.doctorName ? `: ${current.doctorName}` : ''}. Подключаем видео…
          </p>
        )}
        {waiting && (
          <>
            <p className="emergency-wait-status">
              Ожидаем свободного врача. Обычно ответ в течение минуты. Не закрывайте экран.
            </p>
            {current?.patientName && (
              <p className="emergency-wait-meta">Пациент: {current.patientName}</p>
            )}
            <div className="emergency-wait-footer-actions">
              <Button variant="ghost" size="medium" onClick={handleCancel}>
                Отменить вызов
              </Button>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
