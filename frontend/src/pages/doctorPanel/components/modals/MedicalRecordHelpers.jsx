import { Accordion } from '@components/ui';
import { formatDateTime } from "../../utils/dateUtils";

export function ResearchNavigation({ patientId, label, pathSegment, navigate }) {
  return (
    <div className="research-navigation">
      <p>Управление {label} производится на отдельной странице.</p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigate(`/doctor/patient/${patientId}/${pathSegment}`)}
      >
        Перейти к {label.toLowerCase()}
      </button>
    </div>
  );
}

export function MedicalHistory({ logs, historyOpen, onToggle }) {
  return (
    <div className="medical-log-list">
      <Accordion type="single" collapsible value={historyOpen ? 'history' : ''} onValueChange={(v) => onToggle(v === 'history')}>
        <Accordion.Item value="history">
          <Accordion.Trigger>История обследования</Accordion.Trigger>
          <Accordion.Content>
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
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
