import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AppHeader, BottomNav } from '../../../components/layout';
import { Avatar } from '../../../components/ui';
import { ThemeToggle } from '../../../components/features/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../../constants';
import { authApi } from '../../../services/authApi';
import { consultationApi } from '../../../services/consultationApi';
import { appointmentApi } from '../../../services/appointmentApi';
import { medicalRecordApi } from '../../../services/medicalRecordApi';

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
  const [paymentTab, setPaymentTab] = useState('history');
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [consultationsError, setConsultationsError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [medicalRecordLoading, setMedicalRecordLoading] = useState(false);
  const [medicalRecordError, setMedicalRecordError] = useState('');
  const [medicalRecordOpen, setMedicalRecordOpen] = useState(false);
  const [expandedMedicalSection, setExpandedMedicalSection] = useState('');
  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);
  const [medicalRecordTab, setMedicalRecordTab] = useState('systems');
  const [showSickLeaveHistory, setShowSickLeaveHistory] = useState(false);

  const allLeaves = useMemo(() => medicalRecord?.sickLeaves || [], [medicalRecord]);
  const openLeaves = useMemo(() => allLeaves.filter(leaf => leaf.status === 'open'), [allLeaves]);
  const currentLeaf = useMemo(() => openLeaves.length > 0 ? openLeaves[0] : null, [openLeaves]);

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

  const formatPrice = (value) => `${Number(value) || 0} BYN`;

  const formatDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('ru-RU');
  };

  const getDoctorInfo = (item) => {
    const doctorName = item?.doctorName || item?.rawAppointment?.doctorName || 'Имя врача не указано';
    const doctorProfession =
      item?.doctorProfession ||
      item?.rawAppointment?.doctorSpecialty ||
      (item?.source === 'consultation' ? item?.specialty : '') ||
      'Врач';

    return { doctorName, doctorProfession };
  };

  const toSortTime = (value) => {
    const parsed = parseHistoryDate(value);
    if (parsed) return parsed.getTime();
    return Number.MAX_SAFE_INTEGER;
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

  const handlePayAppointment = (item) => {
    const appointmentId = item?.rawAppointment?._id;
    if (!appointmentId) return;
    navigate(ROUTES.PAYMENT, {
      state: {
        appointment: {
          id: appointmentId,
          date: item.rawAppointment?.date,
          time: item.rawAppointment?.time,
          consultationType: item.rawAppointment?.consultationType,
          duration: item.rawAppointment?.duration,
          amount: Number(item.rawAppointment?.paymentAmount || item.price || 0),
          doctorName: item.rawAppointment?.doctorName
        }
      }
    });
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
          doctorName: item.doctorName || '',
          doctorProfession: item.specialty || '',
          duration: item.duration || 0,
          price: item.price || 0
        }));

        const normalizedAppointments = appointments.map((item) => ({
          id: `appointment-${item._id}`,
          source: 'appointment',
          status: item.status,
          date: item.date && item.time ? `${item.date}T${item.time}:00` : item.createdAt,
          specialty: item.consultationType === 'offline' || item.consultationType === 'chat' ? 'Офлайн' : 'Онлайн',
          doctorName: item.doctorName || '',
          doctorProfession: item.doctorSpecialty || '',
          duration: item.duration || 0,
          price: item.paymentAmount || item.price || 0,
          rawAppointment: item
        }));

        const nowTs = Date.now();
        const merged = [...normalizedConsultations, ...normalizedAppointments]
          .sort((a, b) => {
            const timeA = toSortTime(a.date);
            const timeB = toSortTime(b.date);
            const aUpcoming = timeA >= nowTs;
            const bUpcoming = timeB >= nowTs;

            if (aUpcoming !== bUpcoming) {
              return aUpcoming ? -1 : 1;
            }

            if (aUpcoming) {
              return timeA - timeB;
            }

            return timeB - timeA;
          });

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

  useEffect(() => {
    const loadMedicalRecord = async () => {
      if (!user || user.role === 'doctor') return;
      setMedicalRecordLoading(true);
      setMedicalRecordError('');
      try {
        const { data } = await medicalRecordApi.getMyRecord();
        setMedicalRecord(data);
        // setExpandedMedicalSection(data?.systems?.[0]?.key || '');
        setMedicalHistoryOpen(false);
        setMedicalRecordTab('systems');
      } catch (error) {
        setMedicalRecord(null);
        setMedicalRecordError(error.response?.data?.message || 'Не удалось загрузить медицинскую карту');
      } finally {
        setMedicalRecordLoading(false);
      }
    };

    loadMedicalRecord();
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
  {medicalRecordLoading && <p className="empty-info">Загрузка медицинской карты...</p>}
  {!medicalRecordLoading && medicalRecordError && <p className="error-info">{medicalRecordError}</p>}
  {!medicalRecordLoading && !medicalRecordError && !medicalRecordOpen && (
    <p className="empty-info">Откройте карту, чтобы посмотреть записи врача по системам организма.</p>
  )}
  <button
    className="btn btn-primary"
    onClick={() => setMedicalRecordOpen((prev) => !prev)}
    disabled={medicalRecordLoading}
  >
    {medicalRecordOpen ? 'Скрыть карту' : 'Открыть карту'}
  </button>

  {!medicalRecordLoading && !medicalRecordError && medicalRecordOpen && (
    <>
      <div className="medical-record-tabs">
        <button
          type="button"
          className={`profile-tab-btn ${medicalRecordTab === 'systems' ? 'active' : ''}`}
          onClick={() => setMedicalRecordTab('systems')}
        >
          Медицинская карта
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${medicalRecordTab === 'sickLeave' ? 'active' : ''}`}
          onClick={() => setMedicalRecordTab('sickLeave')}
        >
          Лист нетрудоспособности
        </button>
      </div>

      <div className="medical-record-patient-info">
        <p><strong>Пациент:</strong> {medicalRecord?.patient?.name || fullName}</p>
        <p><strong>Дата рождения:</strong> {medicalRecord?.patient?.birthDate ? String(medicalRecord.patient.birthDate).slice(0, 4) : '—'}</p>
        <p><strong>Телефон:</strong> {medicalRecord?.patient?.phone || user?.phone || '—'}</p>
      </div>

      {/* Вкладка: Медицинская карта (системы организма) */}
      {medicalRecordTab === 'systems' && (
        <>
          {(medicalRecord?.systems || []).map((section) => (
            <div key={section.key} className="medical-record-system">
              <button
                type="button"
                className="medical-system-toggle"
                onClick={() => setExpandedMedicalSection((prev) => (prev === section.key ? '' : section.key))}
              >
                <span>{section.name}</span>
                <span>{expandedMedicalSection === section.key ? '−' : '+'}</span>
              </button>
              {expandedMedicalSection === section.key && (
                <div className="medical-system-content">
                  <p><strong>Осмотр и жалобы:</strong> {section.notes || '—'}</p>
                  <p><strong>Диагноз:</strong> {section.diagnosis || '—'}</p>
                  <p><strong>Лечение:</strong> {section.treatment || '—'}</p>
                  <p><strong>Рекомендации:</strong> {section.recommendations || '—'}</p>
                  <p className="medical-system-meta">
                    Обновлено: {formatDateTime(section.updatedAt)} • Врач: {section.updatedBy?.doctorName || '—'}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Блок истории обследования (changeLogs) */}
          <div className="medical-record-logs">
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
                {(medicalRecord?.changeLogs || []).length === 0 ? (
                  <p className="empty-info">Изменений пока нет.</p>
                ) : (
                  medicalRecord.changeLogs.slice(0, 20).map((log, idx) => (
                    <div key={`${log.createdAt}-${log.field}-${idx}`} className="medical-log-item">
                      <div><strong>{log.doctorName}</strong> • {formatDateTime(log.createdAt)}</div>
                      <div>{log.sectionName} • {log.field}</div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Вкладка: Лист нетрудоспособности */}
      {medicalRecordTab === 'sickLeave' && (
        <div className="medical-sick-leaves">
          {currentLeaf ? (
            <div className="medical-record-system">
              <p><strong>Текущий больничный</strong></p>
              <p><strong>Дата выдачи:</strong> {formatHistoryDate(currentLeaf.issueDate)}</p>
              <p><strong>Период:</strong> {formatHistoryDate(currentLeaf.startDate)} — {formatHistoryDate(currentLeaf.endDate)}</p>
              <p><strong>Заболевание:</strong> {currentLeaf.disease || '—'}</p>
              <p><strong>Диагноз:</strong> {currentLeaf.diagnosis || '—'}</p>
              <p><strong>Рекомендации:</strong> {currentLeaf.recommendations || '—'}</p>
              <p className="medical-system-meta">
                Врач: {currentLeaf.doctorName || '—'} Обновлено: {formatDateTime(currentLeaf.updatedAt)} Статус: {currentLeaf.status === 'open' ? 'Открыт' : 'Закрыт'}
              </p>
            </div>
          ) : (
            <p>Нет текущего больничного листа.</p>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowSickLeaveHistory(!showSickLeaveHistory)}
          >
            {showSickLeaveHistory ? 'Скрыть историю больничных' : 'Показать историю больничных'}
          </button>
          {showSickLeaveHistory && (
            <div>
              {allLeaves.filter(leaf => leaf.status !== 'open').length === 0 && (
                <p className="empty-info">История больничных пуста.</p>
              )}
              {allLeaves.filter(leaf => leaf.status !== 'open').length > 0 && allLeaves.filter(leaf => leaf.status !== 'open').map((leaf) => (
                <div key={leaf._id} className="medical-record-system">
                  <p><strong>Дата выдачи:</strong> {formatHistoryDate(leaf.issueDate)}</p>
                  <p><strong>Период:</strong> {formatHistoryDate(leaf.startDate)} — {formatHistoryDate(leaf.endDate)}</p>
                  <p><strong>Заболевание:</strong> {leaf.disease || '—'}</p>
                  <p><strong>Диагноз:</strong> {leaf.diagnosis || '—'}</p>
                  <p><strong>Рекомендации:</strong> {leaf.recommendations || '—'}</p>
                  <p className="medical-system-meta">
                    Врач: {leaf.doctorName || '—'} Обновлено: {formatDateTime(leaf.updatedAt)} Статус: {leaf.status === 'open' ? 'Открыт' : 'Закрыт'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )}
</section>

            <section className="section-card">
              <h3>История консультаций</h3>
              <div className="profile-tabs">
                <button
                  type="button"
                  className={`profile-tab-btn ${paymentTab === 'history' ? 'active' : ''}`}
                  onClick={() => setPaymentTab('history')}
                >
                  История
                </button>
                <button
                  type="button"
                  className={`profile-tab-btn ${paymentTab === 'payments' ? 'active' : ''}`}
                  onClick={() => setPaymentTab('payments')}
                >
                  Оплата
                </button>
              </div>
              {consultationsLoading && <p className="empty-info">Загрузка истории...</p>}
              {!consultationsLoading && consultationsError && <p className="error-info">{consultationsError}</p>}
              {!consultationsLoading && !consultationsError && paymentTab === 'history' && historyItems.length === 0 && (
                <p className="empty-info">История консультаций пока пуста.</p>
              )}
              {!consultationsLoading && !consultationsError && paymentTab === 'history' && historyItems.length > 0 && (
                (historyOpen ? historyItems : historyItems.slice(0, 3)).map((item) => {
                  const doctorInfo = getDoctorInfo(item);
                  return (
                  <div
                    key={item.id}
                    className="history-item"
                    onDoubleClick={() => setSelectedHistoryItem(item)}
                  >
                    <div className="history-item-main">
                      <div>{formatHistoryDate(item.date)} • {item.specialty || 'Консультация'} • {item.duration || 0} мин</div>
                      <div className="history-item-doctor">Врач: {doctorInfo.doctorName} • {doctorInfo.doctorProfession}</div>
                      {item.price > 0 ? <div className="history-item-price">{formatPrice(item.price)}</div> : null}
                    </div>
                    <span className={`history-tag ${getConsultationTimeline(item).key}`}>
                      {getConsultationTimeline(item).label}
                    </span>
                  </div>
                  );
                })
              )}
              {!consultationsLoading && !consultationsError && paymentTab === 'history' && historyItems.length > 0 && (
                <button className="btn btn-outline" onClick={() => setHistoryOpen((prev) => !prev)}>
                  {historyOpen ? 'Скрыть историю консультаций' : 'Открыть историю консультаций'}
                </button>
              )}
              {!consultationsLoading && !consultationsError && paymentTab === 'payments' && (
                <>
                  {historyItems.filter((item) => item.source === 'appointment').length === 0 ? (
                    <p className="empty-info">Оплачивать пока нечего. Записи на прием не найдены.</p>
                  ) : (
                    historyItems
                      .filter((item) => item.source === 'appointment')
                      .map((item) => {
                        const paid = item.rawAppointment?.paymentStatus === 'paid';
                        return (
                          <div key={`pay-${item.id}`} className="history-item payment-item">
                            <div className="history-item-main">
                              {formatHistoryDate(item.date)} • {item.specialty || 'Консультация'} • {item.duration || 0} мин
                              <br />
                              <span className="payment-price">К оплате: {formatPrice(item.price)}</span>
                            </div>
                            <div className="payment-actions">
                              <span className={`history-tag ${paid ? 'paid' : 'unpaid'}`}>
                                {paid ? 'Оплачен' : 'Не оплачен'}
                              </span>
                              {!paid && (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handlePayAppointment(item)}
                                >
                                  Оплатить прием
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </>
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

      {selectedHistoryItem && (
        <div className="patient-modal-overlay" role="presentation" onClick={() => setSelectedHistoryItem(null)}>
          <div className="patient-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Информация о записи</h3>
            <p><strong>Дата:</strong> {formatHistoryDate(selectedHistoryItem.date)}</p>
            <p>
              <strong>Врач:</strong> {getDoctorInfo(selectedHistoryItem).doctorName} ({getDoctorInfo(selectedHistoryItem).doctorProfession})
            </p>
            {selectedHistoryItem.source === 'appointment' && selectedHistoryItem.rawAppointment && (
              <>
                <p><strong>Время:</strong> {selectedHistoryItem.rawAppointment.time}</p>
                <p><strong>Тип консультации:</strong> {selectedHistoryItem.specialty}</p>
                <p><strong>Длительность:</strong> {selectedHistoryItem.duration || 0} мин</p>
                {selectedHistoryItem.rawAppointment.doctorComment && (
                  <p><strong>Комментарий врача:</strong> {selectedHistoryItem.rawAppointment.doctorComment}</p>
                )}
              </>
            )}
            {selectedHistoryItem.source === 'consultation' && (
              <>
                <p><strong>Тип:</strong> {selectedHistoryItem.specialty || 'Консультация'}</p>
                <p><strong>Длительность:</strong> {selectedHistoryItem.duration || 0} мин</p>
              </>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setSelectedHistoryItem(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
