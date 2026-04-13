import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

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
          <h1>Мед24/7</h1>
          <p className="slogan">Медицинская помощь круглосуточно</p>
        </div>
        <div className="splash-features">
          <div className="feature">
            <span className="material-icons feature-icon">videocam</span>
            <span>Видеоконсультации</span>
          </div>
          <div className="feature">
            <span className="material-icons feature-icon">directions_car</span>
            <span>Срочная помощь 24/7</span>
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
