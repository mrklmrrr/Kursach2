import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { doctorApi } from '../../../services/doctorApi';
import { appointmentApi } from '../../../services/appointmentApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { DoctorCard } from '../../../components/features';
import { EmptyState } from '../../../components/ui';
import './Home.css';

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
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

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

  // Загрузка записей пациента
  useEffect(() => {
    if (!user) {
      setLoadingAppointments(false);
      return;
    }
    appointmentApi.getAll()
      .then((res) => {
        const upcomingAppointments = res.data
          .filter(a => a.status === 'scheduled' || a.status === 'confirmed')
          .sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
          })
          .map(a => {
            const dateObj = new Date(a.date);
            const dayOfWeek = DAY_MAP[['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()]] || a.date;
            return {
              id: a._id,
              doctorName: a.doctorName,
              specialty: a.type === 'online' ? 'Онлайн' : 'Офлайн',
              time: `${dayOfWeek}, ${a.time}`,
              dateObj: dateObj
            };
          });
        setUpcoming(upcomingAppointments);
      })
      .catch((err) => console.error('Ошибка загрузки записей:', err))
      .finally(() => setLoadingAppointments(false));
  }, [user]);

  useEffect(() => {
    setShowAllUpcoming(false);
  }, [upcoming.length]);

  const onlineCount = doctors.filter((d) => d.isOnline).length;
  const fullNameParts = user?.name?.trim().split(/\s+/).filter(Boolean) || [];
  const extractedFirstName = fullNameParts.length >= 2 ? fullNameParts[1] : fullNameParts[0];
  const firstName = user?.firstName || extractedFirstName || 'Пользователь';
  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 3);
  const hasHiddenUpcoming = upcoming.length > 3 && !showAllUpcoming;

  return (
    <div className="home-page">
      <AppHeader />
      <div className="home-container">
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

        {!loadingAppointments && upcoming.length > 0 && (
          <section className="upcoming-section">
            <div className="section-title">Ближайшие записи</div>
            <div className="upcoming-list">
              {visibleUpcoming.map((item) => (
                <div
                  key={item.id}
                  className="upcoming-card"
                  onClick={() => navigate('/chats')}
                >
                  <div className="upcoming-info">
                    <div className="upcoming-doctor">{item.doctorName}</div>
                    <div className="upcoming-spec">{item.specialty}</div>
                  </div>
                  <div className="upcoming-time">{item.time}</div>
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

        <div className="section-title">Врачи онлайн сейчас</div>

        {doctors.length > 0 ? (
          <div className="doctors-scroll">
            {doctors.slice(0, 6).map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} variant="compact" />
            ))}
          </div>
        ) : (
          <EmptyState icon="local_hospital" title="Врачи не загружены" />
        )}

        <div className="quick-actions">
          <div className="quick-btn" onClick={() => navigate('/doctors')}>
            <span className="material-icons">videocam</span>
            <span>Видеоконсультация</span>
          </div>
          <div className="quick-btn" onClick={() => navigate('/chats')}>
            <span className="material-icons">chat</span>
            <span>Сообщения</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
