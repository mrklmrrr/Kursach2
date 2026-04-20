import { formatDateTime, toDateInputValue } from "../../utils/dateUtils";

export default function SickLeaveSection({
  sickLeaves = [],
  showHistory,
  onToggleHistory,
  onAddDraft,
  onFieldChange,
  onSave,
  savingSectionKey
}) {
  const allLeaves = sickLeaves || [];
  const openLeaves = allLeaves.filter(leaf => leaf.originalStatus === 'open');
  const filteredLeaves = showHistory ? allLeaves : openLeaves.slice(0, 1);

  return (
    <div className="sick-leave-section">
      <div className="sick-leave-actions">
        <button type="button" className="btn btn-primary" onClick={onAddDraft}>
          Добавить лист нетрудоспособности
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onToggleHistory}
        >
          {showHistory ? 'Текущие больничные' : 'История больничных'}
        </button>
      </div>

      {filteredLeaves.length === 0 ? (
        <p>{showHistory ? 'История больничных пуста.' : 'Нет текущего больничного листа.'}</p>
      ) : (
        filteredLeaves.map((leaf) => {
          const leafKey = leaf._id || leaf.tempId;
          return (
            <div key={leafKey} className="medical-section-card sick-leave-card">
              <label className="medical-section-field">
                Дата выдачи
                <input
                  type="date"
                  value={toDateInputValue(leaf.issueDate)}
                  onChange={(e) => onFieldChange(leafKey, 'issueDate', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Начало больничного
                <input
                  type="date"
                  value={toDateInputValue(leaf.startDate)}
                  onChange={(e) => onFieldChange(leafKey, 'startDate', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Окончание больничного
                <input
                  type="date"
                  value={toDateInputValue(leaf.endDate)}
                  onChange={(e) => onFieldChange(leafKey, 'endDate', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Заболевание
                <textarea
                  rows={2}
                  value={leaf.disease || ''}
                  onChange={(e) => onFieldChange(leafKey, 'disease', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Диагноз
                <textarea
                  rows={2}
                  value={leaf.diagnosis || ''}
                  onChange={(e) => onFieldChange(leafKey, 'diagnosis', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Рекомендации
                <textarea
                  rows={2}
                  value={leaf.recommendations || ''}
                  onChange={(e) => onFieldChange(leafKey, 'recommendations', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Статус
                <select
                  value={leaf.status || 'open'}
                  onChange={(e) => onFieldChange(leafKey, 'status', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                >
                  <option value="open">Открыт</option>
                  <option value="closed">Закрыт</option>
                </select>
              </label>
              <p className="medical-section-meta">
                Врач: {leaf.doctorName || '—'} • Обновлено: {formatDateTime(leaf.updatedAt)} • Статус: {leaf.status === 'open' ? 'Открыт' : 'Закрыт'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingSectionKey === leafKey || leaf.originalStatus === 'closed'}
                onClick={() => onSave(leaf)}
              >
                {savingSectionKey === leafKey ? 'Сохранение...' : 'Сохранить лист'}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
