import './DoctorPanelStats.css';

/**
 * Компонент отображения статистики/сводки в панели врача
 * Показывает: новые заявки, ближайшие приёмы, активные записи
 */
export default function DoctorPanelStats({ 
  pendingConsultationsCount, 
  upcomingScheduleCount, 
  activeAppointmentsCount 
}) {
  return (
    <div className="doctor-insights" aria-label="Краткая сводка">
      <div className="insight-card">
        <span className="insight-label">Новые заявки</span>
        <span className="insight-value">{pendingConsultationsCount}</span>
      </div>
      <div className="insight-card">
        <span className="insight-label">Ближайшие приёмы</span>
        <span className="insight-value">{upcomingScheduleCount}</span>
      </div>
      <div className="insight-card">
        <span className="insight-label">Активные записи</span>
        <span className="insight-value">{activeAppointmentsCount}</span>
      </div>
    </div>
  );
}
