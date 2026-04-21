import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader } from '../../../components/ui';
import { ROUTES } from '../../../constants';

export default function LoaderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId, doctor } = location.state || {};

  useEffect(() => {
    if (!consultationId) {
      navigate(ROUTES.DOCTORS);
      return;
    }

    const timer = setTimeout(() => {
      navigate(ROUTES.CONSULTATION(consultationId), { state: { doctor } });
    }, 2800);

    return () => clearTimeout(timer);
  }, [consultationId, doctor, navigate]);

  return (
    <div className="simple-stack-page">
      <div className="page-shell page-shell--flex-grow loader-redirect-inner">
        <Loader text="Подключаемся к врачу..." />
        <p className="loader-subtext">Оплата прошла успешно. Перенаправляем в видеоконсультацию</p>
        <div className="loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  );
}
