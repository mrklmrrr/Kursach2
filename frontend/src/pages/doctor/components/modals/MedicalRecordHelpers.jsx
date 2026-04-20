import { formatDateTime } from "../../utils/dateUtils";

export function ResearchNavigation({ patientId, label, navigate }) {
  return (
    <div className="research-navigation">
      <p>Управление {label} производится на отдельной странице.</p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigate(`/doctor/patient/${patientId}/${label.split(' ')[0].toLowerCase()}`)}
      >
        Перейти к {label.toLowerCase()}
      </button>
    </div>
  );
}

export function MedicalHistory({ logs, historyOpen, onToggle }) {
  return (
    <div className="medical-log-list">
      <button
        type="button"
        className="medical-history-toggle"
        onClick={onToggle}
      >
        <span>История обследования</span>
        <span>{historyOpen ? '−' : '+'}</span>
      </button>
      {historyOpen && (
        <>
          {(logs || []).length === 0 ? (
            <p>Изменений пока нет.</p>
          ) : (
            logs.slice(0, 25).map((log, index) => (
              <div key={`${log.createdAt}-${log.field}-${index}`} className="medical-log-item">
                <div><strong>{log.doctorName}</strong> • {formatDateTime(log.createdAt)}</div>
                <div>{log.sectionName}: {log.field}</div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
