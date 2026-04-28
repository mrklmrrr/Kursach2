import './DoctorPanelTabs.css';

/**
 * Компонент навигации между табами в панели врача
 */
export default function DoctorPanelTabs({ 
  activeTab, 
  onTabChange, 
  pendingCount, 
  upcomingCount, 
  appointmentsCount 
}) {
  const tabs = [
    { id: 'requests', label: 'Заявки', badge: pendingCount },
    { id: 'upcoming', label: 'Расписание', badge: upcomingCount },
    { id: 'appointments', label: 'Записи', badge: appointmentsCount },
    { id: 'patients', label: 'Пациенты', badge: null },
  ];

  return (
    <div className="doctor-tabs" role="tablist" aria-label="Разделы кабинета">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`d-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
          {tab.badge > 0 && <span className="badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}