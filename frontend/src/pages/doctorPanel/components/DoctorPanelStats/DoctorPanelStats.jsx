import './DoctorPanelStats.css';

/**
 * Краткая сводка: ближайшие приёмы по расписанию, активные записи
 */
export default function DoctorPanelStats({
  upcomingScheduleCount,
  activeAppointmentsCount
}) {
  return (
    <div className="doctor-insights" aria-label="Краткая сводка">
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
