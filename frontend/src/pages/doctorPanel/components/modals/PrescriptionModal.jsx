import { useState } from 'react';
import { prescriptionApi } from '../../../../services/prescriptionApi';
import { useToast } from '../../../../contexts/ToastProvider/useToast';
import './PrescriptionModal.css';


export default function PrescriptionModal({ patient, onClose, onSaved }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([{ name: '', dosage: '', notes: '' }]);
  const [recommendations, setRecommendations] = useState('');
  const [saving, setSaving] = useState(false);

  const addRow = () => setItems((prev) => [...prev, { name: '', dosage: '', notes: '' }]);

  const updateRow = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const clean = items.filter((it) => it.name.trim());
    if (clean.length === 0) {
      showToast('Добавьте хотя бы одно название препарата', 'error');
      return;
    }
    setSaving(true);
    try {
      await prescriptionApi.create({
        patientId: patient.id,
        items: clean,
        recommendations: recommendations.trim() || undefined
      });
      showToast('Назначения сохранены', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rx-overlay" role="presentation" onClick={onClose}>
      <div
        className="rx-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rx-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="rx-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 id="rx-title">Назначения: {patient?.name}</h2>
        <form onSubmit={submit}>
          {items.map((row, i) => (
            <div key={i} className="rx-row">
              <input
                placeholder="Препарат"
                value={row.name}
                onChange={(e) => updateRow(i, 'name', e.target.value)}
                required={i === 0}
              />
              <input
                placeholder="Дозировка"
                value={row.dosage}
                onChange={(e) => updateRow(i, 'dosage', e.target.value)}
              />
              <input
                placeholder="Комментарий"
                value={row.notes}
                onChange={(e) => updateRow(i, 'notes', e.target.value)}
              />
            </div>
          ))}
          <button type="button" className="rx-add" onClick={addRow}>
            + Строка
          </button>
          <label className="rx-rec-label" htmlFor="rx-rec">Рекомендации врача</label>
          <textarea
            id="rx-rec"
            className="rx-rec-textarea"
            rows={3}
            placeholder="Режим, диета, контрольные визиты — пациент получит это в Telegram вместе с препаратами"
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
          />
          <div className="rx-actions">
            <button type="button" className="rx-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="rx-save" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
