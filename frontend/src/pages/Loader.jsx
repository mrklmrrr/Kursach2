import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Loader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId } = location.state || {};

  useEffect(() => {
    if (!consultationId) {
      navigate('/doctors');
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/consultations/${consultationId}`)
        .then(res => {
          if (res.data.status === 'paid') navigate(`/consultation/${consultationId}`);
          else navigate('/doctors');
        })
        .catch(() => navigate('/doctors'));
    }, 3000);
    return () => clearTimeout(timer);
  }, [consultationId, navigate]);

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <div className="loader-spinner"></div>
      <h2>Подключаемся к врачу</h2>
      <p>Оплата прошла успешно. Перенаправляем...</p>
    </div>
  );
}