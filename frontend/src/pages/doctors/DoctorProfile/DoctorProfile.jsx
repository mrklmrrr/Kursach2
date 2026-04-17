import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorApi } from '../../../services/doctorApi';
import { appointmentApi } from '../../../services/appointmentApi';
import { consultationApi } from '../../../services/consultationApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { Avatar } from '../../../components/ui';
import { Button } from '../../../components/ui';
import { Loader } from '../../../components/ui';
import { ROUTES } from '../../../constants';
import './DoctorProfile.css';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('online');
  const [duration, setDuration] = useState(30);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [bookingNotice, setBookingNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    doctorApi
      .getById(id)
      .then((res) => setDoctor(res.data))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Loader text="Загрузка информации о враче..." />;
  }

  if (!doctor) {
    return <div className="not-found">Врач не найден</div>;
  }

  const handleBookAppointment = () => {
    setBookingOpen((prev) => !prev);
    if (bookingOpen) {
      setBookingDate('');
      setSlots([]);
      setSelectedTime('');
      setConsultationType('online');
      setDuration(30);
      setBookingNotice({ type: '', text: '' });
    }
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setBookingDate(date);
    setSelectedTime('');

    if (!date) {
      setSlots([]);
      setBookingNotice({ type: '', text: '' });
      return;
    }

    setLoadingSlots(true);
    try {
      const res = await appointmentApi.getAvailableSlots(id, date);
      setSlots(res.data?.slots || []);
      if ((res.data?.slots || []).length === 0) {
        setBookingNotice({ type: 'info', text: 'На выбранную дату свободных слотов нет.' });
      } else {
        setBookingNotice({ type: '', text: '' });
      }
    } catch (err) {
      setSlots([]);
      setBookingNotice({
        type: 'error',
        text: err.response?.data?.message || 'Не удалось загрузить доступные слоты',
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!bookingDate || !selectedTime) {
      setBookingNotice({ type: 'error', text: 'Выберите дату и время записи.' });
      return;
    }

    setSavingBooking(true);
    try {
      await appointmentApi.create({
        doctorId: id,
        date: bookingDate,
        time: selectedTime,
        type: 'online',
        consultationType,
        duration: Number(duration),
      });
      setBookingNotice({ type: 'success', text: 'Запись успешно назначена.' });
      setBookingOpen(false);
      setBookingDate('');
      setSlots([]);
      setSelectedTime('');
      setConsultationType('online');
      setDuration(30);
    } catch (err) {
      setBookingNotice({
        type: 'error',
        text: err.response?.data?.message || 'Ошибка при создании записи',
      });
    } finally {
      setSavingBooking(false);
    }
  };

  const handleStartChat = async () => {
    setStartingChat(true);
    try {
      const { data } = await consultationApi.create({
        doctorId: doctor.id,
        type: 'chat'
      });

      const consultationId = data?.consultationId || data?._id;
      if (!consultationId) {
        throw new Error('Не удалось получить id чата');
      }

      navigate(ROUTES.CHAT_ROOM(consultationId), { state: { doctor } });
    } catch (err) {
      setBookingNotice({
        type: 'error',
        text: err.response?.data?.message || 'Не удалось создать чат с врачом'
      });
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <div className="doctor-profile-page">
      <AppHeader showBack backTo={ROUTES.DOCTORS} />
      <div className="doctor-profile-content">
        <div className="doctor-hero">
          <Avatar name={doctor.name} size="xlarge" />
          <h1>{doctor.name}</h1>
          <p className="doctor-specialty">{doctor.specialty}</p>
          <div className="rating-online">
            <div className="rating">
              ★★★★★ <span>{doctor.rating || '4.9'}</span>
            </div>
            <div className={`online-status ${doctor.isOnline ? 'online' : 'offline'}`}>
              {doctor.isOnline ? '● Сейчас онлайн' : 'Офлайн'}
            </div>
          </div>
        </div>

        <div className="doctor-info-card">
          <h3>О враче</h3>
          <div className="info-list">
            <p>
              <strong>Стаж работы:</strong> 12 лет
            </p>
            <p>
              <strong>Специализация:</strong> {doctor.specialty}
            </p>
            <p>
              <strong>Принимает:</strong> Взрослых и детей
            </p>
            <p>
              <strong>Языки:</strong> Русский, Беларуский, Английский
            </p>
          </div>
        </div>

        <div className="action-buttons">
          <Button variant="primary" size="large" className="huge-btn" onClick={handleBookAppointment}>
            Назначить запись — {doctor.price} BYN
          </Button>
          <Button variant="outline" size="medium" onClick={handleStartChat} disabled={startingChat}>
            {startingChat ? 'Создание чата...' : 'Начать чат с врачом'}
          </Button>
        </div>

        {bookingNotice.text && (
          <div className={`booking-notice ${bookingNotice.type || 'info'}`} role="status">
            <span className="booking-notice-icon" aria-hidden="true">
              {bookingNotice.type === 'success' ? '✓' : bookingNotice.type === 'error' ? '!' : 'i'}
            </span>
            <span>{bookingNotice.text}</span>
          </div>
        )}

        {bookingOpen && (
          <div className="doctor-info-card">
            <h3>Выберите дату и время</h3>
            <div className="info-list">
              <p>
                <strong>Дата:</strong>
              </p>
              <input type="date" value={bookingDate} onChange={handleDateChange} />

              <p>
                <strong>Свободные слоты:</strong>
              </p>
              {loadingSlots ? (
                <p>Загрузка слотов...</p>
              ) : slots.length === 0 ? (
                <p>На выбранную дату свободных слотов нет</p>
              ) : (
                <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                  <option value="">Выберите время</option>
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              )}

              <p>
                <strong>Тип консультации:</strong>
              </p>
              <select value={consultationType} onChange={(e) => setConsultationType(e.target.value)}>
                <option value="online">Онлайн</option>
                <option value="offline">Офлайн</option>
              </select>

              <p>
                <strong>Длительность:</strong>
              </p>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={10}>10 минут</option>
                <option value={15}>15 минут</option>
                <option value={20}>20 минут</option>
                <option value={30}>30 минут</option>
              </select>

              <Button
                variant="primary"
                size="medium"
                onClick={handleCreateAppointment}
                disabled={savingBooking}
              >
                {savingBooking ? 'Назначаем...' : 'Подтвердить запись'}
              </Button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
