import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import api from '../services/api';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    api.get('/doctors').then(res => setDoctors(res.data));
  }, []);

  return (
    <>
      <header>
        <div className="logo">Мед24/7</div>
        <div className="avatar">{user?.name?.charAt(0) || 'А'}</div>
      </header>
      <div className="greeting">Здравствуйте, {user?.name || 'Гость'}!</div>
      <button className="emergency-btn" onClick={() => navigate('/emergency')}>
        СРОЧНАЯ ПОМОЩЬ<br />Подключиться за ~30 сек
      </button>
      <div className="section-title">Врачи онлайн сейчас</div>
      <div className="doctors-scroll">
        {doctors.slice(0,3).map(doc => (
          <div key={doc.id} className="doctor-card" onClick={() => navigate(`/doctor/${doc.id}`)}>
            <span className="material-icons doctor-photo">stethoscope</span>
            <div className="doctor-name">{doc.name}</div>
            <div className="doctor-spec">{doc.specialty}</div>
            <div className="online">{doc.isOnline ? 'Онлайн' : 'Офлайн'}</div>
          </div>
        ))}
      </div>
      <div className="quick-actions">
        <div className="quick-btn" onClick={() => navigate('/doctors')}>
          <span className="material-icons">videocam</span> Видеоконсультация
        </div>
        <div className="quick-btn" onClick={() => navigate('/chats')}>
          <span className="material-icons">chat</span> Чат с врачом
        </div>
      </div>
      <BottomNav />
    </>
  );
}