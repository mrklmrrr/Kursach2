import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorPanelApi } from '../../services/doctorPanelApi';
import { useAuth } from '../../hooks/useAuth';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import './DoctorPanel.css';

const STATUS_LABELS = {
  pending: 'Ожидает',
  paid: 'Оплачена',
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена'
};

export default function DoctorPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [profile, setProfile] = useState(null);
  const [pendingConsultations, setPendingConsultations] = useState([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, pendingRes, upcomingRes, patientsRes] = await Promise.all([
        doctorPanelApi.getProfile(),
        doctorPanelApi.getPendingConsultations(),
        doctorPanelApi.getUpcomingConsultations(),
        doctorPanelApi.getPatients()
      ]);
      setProfile(profileRes.data);
      setPendingConsultations(pendingRes.data);
      setUpcomingConsultations(upcomingRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'doctor') {
      navigate('/home');
      return;
    }
    loadData();
  }, [user]);

  const handleToggleOnline = async () => {
    try {
      await doctorPanelApi.toggleOnline(!profile.isOnline);
      setProfile({ ...profile, isOnline: !profile.isOnline });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAccept = async (id) => {
    try {
      await doctorPanelApi.acceptConsultation(id);
      setPendingConsultations(prev => prev.filter(c => c._id !== id));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleReject = async (id) => {
    try {
      await doctorPanelApi.rejectConsultation(id);
      setPendingConsultations(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleComplete = async (id) => {
    try {
      await doctorPanelApi.completeConsultation(id);
      setUpcomingConsultations(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  if (loading) return <PageLayout><div className="loading-spinner">Загрузка...</div></PageLayout>;

  return (
    <PageLayout title="Кабинет врача" hideBack>
      <div className="doctor-panel">
        {/* Профиль */}
        <div className="profile-header">
          <div className="profile-main">
            <h2>{profile?.firstName} {profile?.lastName}</h2>
            <p className="profile-specialty">{profile?.specialty}</p>
          </div>
          <button
            className={`online-toggle ${profile?.isOnline ? 'online' : 'offline'}`}
            onClick={handleToggleOnline}
          >
            {profile?.isOnline ? '🟢 Онлайн' : '⚫ Оффлайн'}
          </button>
        </div>

        {/* Табы */}
        <div className="doctor-tabs">
          <button className={`d-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            Заявки {pendingConsultations.length > 0 && <span className="badge">{pendingConsultations.length}</span>}
          </button>
          <button className={`d-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
            Расписание {upcomingConsultations.length > 0 && <span className="badge">{upcomingConsultations.length}</span>}
          </button>
          <button className={`d-tab ${tab === 'patients' ? 'active' : ''}`} onClick={() => setTab('patients')}>
            Пациенты
          </button>
        </div>

        {/* Заявки */}
        {tab === 'requests' && (
          <div className="consultations-list">
            {pendingConsultations.length === 0 ? (
              <p className="empty-state">Нет ожидающих заявок</p>
            ) : (
              pendingConsultations.map(c => (
                <div key={c._id} className="consultation-card pending">
                  <div className="consultation-info">
                    <h3>{c.patientName}</h3>
                    <p className="consult-type">{c.type === 'video' ? '📹 Видеоконсультация' : '💬 Чат'}</p>
                    <p className="consult-date">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
                  </div>
                  <div className="consultation-actions">
                    <button className="accept-btn" onClick={() => handleAccept(c._id)}>✓ Принять</button>
                    <button className="reject-btn" onClick={() => handleReject(c._id)}>✕ Отклонить</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Расписание */}
        {tab === 'upcoming' && (
          <div className="consultations-list">
            {upcomingConsultations.length === 0 ? (
              <p className="empty-state">Нет ближайших консультаций</p>
            ) : (
              upcomingConsultations.map(c => (
                <div key={c._id} className="consultation-card upcoming">
                  <div className="consultation-info">
                    <h3>{c.patientName}</h3>
                    <p className="consult-type">{c.type === 'video' ? '📹 Видеоконсультация' : '💬 Чат'}</p>
                    <p className="consult-date">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
                    <span className={`status-badge ${c.status}`}>{STATUS_LABELS[c.status]}</span>
                  </div>
                  <div className="consultation-actions">
                    {c.status === 'paid' && (
                      <button className="start-btn" onClick={() => handleAccept(c._id)}>Начать</button>
                    )}
                    {(c.status === 'active' || c.status === 'paid') && (
                      <button className="complete-btn" onClick={() => handleComplete(c._id)}>Завершить</button>
                    )}
                    <button
                      className="chat-btn"
                      onClick={() => navigate(`/chat/doctor/${c._id}`)}
                    >
                      💬 Чат
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Пациенты */}
        {tab === 'patients' && (
          <div className="patients-list">
            {patients.length === 0 ? (
              <p className="empty-state">Нет пациентов</p>
            ) : (
              patients.map((p, i) => (
                <div key={i} className="patient-card">
                  <div className="patient-info">
                    <h3>{p.name}</h3>
                    <p>{p.phone || '—'}</p>
                  </div>
                  <span className="consult-count">{p.consultationCount} консульт.</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
