import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctor } = location.state || {};
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });
  const [loading, setLoading] = useState(false);

  if (!doctor) return <div>Нет данных. <button onClick={() => navigate('/doctors')}>Назад</button></div>;

  const handlePay = async () => {
    if (!card.number || !card.expiry || !card.cvc) return alert('Заполните все поля');
    setLoading(true);
    try {
      const consRes = await api.post('/consultations', {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        price: doctor.price,
        duration: 15,
        patientId: 1,
        patientName: 'Пациент'
      });
      const consultationId = consRes.data.consultationId;
      await api.post('/payments', { consultationId, cardNumber: card.number, expiry: card.expiry, cvc: card.cvc });
      navigate('/loader', { state: { consultationId } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Ошибка при создании консультации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="logo">Мед24/7</div>
      </header>
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Оплата консультации</h2>
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', margin: '20px 0' }}>
          <div>{doctor.name}</div>
          <div style={{ fontSize: '28px', color: '#5ab9ac' }}>{doctor.price} BYN</div>
          <div>15 минут</div>
        </div>
        <input type="text" placeholder="Номер карты" value={card.number} onChange={e => setCard({...card, number: e.target.value})} style={{ width: '100%', padding: '16px', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <input placeholder="ММ/ГГ" value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} style={{ flex: 1, padding: '16px' }} />
          <input placeholder="CVC" value={card.cvc} onChange={e => setCard({...card, cvc: e.target.value})} style={{ flex: 1, padding: '16px' }} />
        </div>
        <button className="btn btn-primary huge-btn" onClick={handlePay} disabled={loading}>
          {loading ? 'Обработка...' : `Оплатить ${doctor.price} BYN`}
        </button>
      </div>
    </>
  );
}