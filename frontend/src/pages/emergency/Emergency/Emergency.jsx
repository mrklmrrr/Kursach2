import { useNavigate } from 'react-router-dom';
import { AppHeader, BottomNav } from '../../../components/layout';
import { ROUTES } from '../../../constants';

export default function Emergency() {
  const navigate = useNavigate();

  const handleEmergency = () => {
    navigate(ROUTES.CONSULTATION('emergency'));
  };

  return (
    <div className="emergency-page">
      <AppHeader />
      <div className="page-shell page-shell--flex-grow">
      <div className="emergency-hero">
        <h1>Нужна помощь<br />прямо сейчас?</h1>
        <p className="emergency-subtitle">Врач на связи за ~30 секунд</p>
      </div>
      <button className="btn btn-primary btn-large huge-btn btn-danger" onClick={handleEmergency}>
        ПОДКЛЮЧИТЬСЯ К ВРАЧУ ЗА 30 СЕКУНД
      </button>
      <div className="emergency-options">
        <div className="option-card" onClick={handleEmergency}>
          <span className="material-icons option-icon">videocam</span>
          <h3>Видео</h3>
          <p>Покажите проблему</p>
        </div>
        <div className="option-card" onClick={handleEmergency}>
          <span className="material-icons option-icon">call</span>
          <h3>Голосовой звонок</h3>
          <p>Только разговор</p>
        </div>
        <div className="option-card" onClick={handleEmergency}>
          <span className="material-icons option-icon">chat</span>
          <h3>Чат + фото</h3>
          <p>Отправляйте снимки</p>
        </div>
      </div>
      <div className="warning-block">
        <strong>Внимание!</strong><br />
        При угрозе жизни звоните <strong>103</strong> или <strong>112</strong>
      </div>
      </div>
      <BottomNav />
    </div>
  );
}
