import { useLocation, useNavigate } from 'react-router-dom';

export default function Confirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctor } = location.state || {};

  if (!doctor) {
    return <div style={{ padding: 20 }}>Нет данных о враче. <button onClick={() => navigate('/doctors')}>Вернуться</button></div>;
  }

  return (
    <>
      <header>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
        <div className="logo">Мед24/7</div>
      </header>
      <div className="confirm-content">
        <h2>Подтвердите консультацию</h2>
        <div className="summary">
          <div className="doctor-big-avatar" style={{ width: 80, height: 80, fontSize: 40, margin: '0 auto 16px' }}>👩‍⚕️</div>
          <h3>{doctor.name}</h3>
          <p>{doctor.specialty}</p>
          <p>Формат: Видеоконсультация</p>
          <p>Длительность: 15 минут</p>
          <p style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>{doctor.price} BYN</p>
        </div>
        <button className="btn-primary huge-btn" onClick={() => navigate('/payment', { state: { doctor } })}>
          Перейти к оплате ({doctor.price} BYN)
        </button>
      </div>
    </>
  );
}