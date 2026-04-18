import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorPanelApi } from '../../services/doctorPanelApi';
import { appointmentApi } from '../../services/appointmentApi';
import { medicalRecordApi } from '../../services/medicalRecordApi';
import { useAuth } from '../../hooks/useAuth';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import './DoctorPanel.css';

const APPOINTMENT_STATUS_LABELS = {
  scheduled: 'Запланирована',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled: 'Отменена'
};

const CONSULTATION_TYPE_LABELS = {
  online: '🌐 Онлайн',
  offline: '🏥 Офлайн',
  video: '🌐 Онлайн',
  chat: '🏥 Офлайн'
};

const PAYMENT_STATUS_LABELS = {
  paid: 'Прием оплачен',
  unpaid: 'Не оплачен'
};

const DAY_MAP = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' }
];

const RECORD_FIELD_LABELS = {
  notes: 'Осмотр и жалобы',
  diagnosis: 'Диагноз',
  treatment: 'Лечение',
  recommendations: 'Рекомендации'
};

export default function DoctorPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [profile, setProfile] = useState(null);
  const [pendingConsultations, setPendingConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [workingDays, setWorkingDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [loading, setLoading] = useState(true);
  const [commentModal, setCommentModal] = useState({ open: false, appointment: null, text: '' });
  const [medicalRecordModal, setMedicalRecordModal] = useState({
    open: false,
    patient: null,
    record: null,
    loading: false,
    savingSectionKey: '',
    error: ''
  });
  const [expandedMedicalSection, setExpandedMedicalSection] = useState('');
  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);

  const toDateTime = (item) => {
    const dateTime = new Date(`${item?.date || ''}T${item?.time || ''}:00`);
    if (Number.isNaN(dateTime.getTime())) return Number.MAX_SAFE_INTEGER;
    return dateTime.getTime();
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('ru-RU');
  };

  // Форма назначения записи
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    date: '',
    time: '',
    type: 'online',
    consultationType: 'online',
    duration: 30
  });

  const patientById = useMemo(() => {
    const map = new Map();
    patients.forEach((patient) => {
      map.set(String(patient.id), patient);
    });
    return map;
  }, [patients]);

  const upcomingSchedule = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((item) => item.status === 'scheduled' || item.status === 'confirmed')
      .map((item) => {
        const dateTime = new Date(`${item.date}T${item.time}:00`);
        return { ...item, dateTime };
      })
      .filter((item) => !Number.isNaN(item.dateTime.getTime()) && item.dateTime >= now)
      .sort((a, b) => a.dateTime - b.dateTime);
  }, [appointments]);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, pendingRes, patientsRes, appointmentsRes, workingHoursRes] = await Promise.allSettled([
        doctorPanelApi.getProfile(),
        doctorPanelApi.getPendingConsultations(),
        doctorPanelApi.getPatients(),
        appointmentApi.getDoctorAppointments(),
        appointmentApi.getWorkingHours()
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      } else {
        console.error('Ошибка загрузки профиля врача:', profileRes.reason);
      }

      if (pendingRes.status === 'fulfilled') {
        setPendingConsultations(pendingRes.value.data);
      } else {
        setPendingConsultations([]);
        console.error('Ошибка загрузки заявок:', pendingRes.reason);
      }

      if (patientsRes.status === 'fulfilled') {
        setPatients(patientsRes.value.data);
      } else {
        setPatients([]);
        console.error('Ошибка загрузки пациентов:', patientsRes.reason);
      }

      if (appointmentsRes.status === 'fulfilled') {
        const sortedAppointments = [...appointmentsRes.value.data].sort((a, b) => toDateTime(a) - toDateTime(b));
        setAppointments(sortedAppointments);
      } else {
        setAppointments([]);
        console.error('Ошибка загрузки записей врача:', appointmentsRes.reason);
      }

      if (workingHoursRes.status === 'fulfilled') {
        setWorkingHours(workingHoursRes.value.data.workingHours || { start: '09:00', end: '18:00' });
        setWorkingDays(workingHoursRes.value.data.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri']);
      } else {
        setWorkingHours({ start: '09:00', end: '18:00' });
        setWorkingDays(['mon', 'tue', 'wed', 'thu', 'fri']);
        console.error('Ошибка загрузки рабочего времени:', workingHoursRes.reason);
      }
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

  const handleOpenPatientProfile = (patientId, fallbackName) => {
    const patient = patientById.get(String(patientId));
    setSelectedPatient(patient || {
      id: patientId,
      name: fallbackName || 'Пациент',
      phone: '—',
      birthDate: '',
      consultationCount: 0
    });
  };

  const handleWorkingDayToggle = (day) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveWorkingHours = async () => {
    try {
      await appointmentApi.updateWorkingHours({ workingHours, workingDays });
      alert('Рабочее время сохранено');
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleAppointmentChange = (e) => {
    setAppointmentForm({ ...appointmentForm, [e.target.name]: e.target.value });
  };

  const handleAssignAppointment = async (e) => {
    e.preventDefault();
    try {
      await appointmentApi.assignAppointment(appointmentForm);
      alert('Запись создана');
      setAppointmentForm({ patientId: '', date: '', time: '', type: 'online', consultationType: 'online', duration: 30 });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка создания записи');
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!confirm('Отменить эту запись?')) return;
    try {
      await appointmentApi.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a._id !== id));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка отмены');
    }
  };

  const handleOpenCommentModal = (appointment) => {
    setCommentModal({
      open: true,
      appointment,
      text: appointment.doctorComment || ''
    });
  };

  const handleSaveComment = async () => {
    if (!commentModal.appointment?._id) {
      setCommentModal({ open: false, appointment: null, text: '' });
      return;
    }
    try {
      const { data } = await appointmentApi.updateDoctorComment(
        commentModal.appointment._id,
        commentModal.text
      );
      setAppointments(prev => prev.map(a => (a._id === data._id ? data : a)));
      setCommentModal({ open: false, appointment: null, text: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Не удалось сохранить комментарий');
    }
  };

  const handleOpenMedicalRecord = async (patient) => {
    if (!patient?.id) return;
    setMedicalRecordModal({
      open: true,
      patient,
      record: null,
      loading: true,
      savingSectionKey: '',
      error: ''
    });
    setExpandedMedicalSection('');
    setMedicalHistoryOpen(false);
    try {
      const { data } = await medicalRecordApi.getPatientRecord(patient.id);
      setMedicalRecordModal((prev) => ({
        ...prev,
        patient: { ...patient, ...(data.patient || {}) },
        record: data,
        loading: false
      }));
      const firstSectionKey = data?.systems?.[0]?.key || '';
      setExpandedMedicalSection(firstSectionKey);
      setMedicalHistoryOpen(false);
    } catch (err) {
      setMedicalRecordModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Не удалось загрузить медицинскую карту'
      }));
    }
  };

  const handleCloseMedicalRecord = () => {
    setMedicalRecordModal({
      open: false,
      patient: null,
      record: null,
      loading: false,
      savingSectionKey: '',
      error: ''
    });
    setExpandedMedicalSection('');
    setMedicalHistoryOpen(false);
  };

  const handleMedicalFieldChange = (sectionKey, field, value) => {
    setMedicalRecordModal((prev) => {
      if (!prev.record) return prev;
      return {
        ...prev,
        record: {
          ...prev.record,
          systems: (prev.record.systems || []).map((section) =>
            section.key === sectionKey ? { ...section, [field]: value } : section
          )
        }
      };
    });
  };

  const handleSaveSection = async (section) => {
    if (!medicalRecordModal.patient?.id || !section?.key) return;
    setMedicalRecordModal((prev) => ({ ...prev, savingSectionKey: section.key, error: '' }));
    try {
      const { data } = await medicalRecordApi.updatePatientSection(
        medicalRecordModal.patient.id,
        section.key,
        {
          notes: section.notes || '',
          diagnosis: section.diagnosis || '',
          treatment: section.treatment || '',
          recommendations: section.recommendations || ''
        }
      );
      setMedicalRecordModal((prev) => ({
        ...prev,
        savingSectionKey: '',
        record: {
          ...(prev.record || {}),
          ...data,
          patient: prev.patient
        }
      }));
    } catch (err) {
      setMedicalRecordModal((prev) => ({
        ...prev,
        savingSectionKey: '',
        error: err.response?.data?.message || 'Не удалось сохранить раздел'
      }));
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
            Расписание {upcomingSchedule.length > 0 && <span className="badge">{upcomingSchedule.length}</span>}
          </button>
          <button className={`d-tab ${tab === 'appointments' ? 'active' : ''}`} onClick={() => setTab('appointments')}>
            Записи {appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length > 0 && (
              <span className="badge">{appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}</span>
            )}
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
                    <p className="consult-type">{c.type === 'offline' || c.type === 'chat' ? '🏥 Офлайн' : '🌐 Онлайн'}</p>
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

        {/* Расписание консультаций */}
        {tab === 'upcoming' && (
          <div className="consultations-list">
            {upcomingSchedule.length === 0 ? (
              <p className="empty-state">Нет ближайших консультаций</p>
            ) : (
              upcomingSchedule.map((item, index) => (
                <div key={item._id} className="consultation-card upcoming">
                  <div className="consultation-info">
                    <h3>
                      <button
                        type="button"
                        className="patient-link"
                        onClick={() => handleOpenPatientProfile(item.patientId, item.patientName)}
                      >
                        {item.patientName}
                      </button>
                    </h3>
                    <p className="consult-type">{CONSULTATION_TYPE_LABELS[item.consultationType] || '🌐 Онлайн'}</p>
                    <p className="consult-date">{item.date} в {item.time}</p>
                    {index === 0 && <span className="status-badge active">Ближайшая консультация</span>}
                    <span className={`status-badge payment-${item.paymentStatus || 'unpaid'}`}>
                      {PAYMENT_STATUS_LABELS[item.paymentStatus || 'unpaid']}
                    </span>
                  </div>
                  <div className="consultation-actions">
                    <span className={`status-badge ${item.status}`}>{APPOINTMENT_STATUS_LABELS[item.status]}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Записи (назначение + управление) */}
        {tab === 'appointments' && (
          <div className="appointments-section">
            {/* Форма назначения */}
            <section className="section-card">
              <h3>Назначить запись</h3>
              <form onSubmit={handleAssignAppointment} className="appointment-form">
                <div className="form-group">
                  <label>Пациент</label>
                  <select name="patientId" value={appointmentForm.patientId} onChange={handleAppointmentChange} required>
                    <option value="">Выберите пациента</option>
                    {patients.map((p, i) => (
                      <option key={i} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Дата</label>
                  <input type="date" name="date" value={appointmentForm.date} onChange={handleAppointmentChange} required />
                </div>
                <div className="form-group">
                  <label>Время</label>
                  <input type="time" name="time" value={appointmentForm.time} onChange={handleAppointmentChange} required />
                </div>
                {/* Тип приема убран, оставляем только тип консультации */}
                <div className="form-group">
                  <label>Тип консультации</label>
                  <select name="consultationType" value={appointmentForm.consultationType} onChange={handleAppointmentChange}>
                    <option value="online">Онлайн</option>
                    <option value="offline">Офлайн</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Продолжительность (мин)</label>
                  <input type="number" name="duration" value={appointmentForm.duration} onChange={handleAppointmentChange} min="15" step="15" />
                </div>
                <button type="submit" className="btn btn-primary">Назначить запись</button>
              </form>
            </section>

            {/* Рабочее время */}
            <section className="section-card">
              <h3>Рабочее время</h3>
              <div className="working-hours-form">
                <div className="form-group">
                  <label>Начало рабочего дня</label>
                  <input type="time" value={workingHours.start} onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Конец рабочего дня</label>
                  <input type="time" value={workingHours.end} onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Рабочие дни</label>
                  <div className="working-days-grid">
                    {DAY_MAP.map(day => (
                      <label key={day.value} className={`day-checkbox ${workingDays.includes(day.value) ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={workingDays.includes(day.value)}
                          onChange={() => handleWorkingDayToggle(day.value)}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSaveWorkingHours}>Сохранить рабочее время</button>
              </div>
            </section>

            {/* Список записей */}
            <section className="section-card">
              <h3>Мои записи</h3>
              {appointments.length === 0 ? (
                <p className="empty-state">Нет записей</p>
              ) : (
                <div className="appointments-list">
                  {appointments.map(a => (
                    <div
                      key={a._id}
                      className="appointment-card"
                      onDoubleClick={() => handleOpenCommentModal(a)}
                    >
                      <div className="appointment-info">
                        <h4>{a.patientName}</h4>
                        <p className="appointment-date">{a.date} в {a.time}</p>
                        <p className="appointment-type">{CONSULTATION_TYPE_LABELS[a.consultationType] || '🌐 Онлайн'} • {a.duration} мин</p>
                        <span className={`status-badge ${a.status}`}>{APPOINTMENT_STATUS_LABELS[a.status]}</span>
                        <span className={`status-badge payment-${a.paymentStatus || 'unpaid'}`}>
                          {PAYMENT_STATUS_LABELS[a.paymentStatus || 'unpaid']}
                        </span>
                      </div>
                      {(a.status === 'scheduled' || a.status === 'confirmed') && (
                        <button className="cancel-btn" onClick={() => handleCancelAppointment(a._id)}>Отменить</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {commentModal.open && (
          <div className="patient-modal-overlay" role="presentation" onClick={() => setCommentModal({ open: false, appointment: null, text: '' })}>
            <div className="patient-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h3>Комментарий к записи</h3>
              <p>
                {commentModal.appointment?.date} в {commentModal.appointment?.time}{' '}
                • {CONSULTATION_TYPE_LABELS[commentModal.appointment?.consultationType] || 'Консультация'}
              </p>
              <textarea
                rows={4}
                value={commentModal.text}
                onChange={(e) => setCommentModal(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Введите комментарий врача..."
              />
              <div className="patient-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setCommentModal({ open: false, appointment: null, text: '' })}>
                  Отмена
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveComment}>
                  Сохранить
                </button>
              </div>
            </div>
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
                    <h3>
                      <button type="button" className="patient-link" onClick={() => handleOpenPatientProfile(p.id, p.name)}>
                        {p.name}
                      </button>
                    </h3>
                    <p>{p.phone || '—'}</p>
                  </div>
                  <div className="patient-card-actions">
                    <span className="consult-count">{p.consultationCount} консульт.</span>
                    <button type="button" className="btn btn-outline" onClick={() => handleOpenMedicalRecord(p)}>
                      Карточка пациента
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedPatient && (
          <div className="patient-modal-overlay" role="presentation" onClick={() => setSelectedPatient(null)}>
            <div className="patient-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h3>Профиль пациента</h3>
              <p><strong>Имя:</strong> {selectedPatient.name}</p>
              <p><strong>Дата рождения:</strong> {selectedPatient.birthDate ? String(selectedPatient.birthDate).slice(0, 4) : '—'}</p>
              <p><strong>Телефон:</strong> {selectedPatient.phone || '—'}</p>
              <p><strong>Консультаций:</strong> {selectedPatient.consultationCount ?? 0}</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleOpenMedicalRecord(selectedPatient)}
              >
                Карточка пациента
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setSelectedPatient(null)}>
                Закрыть
              </button>
            </div>
          </div>
        )}

        {medicalRecordModal.open && (
          <div className="patient-modal-overlay" role="presentation" onClick={handleCloseMedicalRecord}>
            <div className="patient-modal medical-record-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h3>Карточка пациента</h3>
              <p><strong>Пациент:</strong> {medicalRecordModal.patient?.name || '—'}</p>
              <p><strong>Дата рождения:</strong> {medicalRecordModal.patient?.birthDate ? String(medicalRecordModal.patient.birthDate).slice(0, 4) : '—'}</p>
              <p><strong>Телефон:</strong> {medicalRecordModal.patient?.phone || '—'}</p>

              {medicalRecordModal.loading && <p>Загрузка карты...</p>}
              {!medicalRecordModal.loading && medicalRecordModal.error && (
                <p className="medical-record-error">{medicalRecordModal.error}</p>
              )}

              {!medicalRecordModal.loading && medicalRecordModal.record?.systems?.map((section) => (
                <div key={section.key} className="medical-section-card">
                  <button
                    type="button"
                    className="medical-section-toggle"
                    onClick={() => setExpandedMedicalSection((prev) => (prev === section.key ? '' : section.key))}
                  >
                    <span>{section.name}</span>
                    <span>{expandedMedicalSection === section.key ? '−' : '+'}</span>
                  </button>
                  {expandedMedicalSection === section.key && (
                    <div className="medical-section-content">
                      {Object.entries(RECORD_FIELD_LABELS).map(([field, label]) => (
                        <label key={field} className="medical-section-field">
                          {label}
                          <textarea
                            rows={3}
                            value={section[field] || ''}
                            onChange={(e) => handleMedicalFieldChange(section.key, field, e.target.value)}
                          />
                        </label>
                      ))}
                      <p className="medical-section-meta">
                        Последнее изменение: {formatDateTime(section.updatedAt)} • Врач: {section.updatedBy?.doctorName || '—'}
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={medicalRecordModal.savingSectionKey === section.key}
                        onClick={() => handleSaveSection(section)}
                      >
                        {medicalRecordModal.savingSectionKey === section.key ? 'Сохранение...' : 'Сохранить раздел'}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!medicalRecordModal.loading && (
                <div className="medical-log-list">
                  <button
                    type="button"
                    className="medical-history-toggle"
                    onClick={() => setMedicalHistoryOpen((prev) => !prev)}
                  >
                    <span>История обследования</span>
                    <span>{medicalHistoryOpen ? '−' : '+'}</span>
                  </button>
                  {medicalHistoryOpen && (
                    <>
                      {(medicalRecordModal.record?.changeLogs || []).length === 0 ? (
                        <p>Изменений пока нет.</p>
                      ) : (
                        medicalRecordModal.record.changeLogs.slice(0, 25).map((log, index) => (
                          <div key={`${log.createdAt}-${log.field}-${index}`} className="medical-log-item">
                            <div><strong>{log.doctorName}</strong> • {formatDateTime(log.createdAt)}</div>
                            <div>{log.sectionName}: {RECORD_FIELD_LABELS[log.field] || log.field}</div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              )}

              <button type="button" className="btn btn-outline" onClick={handleCloseMedicalRecord}>
                Закрыть карту
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
