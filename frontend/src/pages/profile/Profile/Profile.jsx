import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AppHeader, BottomNav } from '../../../components/layout';
import { Avatar } from '../../../components/ui';
import { ThemeToggle } from '../../../components/features/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../../constants';
import { authApi } from '../../../services/authApi';
import { consultationApi } from '../../../services/consultationApi';
import { appointmentApi } from '../../../services/appointmentApi';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || 'Пользователь';
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [historyItems, setHistoryItems] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [consultationsError, setConsultationsError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const parseHistoryDate = (value) => {
    if (!value) return null;

    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;

    const stringValue = String(value);
    const dotMatch = stringValue.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
    if (dotMatch) {
      const [, dd, mm, yyyy, hh = '00', min = '00'] = dotMatch;
      const parsed = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
  };

  const formatHistoryDate = (value) => {
    const parsed = parseHistoryDate(value);
    if (parsed) return parsed.toLocaleDateString('ru-RU');
    return value ? String(value) : '—';
  };

  const getConsultationTimeline = (consultation) => {
    const now = new Date();
    const status = String(consultation.status || '').toLowerCase();
    const parsedDate = parseHistoryDate(consultation.date);
    const hasValidDate = !!parsedDate;

    if (status === 'completed' || status === 'cancelled') {
      return { key: 'past', label: 'Была' };
    }

    if (status === 'scheduled' || status === 'confirmed' || status === 'pending' || status === 'paid' || status === 'active') {
      if (hasValidDate && parsedDate < now) {
        return { key: 'past', label: 'Была' };
      }
      return { key: 'future', label: 'Предстоит' };
    }

    if (hasValidDate && parsedDate > now) {
      return { key: 'future', label: 'Предстоит' };
    }

    return { key: 'past', label: 'Была' };
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Заполните все поля пароля.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Новый пароль должен быть не короче 6 символов.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Подтверждение пароля не совпадает.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Пароль успешно изменен.' });
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.message || 'Не удалось изменить пароль'
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  useEffect(() => {
    const loadConsultations = async () => {
      if (!user || user.role === 'doctor') return;

      const patientId = user.legacyId || user.id;
      if (!patientId) return;

      setConsultationsLoading(true);
      setConsultationsError('');
      try {
        const [consultationsRes, appointmentsRes] = await Promise.all([
          consultationApi.getByPatientId(patientId),
          appointmentApi.getAll()
        ]);

        const consultations = Array.isArray(consultationsRes.data) ? consultationsRes.data : [];
        const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];

        const normalizedConsultations = consultations.map((item) => ({
          id: `consultation-${item._id}`,
          source: 'consultation',
          status: item.status,
          date: item.scheduledAt || item.createdAt,
          specialty: item.specialty || 'Консультация',
          duration: item.duration || 0,
          price: item.price || 0
        }));

        const normalizedAppointments = appointments.map((item) => ({
          id: `appointment-${item._id}`,
          source: 'appointment',
          status: item.status,
          date: item.date && item.time ? `${item.date}T${item.time}:00` : item.createdAt,
          specialty: item.consultationType === 'offline' || item.consultationType === 'chat' ? 'Офлайн' : 'Онлайн',
          duration: item.duration || 0,
          price: item.price || 0
        }));

        const merged = [...normalizedConsultations, ...normalizedAppointments]
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setHistoryItems(merged);
      } catch (error) {
        setHistoryItems([]);
        setConsultationsError(error.response?.data?.message || 'Не удалось загрузить историю консультаций');
      } finally {
        setConsultationsLoading(false);
      }
    };

    loadConsultations();
  }, [user]);

  return (
    <div className="profile-page">
      <AppHeader />
      <div className="profile-content">
        <div className="profile-header">
          <Avatar name={fullName} size="xlarge" />
          <h1>{fullName}</h1>
          <p className="profile-email">{user?.email || ''}</p>
        </div>

        {user?.role !== 'doctor' && (
          <>
            <section className="section-card">
              <h3>Мои родственники</h3>
              <p className="empty-info">Родственники пока не добавлены.</p>
            </section>

            <section className="section-card">
              <h3>Медицинская карта</h3>
              <p className="empty-info">Данные медицинской карты пока отсутствуют.</p>
              <button className="btn btn-primary" onClick={() => alert('Медицинская карта скоро будет доступна')}>
                Открыть карту
              </button>
            </section>

            <section className="section-card">
              <h3>История консультаций</h3>
              {consultationsLoading && <p className="empty-info">Загрузка истории...</p>}
              {!consultationsLoading && consultationsError && <p className="error-info">{consultationsError}</p>}
              {!consultationsLoading && !consultationsError && historyItems.length === 0 && (
                <p className="empty-info">История консультаций пока пуста.</p>
              )}
              {!consultationsLoading && !consultationsError && historyItems.length > 0 && (
                (historyOpen ? historyItems : historyItems.slice(0, 3)).map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-main">
                      {formatHistoryDate(item.date)} • {item.specialty || 'Консультация'} • {item.duration || 0} мин
                      {item.price > 0 ? ` • ${item.price} BYN` : ''}
                    </div>
                    <span className={`history-tag ${getConsultationTimeline(item).key}`}>
                      {getConsultationTimeline(item).label}
                    </span>
                  </div>
                ))
              )}
              {!consultationsLoading && !consultationsError && historyItems.length > 0 && (
                <button className="btn btn-outline" onClick={() => setHistoryOpen((prev) => !prev)}>
                  {historyOpen ? 'Скрыть историю консультаций' : 'Открыть историю консультаций'}
                </button>
              )}
            </section>
          </>
        )}

        <section className="section-card">
          <h3>Смена пароля</h3>
          <form className="password-form" onSubmit={handleChangePassword}>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Текущий пароль"
            />
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Новый пароль"
            />
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Подтвердите новый пароль"
            />
            {passwordMessage.text && (
              <p className={`password-message ${passwordMessage.type}`}>{passwordMessage.text}</p>
            )}
            <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
              {passwordSaving ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </form>
        </section>

        <section className="section-card">
          <h3>Настройки</h3>
          <div className="setting-row">
            <span>Тёмная тема</span>
            <ThemeToggle />
          </div>
          <div className="setting-row logout-row" onClick={handleLogout}>
            <span>Выйти из аккаунта</span>
            <span className="material-icons">logout</span>
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
