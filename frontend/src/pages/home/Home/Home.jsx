import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { doctorApi } from '../../../services/doctorApi';
import { appointmentApi } from '../../../services/appointmentApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { DoctorCard } from '../../../components/features';
import { EmptyState, ConfirmModal, Modal } from '../../../components/ui';
import './Home.css';

const formatDateTime = (date, time) => {
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm} ${time}`;
};

const HEALTH_TIPS = [
  { icon: 'water_drop', title: 'Вода', text: '1,5–2 л жидкости в день — мягкая поддержка давления и концентрации.' },
  { icon: 'directions_walk', title: 'Движение', text: 'Короткая прогулка после еды улучшает обмен веществ и настроение.' },
  { icon: 'bedtime', title: 'Сон', text: 'Стабильный режим сна помогает иммунитету и восстановлению организма.' },
  { icon: 'wb_sunny', title: 'Свет', text: 'Дневной свет и перерывы от экрана снижают усталость глаз.' },
];

const DAY_MAP = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс'
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Да',
    cancelText: 'Нет'
  });

  // Редирект врача на его панель
  useEffect(() => {
    if (user?.role === 'doctor') {
      navigate('/doctor');
    }
  }, [user]);

  useEffect(() => {
    doctorApi.getAll()
      .then((res) => setDoctors(res.data))
      .catch((err) => console.error('Ошибка загрузки врачей:', err));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- загрузка списка записей пациента (флаги loading + сброс при смене роли) */
  useEffect(() => {
    if (!user || user.role === 'doctor') {
      setLoadingAppointments(false);
      setUpcoming([]);
      return;
    }
    setLoadingAppointments(true);
    appointmentApi.getAll()
      .then((res) => {
        const now = new Date();
        const upcomingAppointments = res.data
          .filter((a) => {
            const isPlanned = a.status === 'scheduled' || a.status === 'confirmed';
            if (!isPlanned) return false;

            const appointmentDateTime = new Date(`${a.date}T${a.time}`);
            return appointmentDateTime >= now;
          })
          .sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
          })
          .map((a) => {
            const dateObj = new Date(a.date);
            const dayOfWeek = DAY_MAP[['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()]] || a.date;
            const statusLabel = {
              scheduled: 'Запланирована',
              confirmed: 'Подтверждена',
              completed: 'Завершена',
              cancelled: 'Отменена'
            }[a.status] || a.status;

            return {
              id: a._id,
              doctorId: a.doctorId,
              doctorName: a.doctorName,
              specialty: a.type === 'online' ? 'Онлайн' : 'Офлайн',
              time: `${dayOfWeek}, ${a.time}`,
              dateObj: dateObj,
              date: a.date,
              rawTime: a.time,
              status: statusLabel,
              type: a.type,
              duration: a.duration,
              doctorComment: a.doctorComment
            };
          });
        setUpcoming(upcomingAppointments);
      })
      .catch((err) => console.error('Ошибка загрузки записей:', err))
      .finally(() => setLoadingAppointments(false));
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    setShowAllUpcoming(false);
  }, [upcoming.length]);

  const showConfirm = (title, message, onConfirm, confirmText = 'Да', cancelText = 'Нет') => {
    setConfirmModal({
      open: true,
      title,
      message,
      onConfirm: () => {
        onConfirm?.();
        setConfirmModal(prev => ({ ...prev, open: false }));
      },
      confirmText,
      cancelText
    });
  };

  const handleCancelAppointment = async (appointmentId) => {
    showConfirm(
      'Отмена записи',
      'Вы уверены, что хотите отменить запись?',
      async () => {
        try {
          await appointmentApi.cancel(appointmentId);
          setUpcoming(prev => prev.filter(a => a.id !== appointmentId));
          setSelectedAppointment(null);
        } catch (err) {
          alert(err.response?.data?.message || 'Ошибка отмены записи');
        }
      },
      'Да, отменить',
      'Нет'
    );
  };

   const onlineCount = doctors.filter((d) => d.isOnline).length;
  const fullNameParts = user?.name?.trim().split(/\s+/).filter(Boolean) || [];
  const extractedFirstName = fullNameParts.length >= 2 ? fullNameParts[1] : fullNameParts[0];
  const firstName = user?.firstName || extractedFirstName || 'Пользователь';
  const tipOfDay = HEALTH_TIPS[new Date().getDate() % HEALTH_TIPS.length];
  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 3);
  const hasHiddenUpcoming = upcoming.length > 3 && !showAllUpcoming;
  const detailsType = selectedAppointment?.type === 'online' ? 'Онлайн консультация' : 'Офлайн прием';

  return (
    <div className="home-page">
      <AppHeader />
      <div className="home-container page-shell page-shell--flex-grow">
        <section className="greeting-section">
          <div className="greeting">Добрый день, {firstName}</div>
          <p className="welcome-text">Как вы себя чувствуете сегодня?</p>
        </section>

        <div className="emergency-card" onClick={() => navigate('/emergency')}>
          <div className="emergency-icon-wrapper">
            <span className="material-icons">emergency</span>
          </div>
          <div className="emergency-text">
            <h3>Срочная помощь</h3>
            <p>Врач подключится за 20–40 секунд</p>
          </div>
          <span className="material-icons arrow">arrow_forward</span>
        </div>

        {!loadingAppointments && upcoming.length === 0 && user?.role === 'patient' && (
          <section className="upcoming-section upcoming-section--empty" aria-label="Ближайшие записи">
            <div className="section-title">Ближайшие записи</div>
            <EmptyState
              variant="card"
              icon="event_note"
              title="Запланированных приёмов нет"
              description="Выберите врача и удобное время — запись появится здесь и в профиле."
              action={
                <button type="button" className="btn btn-primary btn-medium" onClick={() => navigate('/doctors')}>
                  К списку врачей
                </button>
              }
            />
          </section>
        )}

        {!loadingAppointments && upcoming.length > 0 && (
          <section className="upcoming-section">
            <div className="section-title">Ближайшие записи</div>
            <div className="upcoming-list">
              {visibleUpcoming.map((item) => (
                <div
                  key={item.id}
                  className="upcoming-card"
                  onClick={() => setSelectedAppointment(item)}
                >
                  <div className="upcoming-info">
                    <div className="upcoming-doctor">{item.doctorName}</div>
                    <div className="upcoming-spec">{item.specialty}</div>
                  </div>
                   <div className="upcoming-time">{formatDateTime(item.date, item.time)}</div>
                </div>
              ))}
            </div>
            {hasHiddenUpcoming && (
              <button
                type="button"
                className="upcoming-more-btn"
                onClick={() => setShowAllUpcoming(true)}
              >
                еще
              </button>
            )}
            {showAllUpcoming && upcoming.length > 3 && (
              <button
                type="button"
                className="upcoming-more-btn upcoming-collapse-btn"
                onClick={() => setShowAllUpcoming(false)}
                aria-label="Скрыть записи"
              >
                <span className="material-icons">keyboard_arrow_up</span>
              </button>
            )}
          </section>
        )}

        <div className="online-stats">
          Сейчас онлайн <span className="highlight">{onlineCount}</span> врачей
        </div>

        {onlineCount > 0 && (
          <>
            <div className="section-title">Врачи онлайн сейчас</div>
            <div className="doctors-scroll">
              {doctors.filter((d) => d.isOnline).slice(0, 6).map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} variant="compact" />
              ))}
            </div>
          </>
        )}

        {doctors.length === 0 && (
          <EmptyState
            variant="card"
            icon="local_hospital"
            title="Список врачей не загрузился"
            description="Проверьте подключение к интернету и обновите страницу."
            action={
              <button type="button" className="btn btn-outline btn-medium" onClick={() => window.location.reload()}>
                Обновить
              </button>
            }
          />
        )}

        <section className="health-tips-section" aria-label="Совет дня">
          <div className="section-title">Совет на сегодня</div>
          <div className="health-tips-grid">
            <article className="health-tip-card">
              <span className="material-icons health-tip-icon">{tipOfDay.icon}</span>
              <h4>{tipOfDay.title}</h4>
              <p>{tipOfDay.text}</p>
            </article>
          </div>
        </section>
      </div>
      <Modal open={Boolean(selectedAppointment)} onClose={() => setSelectedAppointment(null)}>
        <Modal.Overlay>
          <Modal.Content>
            <Modal.Header>
              <h3>Детали записи</h3>
            </Modal.Header>

            <Modal.Body>
              {selectedAppointment && (
                <>
                  <div className="appointment-details-grid">
                    <div>
                      <span>Врач:</span>{' '}
                      {selectedAppointment.doctorId ? (
                        <button
                          type="button"
                          className="appointment-doctor-link"
                          onClick={() => {
                            navigate(`/doctor/${selectedAppointment.doctorId}`);
                            setSelectedAppointment(null);
                          }}
                        >
                          {selectedAppointment.doctorName}
                        </button>
                      ) : (
                        selectedAppointment.doctorName
                      )}
                    </div>
                    <div><span>Дата и время:</span> {formatDateTime(selectedAppointment.date, selectedAppointment.rawTime)}</div>
                    <div><span>Формат:</span> {detailsType}</div>
                    <div><span>Статус:</span> {selectedAppointment.status}</div>
                    <div><span>Длительность:</span> {selectedAppointment.duration} мин.</div>
                  </div>
                  <div className="appointment-details-comment">
                    <span>Комментарий врача:</span>{' '}
                    {selectedAppointment.doctorComment?.trim() || 'Комментарий отсутствует'}
                  </div>
                  {(selectedAppointment.status === 'Запланирована' || selectedAppointment.status === 'Подтверждена') && (
                    <div className="appointment-details-actions">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => handleCancelAppointment(selectedAppointment.id)}
                      >
                        Отменить запись
                      </button>
                    </div>
                  )}
                </>
              )}
            </Modal.Body>
          </Modal.Content>
        </Modal.Overlay>
      </Modal>
       <ConfirmModal
         open={confirmModal.open}
         title={confirmModal.title}
         message={confirmModal.message}
         confirmText={confirmModal.confirmText}
         cancelText={confirmModal.cancelText}
         onConfirm={confirmModal.onConfirm}
         onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
         type="danger"
       />
       <BottomNav />
    </div>
  );
}
