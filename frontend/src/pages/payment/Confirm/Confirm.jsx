import { useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../../components/layout';
import { Avatar, Button } from '../../../components/ui';
import { formatCurrency } from '../../../utils/helpers';
import { ROUTES } from '../../../constants';
import './Confirm.css';

export default function Confirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctor } = location.state || {};

  if (!doctor) {
    return (
      <div className="simple-stack-page">
        <div className="confirm-page page-shell page-shell--flex-grow">
          <p>Нет данных о консультации</p>
          <Button variant="primary" onClick={() => navigate(ROUTES.DOCTORS)}>
            Вернуться к врачам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-stack-page">
      <AppHeader showBack />
      <div className="confirm-page page-shell page-shell--flex-grow">
        <h2 className="confirm-title">Подтверждение консультации</h2>
        <div className="confirm-card">
          <Avatar name={doctor.name} size="xlarge" />
          <h3>{doctor.name}</h3>
          <p className="doctor-specialty-confirm">{doctor.specialty}</p>
          <div className="consultation-details">
            <div className="detail-row">
              <span className="detail-label">Формат</span>
              <span className="detail-value">Видеоконсультация • 15 мин</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Стоимость</span>
              <span className="detail-value price">{formatCurrency(doctor.price)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Время</span>
              <span className="detail-value">Сразу после оплаты</span>
            </div>
          </div>
        </div>
        <div className="confirm-actions">
          <Button
            variant="primary"
            size="large"
            className="huge-btn"
            onClick={() => navigate(ROUTES.PAYMENT, { state: { doctor } })}
          >
            Оплатить и начать — {formatCurrency(doctor.price)}
          </Button>
          <Button variant="outline" size="medium" onClick={() => navigate(-1)}>
            Выбрать другого врача
          </Button>
        </div>
        <p className="confirm-note">
          После оплаты вы сразу попадёте в видеозвонок с врачом.<br />
          Деньги списываются только при успешном соединении.
        </p>
      </div>
    </div>
  );
}
