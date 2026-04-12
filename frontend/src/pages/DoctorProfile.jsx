import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    api.get(`/doctors/${id}`).then(res => setDoctor(res.data)).catch(() => setDoctor(null));
  }, [id]);

  if (!doctor) return <div>Загрузка...</div>;

  const startChat = () => {
    navigate(`/chat/doctor/${doctor.id}`, { state: { doctor } });
  };

  return (
    <>
      <header>
        <button className="back-btn" onClick={() => navigate('/doctors')}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
        <div className="logo">Мед24/7</div>
      </header>
      <div className="doctor-profile-hero">
        <div className="doctor-big-avatar">👩‍⚕️</div>
        <h1>{doctor.name}</h1>
        <div className="doctor-spec-large">{doctor.specialty}</div>
        <div className="doctor-rating-large">★★★★★ {doctor.rating}</div>
      </div>
      <div className="action-buttons">
        <button className="btn-primary huge-btn" onClick={() => navigate('/confirm', { state: { doctor } })}>
          Начать видеоконсультацию ({doctor.price} BYN)
        </button>
        <button className="btn-outline" onClick={startChat}>
          Начать чат ({doctor.price} BYN)
        </button>
      </div>
      <BottomNav />
    </>
  );
}