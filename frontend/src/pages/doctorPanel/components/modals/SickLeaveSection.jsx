import { formatDateTime, toDateInputValue } from "../../utils/dateUtils";

export default function SickLeaveSection({
  sickLeaves = [],
  showHistory,
  onToggleHistory,
  onAddDraft,
  onFieldChange,
  onSave,
  savingSectionKey,
  getSickLeaveWithChanges,
  hasUnsavedChanges
}) {
  const allLeaves = sickLeaves || [];
  const openLeaves = allLeaves.filter(leaf => leaf.originalStatus === 'open');

  // Логика: если не смотрим историю, показываем либо один единственный открытый лист,
  // либо вообще ничего (чтобы сработал рендер пустой формы через кнопку "Добавить")
  const filteredLeaves = showHistory
    ? allLeaves.filter(leaf => leaf.originalStatus !== 'open') // В истории только закрытые
    : openLeaves.slice(0, 1); // В основном режиме только один текущий активный

  return (
    <div className="sick-leave-section">
      <div className="sick-leave-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onToggleHistory}
        >
          {showHistory ? 'Текущий больничный' : 'История больничных'}
        </button>
      </div>

      {filteredLeaves.length === 0 ? (
        <>
          {showHistory ? (
            <p className="empty-info">История больничных пуста.</p>
          ) : (
            <p className="empty-info">Загрузка активного листа...</p>
          )}
        </>
      ) : (
        filteredLeaves.map((leaf) => {
          const leafKey = leaf._id || leaf.tempId;
          const displayLeaf = getSickLeaveWithChanges ? getSickLeaveWithChanges(leaf) : leaf;
          const hasChanges = hasUnsavedChanges ? hasUnsavedChanges(leafKey) : false;
          return (
            <div key={leafKey} className={`medical-section-card sick-leave-card ${hasChanges ? 'unsaved-changes' : ''}`}>
              <label className="medical-section-field">
                Дата выдачи
                <input
                  type="date"
                  value={toDateInputValue(displayLeaf.issueDate)}
                  onChange={(e) => onFieldChange(leafKey, 'issueDate', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Начало больничного
                <input
                  type="date"
                  value={toDateInputValue(displayLeaf.startDate)}
                  onChange={(e) => onFieldChange(leafKey, 'startDate', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Окончание больничного
                <input
                  type="date"
                  value={toDateInputValue(displayLeaf.endDate)}
                  onChange={(e) => onFieldChange(leafKey, 'endDate', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Заболевание
                <textarea
                  rows={2}
                  value={displayLeaf.disease || ''}
                  onChange={(e) => onFieldChange(leafKey, 'disease', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Диагноз
                <textarea
                  rows={2}
                  value={displayLeaf.diagnosis || ''}
                  onChange={(e) => onFieldChange(leafKey, 'diagnosis', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Рекомендации
                <textarea
                  rows={2}
                  value={displayLeaf.recommendations || ''}
                  onChange={(e) => onFieldChange(leafKey, 'recommendations', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                />
              </label>
              <label className="medical-section-field">
                Статус
                <select
                  value={displayLeaf.status || 'open'}
                  onChange={(e) => onFieldChange(leafKey, 'status', e.target.value)}
                  disabled={leaf.originalStatus === 'closed'}
                >
                  <option value="open">Открыт</option>
                  <option value="closed">Закрыт</option>
                </select>
              </label>
              <p className="medical-section-meta">
                Врач: {leaf.doctorName || '—'} • Обновлено: {formatDateTime(leaf.updatedAt)} • Статус: {displayLeaf.status === 'open' ? 'Открыт' : 'Закрыт'}
                {hasChanges && <span className="unsaved-indicator"> • Есть несохраненные изменения</span>}
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
