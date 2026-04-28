import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorApi } from '../../../services/doctorApi';
import { appointmentApi } from '../../../services/appointmentApi';
import { consultationApi } from '../../../services/consultationApi';
import { chatApi } from '../../../services/chatApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { Avatar, AlertBanner } from '../../../components/ui';
import { Button } from '../../../components/ui';
import { Loader } from '../../../components/ui';
import { ROUTES } from '../../../constants';
import { useToast } from '../../../contexts/ToastProvider/useToast';
import './DoctorProfile.css';

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDateStrip(days) {
  const out = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push({
      iso: toYMD(d),
      short: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('ru-RU', { month: 'short' }),
    });
  }
  return out;
}

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
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
  const [showCustomDate, setShowCustomDate] = useState(false);

  const dateStrip = useMemo(() => buildDateStrip(14), []);
  const todayIso = useMemo(() => toYMD(new Date()), []);

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
    if (bookingOpen) {
      setBookingOpen(false);
      setBookingDate('');
      setSlots([]);
      setSelectedTime('');
      setConsultationType('online');
      setDuration(30);
      setBookingNotice({ type: '', text: '' });
      setShowCustomDate(false);
      return;
    }
    setBookingOpen(true);
    const first = dateStrip[0]?.iso;
    if (first) {
      loadSlotsForDate(first);
    }
  };

  const loadSlotsForDate = async (date) => {
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

  const handleDateChange = async (e) => {
    await loadSlotsForDate(e.target.value);
  };

  const pickStripDate = (iso) => {
    setShowCustomDate(false);
    loadSlotsForDate(iso);
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
      showToast('Запись успешно назначена', 'success');
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
      const doctorId = doctor.id || doctor._id;
      if (!doctorId) {
        throw new Error('Не удалось определить id врача');
      }

      const { data: existingChats = [] } = await chatApi.getChats();
      const normalizedDoctorId = String(doctorId);
      const existingChat = existingChats.find(
        (chat) => String(chat.doctorId) === normalizedDoctorId && String(chat.type || '').toLowerCase() === 'chat'
      );

      if (existingChat?._id) {
        navigate(ROUTES.CHAT_ROOM(existingChat._id), { state: { doctor } });
        return;
      }

      const { data } = await consultationApi.create({
        doctorId,
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
      <div className="doctor-profile-content page-shell page-shell--flex-grow">
        <div className="doctor-hero">
          <div className="doctor-hero-avatar-wrap">
            <Avatar name={doctor.name} src={doctor.avatarUrl || doctor.avatar || undefined} size="xlarge" />
          </div>
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
          <AlertBanner
            type={bookingNotice.type === 'success' ? 'success' : bookingNotice.type === 'error' ? 'error' : 'info'}
            message={bookingNotice.text}
          />
        )}

        {bookingOpen && (
          <div className="doctor-info-card booking-sheet">
            <h3>Запись на приём</h3>
            <p className="booking-hint">Выберите день и удобное время — свободные окна подгружаются автоматически.</p>

            <div className="booking-field">
              <span className="booking-label">Дата</span>
              <div className="date-strip" role="list">
                {dateStrip.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    role="listitem"
                    className={`date-pill ${bookingDate === d.iso ? 'active' : ''}`}
                    onClick={() => pickStripDate(d.iso)}
                  >
                    <span className="date-pill-dow">{d.short}</span>
                    <span className="date-pill-num">{d.dayNum}</span>
                    <span className="date-pill-mon">{d.month}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="booking-toggle-custom"
                onClick={() => setShowCustomDate((v) => !v)}
              >
                {showCustomDate ? 'Скрыть календарь' : 'Другая дата'}
              </button>
              {showCustomDate && (
                <input
                  className="booking-date-native"
                  type="date"
                  min={todayIso}
                  value={bookingDate}
                  onChange={handleDateChange}
                />
              )}
            </div>

            <div className="booking-field">
              <span className="booking-label">Время</span>
              {loadingSlots ? (
                <p className="booking-muted">Загрузка слотов…</p>
              ) : !bookingDate ? (
                <p className="booking-muted">Сначала выберите дату</p>
              ) : slots.length === 0 ? (
                <p className="booking-muted">На эту дату нет свободных окон</p>
              ) : (
                <div className="slot-chips">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-chip ${selectedTime === slot ? 'active' : ''}`}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="booking-field booking-row">
              <div>
                <span className="booking-label">Формат</span>
                <select className="booking-select" value={consultationType} onChange={(e) => setConsultationType(e.target.value)}>
                  <option value="online">Онлайн</option>
                  <option value="offline">Офлайн</option>
                </select>
              </div>
              <div>
                <span className="booking-label">Длительность</span>
                <select className="booking-select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  <option value={10}>10 мин</option>
                  <option value={15}>15 мин</option>
                  <option value={20}>20 мин</option>
                  <option value={30}>30 мин</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              size="medium"
              className="booking-confirm"
              onClick={handleCreateAppointment}
              disabled={savingBooking}
            >
              {savingBooking ? 'Назначаем...' : 'Подтвердить запись'}
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
