import { formatDateTime } from "../../utils/dateUtils";
import { RECORD_FIELD_LABELS } from "../../constants/labels";

export default function MedicalSystemSection({
  systems = [],
  expandedSection,
  onToggleSection,
  onFieldChange,
  onSaveSection,
  savingSectionKey
}) {
  if (!systems.length) return null;

  return (
    <>
      {systems.map((section) => (
        <div key={section.key} className="medical-section-card">
          <button
            type="button"
            className="medical-section-toggle"
            onClick={() => onToggleSection(section.key)}
          >
            <span>{section.name}</span>
            <span>{expandedSection === section.key ? '−' : '+'}</span>
          </button>
          {expandedSection === section.key && (
            <div className="medical-section-content">
              {Object.entries(RECORD_FIELD_LABELS).map(([field, label]) => (
                <label key={field} className="medical-section-field">
                  {label}
                  <textarea
                    rows={3}
                    value={section[field] || ''}
                    onChange={(e) => onFieldChange(section.key, field, e.target.value)}
                  />
                </label>
              ))}
              <p className="medical-section-meta">
                Последнее изменение: {formatDateTime(section.updatedAt)} • Врач: {section.updatedBy?.doctorName || '—'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingSectionKey === section.key}
                onClick={() => onSaveSection(section)}
              >
                {savingSectionKey === section.key ? 'Сохранение...' : 'Сохранить раздел'}
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
