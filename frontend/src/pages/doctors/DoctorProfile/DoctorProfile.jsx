import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorApi } from '../../../services/doctorApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { Avatar } from '../../../components/ui';
import { Button } from '../../../components/ui';
import { Loader } from '../../../components/ui';
import { ROUTES } from '../../../constants';
import './DoctorProfile.css';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorApi
      .getById(id)
      .then((res) => setDoctor(res.data))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Loader text="Загрузка информации о враче..." />;
  }

  if (!doctor) {
    return <div className="not-found">Врач не найден</div>;
  }

  const handleStartVideo = () => {
    navigate(ROUTES.CONFIRM, { state: { doctor } });
  };

  const handleStartChat = () => {
    navigate(ROUTES.CHAT_ROOM(doctor.id), { state: { doctor } });
  };

  return (
    <div className="doctor-profile-page">
      <AppHeader showBack backTo={ROUTES.DOCTORS} />
      <div className="doctor-profile-content">
        <div className="doctor-hero">
          <Avatar name={doctor.name} size="xlarge" />
          <h1>{doctor.name}</h1>
          <p className="doctor-specialty">{doctor.specialty}</p>
          <div className="rating-online">
            <div className="rating">
              ★★★★★ <span>{doctor.rating || '4.9'}</span>
            </div>
            <div className={`online-status ${doctor.isOnline ? 'online' : 'offline'}`}>
              {doctor.isOnline ? '● Сейчас онлайн' : 'Офлайн'}
            </div>
          </div>
        </div>

        <div className="doctor-info-card">
          <h3>О враче</h3>
          <div className="info-list">
            <p>
              <strong>Стаж работы:</strong> 12 лет
            </p>
            <p>
              <strong>Специализация:</strong> {doctor.specialty}
            </p>
            <p>
              <strong>Принимает:</strong> Взрослых и детей
            </p>
            <p>
              <strong>Языки:</strong> Русский, Беларуский, Английский
            </p>
          </div>
        </div>

        <div className="action-buttons">
          <Button variant="primary" size="large" className="huge-btn" onClick={handleStartVideo}>
            Начать видеоконсультацию — {doctor.price} BYN
          </Button>
          <Button variant="outline" size="medium" onClick={handleStartChat}>
            Начать чат с врачом
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
