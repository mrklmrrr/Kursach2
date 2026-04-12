import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [dependents, setDependents] = useState([]);

  useEffect(() => {
    if (user?.id) {
      api.get(`/consultations/patient/${user.id}`).then(res => setConsultations(res.data));
      api.get('/dependents').then(res => setDependents(res.data)).catch(() => {});
    }
  }, [user]);

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleDateString('ru-RU');
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 32;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <>
      <header>
        <div className="logo">Мед24/7</div>
        <span className="material-icons settings-btn" onClick={() => alert('Настройки в разработке')}>settings</span>
      </header>
      <div className="profile-header">
        <div className="profile-avatar">{user?.name?.charAt(0) || 'А'}</div>
        <h1>{user?.name || 'Анна Смирнова'}</h1>
        <p className="profile-age">{calculateAge(user?.birthDate)} года</p>
      </div>
      <div className="profile-sections">
        <div className="section-card">
          <h3>Мои родственники</h3>
          {dependents.length === 0 ? (
            <div className="relative-item">
              <span className="material-icons relative-avatar">child_care</span>
              <div className="relative-info">
                <div className="relative-name">Матвей, 4 года</div>
                <div className="relative-relation">Сын</div>
              </div>
            </div>
          ) : (
            dependents.map(rel => (
              <div key={rel.id} className="relative-item">
                <span className="material-icons relative-avatar">{rel.relation === 'child' ? 'child_care' : 'family_restroom'}</span>
                <div className="relative-info">
                  <div className="relative-name">{rel.name}, {rel.age} лет</div>
                  <div className="relative-relation">{rel.relation === 'child' ? 'Ребёнок' : rel.relation}</div>
                </div>
              </div>
            ))
          )}
          <button className="btn btn-outline add-relative" onClick={() => navigate('/profile/add-relative')}>
            + Добавить родственника
          </button>
        </div>

        <div className="section-card">
          <h3>Медицинская карта</h3>
          <ul className="card-list">
            <li>Аллергия на пенициллин</li>
            <li>Последняя консультация: {consultations.length > 0 ? formatDate(consultations[0]?.createdAt) : '05.03.2026'}</li>
            <li>Рецепты: 3 активных</li>
          </ul>
          <button className="btn btn-primary small-btn full-width" onClick={() => alert('Медицинская карта в разработке')}>Открыть карту</button>
        </div>

        <div className="section-card">
          <h3>История консультаций</h3>
          {consultations.length === 0 ? (
            <ul className="history-list">
              <li><span className="history-date">05.03.2026</span> <span className="history-spec">Педиатр • 15 мин</span> <span className="history-price">-590 ₽</span></li>
              <li><span className="history-date">18.02.2026</span> <span className="history-spec">Терапевт • чат</span> <span className="history-price">-390 ₽</span></li>
            </ul>
          ) : (
            <ul className="history-list">
              {consultations.slice(0, 3).map(cons => (
                <li key={cons.id}>
                  <span className="history-date">{formatDate(cons.createdAt)}</span>
                  <span className="history-spec">{cons.specialty} • {cons.duration} мин</span>
                  <span className="history-price">-{cons.price} ₽</span>
                </li>
              ))}
            </ul>
          )}
          <button className="btn btn-outline small-btn full-width" onClick={() => alert('История консультаций в разработке')}>Показать всю историю</button>
        </div>

        <div className="section-card">
          <h3>Настройки</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Тёмная тема</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="section-card">
          <button className="btn btn-danger full-width" onClick={() => { logout(); navigate('/register'); }}>Выйти из аккаунта</button>
        </div>
      </div>
      <BottomNav />
    </>
  );
}