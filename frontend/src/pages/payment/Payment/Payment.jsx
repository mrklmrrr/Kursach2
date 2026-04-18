import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { consultationApi } from '../../../services/consultationApi';
import { paymentApi } from '../../../services/paymentApi';
import { appointmentApi } from '../../../services/appointmentApi';
import { AppHeader } from '../../../components/layout';
import { Avatar, Button } from '../../../components/ui';
import { formatCurrency } from '../../../utils/helpers';
import { ROUTES } from '../../../constants';
import './Payment.css';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctor, appointment } = location.state || {};
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });
  const [loading, setLoading] = useState(false);
  const isAppointmentPayment = Boolean(appointment?.id);

  if (!doctor && !isAppointmentPayment) {
    return (
      <div className="payment-page">
        <p>Нет данных для оплаты</p>
        <Button variant="primary" onClick={() => navigate(ROUTES.PROFILE)}>
          Вернуться в профиль
        </Button>
      </div>
    );
  }

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{1,4}/g) || [];
    return matches.join(' ').substr(0, 19);
  };

  const formatExpiry = (value) => {
    const v = value.replace(/[^0-9]/gi, '');
    if (v.length >= 2) return v.substr(0, 2) + '/' + v.substr(2, 2);
    return v;
  };

  const handlePay = async () => {
    if (!card.number || !card.expiry || !card.cvc) {
      alert('Пожалуйста, заполните все поля карты');
      return;
    }
    if (card.expiry.length !== 5) {
      alert('Введите корректный срок действия карты (MM/YY)');
      return;
    }

    setLoading(true);
    try {
      if (isAppointmentPayment) {
        await appointmentApi.pay(appointment.id, {
          cardNumber: card.number.replace(/\s/g, ''),
          expiry: card.expiry,
          cvc: card.cvc
        });
        navigate(ROUTES.PROFILE);
      } else {
        const consRes = await consultationApi.create({
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          price: doctor.price,
          duration: 15
        });

        await paymentApi.process({
          consultationId: consRes.data.consultationId,
          cardNumber: card.number.replace(/\s/g, ''),
          expiry: card.expiry,
          cvc: card.cvc
        });

        navigate(ROUTES.LOADER, { state: { consultationId: consRes.data.consultationId, doctor } });
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при обработке платежа. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AppHeader showBack />
      <div className="payment-page">
        <h2>{isAppointmentPayment ? 'Оплата приема' : 'Оплата консультации'}</h2>
        <div className="payment-summary">
          <div className="doctor-info">
            <Avatar name={doctor?.name || appointment?.doctorName || 'Врач'} size="medium" />
            <div>
              <div className="doctor-name">{doctor?.name || appointment?.doctorName || 'Врач'}</div>
              <div className="doctor-specialty">
                {isAppointmentPayment
                  ? `${appointment?.date || '—'} в ${appointment?.time || '—'}`
                  : doctor?.specialty}
              </div>
            </div>
          </div>
          <div className="price-big">{formatCurrency(isAppointmentPayment ? appointment?.amount : doctor?.price)}</div>
          <div className="details">
            {isAppointmentPayment
              ? `${appointment?.duration || 0} минут • ${appointment?.consultationType === 'offline' ? 'Офлайн прием' : 'Онлайн прием'}`
              : '15 минут • Видеоконсультация'}
          </div>
        </div>

        <div className="card-form">
          <label>Номер карты</label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={card.number}
            onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
            maxLength="19"
          />
          <div className="expiry-cvc">
            <div>
              <label>Срок действия</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                maxLength="5"
              />
            </div>
            <div>
              <label>CVC</label>
              <input
                type="text"
                placeholder="123"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/[^0-9]/gi, '').substr(0, 4) })}
                maxLength="4"
              />
            </div>
          </div>
        </div>

        <Button variant="primary" size="large" className="huge-btn" onClick={handlePay} disabled={loading}>
          {loading
            ? 'Обрабатываем платеж...'
            : `Оплатить ${isAppointmentPayment ? appointment?.amount || 0 : doctor?.price || 0} BYN`}
        </Button>
        <p className="secure">🔒 Безопасная оплата. Данные карты не сохраняются.</p>
      </div>
    </div>
  );
}
