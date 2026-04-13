import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { doctorApi } from '../../../services/doctorApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { DoctorCard } from '../../../components/features';
import { EmptyState } from '../../../components/ui';
import './Home.css';

const MOCK_UPCOMING = [
  { id: 1, doctorName: 'Анна Иванова', specialty: 'Педиатр', time: 'Завтра, 15:30' },
  { id: 2, doctorName: 'Сергей Петров', specialty: 'Терапевт', time: '18 апреля, 10:00' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [upcoming] = useState(MOCK_UPCOMING);

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

  const onlineCount = doctors.filter((d) => d.isOnline).length;
  const firstName = user?.name?.split(' ')[0] || 'Гость';

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

        {upcoming.length > 0 && (
          <section className="upcoming-section">
            <div className="section-title">Ближайшие записи</div>
            <div className="upcoming-list">
              {upcoming.map((item) => (
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
