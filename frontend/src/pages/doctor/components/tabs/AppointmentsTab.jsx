import { DAY_MAP, CONSULTATION_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../../constants/labels";

export default function AppointmentsTab({
  appointmentForm,
  patients,
  workingHours,
  workingDays,
  appointments,
  onFormChange,
  onAssign,
  onSaveWorkingHours,
  onToggleDay,
  onSetWorkingHours,
  onCancelAppointment,
  onOpenCommentModal
}) {
  return (
    <div className="appointments-section">
      {/* Форма назначения */}
      <section className="section-card">
        <h3>Назначить запись</h3>
        <form onSubmit={onAssign} className="appointment-form">
          <div className="form-group">
            <label>Пациент</label>
            <select name="patientId" value={appointmentForm.patientId} onChange={onFormChange} required>
              <option value="">Выберите пациента</option>
              {patients.map((p, i) => (
                <option key={i} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Дата</label>
            <input type="date" name="date" value={appointmentForm.date} onChange={onFormChange} required />
          </div>
          <div className="form-group">
            <label>Время</label>
            <input type="time" name="time" value={appointmentForm.time} onChange={onFormChange} required />
          </div>
          <div className="form-group">
            <label>Тип консультации</label>
            <select name="consultationType" value={appointmentForm.consultationType} onChange={onFormChange}>
              <option value="online">Онлайн</option>
              <option value="offline">Офлайн</option>
            </select>
          </div>
          <div className="form-group">
            <label>Продолжительность (мин)</label>
            <input type="number" name="duration" value={appointmentForm.duration} onChange={onFormChange} min="15" step="15" />
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
            <input
              type="time"
              value={workingHours.start}
              onChange={(e) => onSetWorkingHours({ ...workingHours, start: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Конец рабочего дня</label>
            <input
              type="time"
              value={workingHours.end}
              onChange={(e) => onSetWorkingHours({ ...workingHours, end: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Рабочие дни</label>
            <div className="working-days-grid">
              {DAY_MAP.map(day => (
                <label key={day.value} className={`day-checkbox ${workingDays.includes(day.value) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={workingDays.includes(day.value)}
                    onChange={() => onToggleDay(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={onSaveWorkingHours}>
            Сохранить рабочее время
          </button>
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
                onDoubleClick={() => onOpenCommentModal(a)}
              >
                <div className="appointment-info">
                  <h4>{a.patientName}</h4>
                  <p className="appointment-date">{a.date} в {a.time}</p>
                  <p className="appointment-type">
                    {CONSULTATION_TYPE_LABELS[a.consultationType] || '🌐 Онлайн'} • {a.duration} мин
                  </p>
                  <span className={`status-badge ${a.status}`}>
                    {APPOINTMENT_STATUS_LABELS[a.status]}
                  </span>
                  <span className={`status-badge payment-${a.paymentStatus || 'unpaid'}`}>
                    {PAYMENT_STATUS_LABELS[a.paymentStatus || 'unpaid']}
                  </span>
                </div>
                {(a.status === 'scheduled' || a.status === 'confirmed') && (
                  <button className="cancel-btn" onClick={() => onCancelAppointment(a._id)}>
                    Отменить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
