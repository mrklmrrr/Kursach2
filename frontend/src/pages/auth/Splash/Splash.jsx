import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, APP_BRAND_NAME, APP_BRAND_TAGLINE } from '../../../constants';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate(ROUTES.REGISTER), 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <span className="material-icons big-icon">stethoscope</span>
          <h1>{APP_BRAND_NAME}</h1>
          <p className="slogan">{APP_BRAND_TAGLINE}</p>
        </div>
        <div className="splash-features">
          <div className="feature">
            <span className="material-icons feature-icon">videocam</span>
            <span>Видеоконсультации</span>
          </div>
          <div className="feature">
            <span className="material-icons feature-icon">event_available</span>
            <span>Запись и напоминания о приёме</span>
          </div>
          <div className="feature">
            <span className="material-icons feature-icon">child_care</span>
            <span>Для детей и взрослых</span>
          </div>
        </div>
        <p className="splash-footer">Онлайн-консультации с врачами всех специальностей</p>
      </div>
    </div>
  );
}
