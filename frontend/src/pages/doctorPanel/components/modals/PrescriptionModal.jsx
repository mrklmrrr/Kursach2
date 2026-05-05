import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@components/ui';
import { prescriptionApi } from '../../../../services/prescriptionApi';
import { useToast } from '../../../../contexts/ToastProvider/useToast';
import './PrescriptionModal.css';

const createEmptyItem = () => ({ name: '', dosage: '', notes: '' });
const createEmptyBlock = (index = 0) => ({ title: `Блок ${index + 1}`, items: [createEmptyItem()] });

export default function PrescriptionModal({ patient, onClose, onSaved }) {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [blocks, setBlocks] = useState([createEmptyBlock(0)]);
  const [recommendations, setRecommendations] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!patient?.id) return;
    let cancelled = false;
    setListLoading(true);
    prescriptionApi
      .listForDoctorPatient(patient.id)
      .then((res) => {
        if (!cancelled) setList(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) showToast('Не удалось загрузить назначения пациента', 'error');
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patient?.id, showToast]);

  const sortedList = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (!query) return source;
    return source.filter((doc) => {
      const doctor = String(doc.doctorName || '').toLowerCase();
      const itemsText = (doc.items || [])
        .map((it) => [it.name, it.dosage, it.notes].filter(Boolean).join(' '))
        .join(' ')
        .toLowerCase();
      const rec = String(doc.recommendations || '').toLowerCase();
      return doctor.includes(query) || itemsText.includes(query) || rec.includes(query);
    });
  }, [list, search]);

  const resetForm = () => {
    setEditingId(null);
    setBlocks([createEmptyBlock(0)]);
    setRecommendations('');
  };

  const startEdit = (doc) => {
    const normalizedBlocks = Array.isArray(doc.blocks) && doc.blocks.length > 0
      ? doc.blocks
      : [{ title: 'Основные назначения', items: doc.items || [] }];
    setEditingId(doc._id);
    setBlocks(
      normalizedBlocks.map((block, idx) => ({
        title: block.title || `Блок ${idx + 1}`,
        items: (block.items || []).length > 0 ? block.items : [createEmptyItem()]
      }))
    );
    setRecommendations(doc.recommendations || '');
  };

  const addBlock = () => setBlocks((prev) => [...prev, createEmptyBlock(prev.length)]);

  const removeBlock = (blockIndex) => {
    setBlocks((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== blockIndex);
    });
  };

  const updateBlock = (blockIndex, title) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIndex] = { ...next[blockIndex], title };
      return next;
    });
  };

  const addRow = (blockIndex) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIndex] = { ...next[blockIndex], items: [...next[blockIndex].items, createEmptyItem()] };
      return next;
    });
  };

  const removeRow = (blockIndex, rowIndex) => {
    setBlocks((prev) => {
      const next = [...prev];
      const items = next[blockIndex].items.filter((_, i) => i !== rowIndex);
      next[blockIndex] = { ...next[blockIndex], items: items.length > 0 ? items : [createEmptyItem()] };
      return next;
    });
  };

  const updateRow = (blockIndex, rowIndex, field, value) => {
    setBlocks((prev) => {
      const next = [...prev];
      const items = [...next[blockIndex].items];
      items[rowIndex] = { ...items[rowIndex], [field]: value };
      next[blockIndex] = { ...next[blockIndex], items };
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const cleanBlocks = blocks
      .map((block, index) => ({
        title: String(block.title || `Блок ${index + 1}`).trim(),
        items: (block.items || [])
          .map((it) => ({
            name: String(it.name || '').trim(),
            dosage: String(it.dosage || '').trim(),
            notes: String(it.notes || '').trim()
          }))
          .filter((it) => it.name)
      }))
      .filter((block) => block.items.length > 0);

    if (cleanBlocks.length === 0) {
      showToast('Добавьте хотя бы одно название препарата', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patientId: patient.id,
        blocks: cleanBlocks,
        recommendations: recommendations.trim() || undefined
      };
      if (editingId) {
        await prescriptionApi.update(editingId, payload);
        showToast('Назначения обновлены', 'success');
      } else {
        await prescriptionApi.create(payload);
        showToast('Назначения сохранены', 'success');
      }
      const refreshed = await prescriptionApi.listForDoctorPatient(patient.id);
      setList(Array.isArray(refreshed.data) ? refreshed.data : []);
      resetForm();
      onSaved?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isOpen = Boolean(patient);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Modal.Overlay>
        <Modal.Content className="modal-content--prescription" aria-labelledby="rx-title">
          <Modal.Header>
            <h2 id="rx-title">Назначения: {patient?.name}</h2>
          </Modal.Header>

          <Modal.Body>
            <form id="rx-form" onSubmit={submit}>
              <div className="rx-existing">
                <div className="rx-existing-head">
                  <h4>История назначений</h4>
                  <input
                    className="rx-search"
                    placeholder="Поиск по назначениям"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {listLoading ? <p className="empty-info">Загрузка...</p> : null}
                {!listLoading && sortedList.length === 0 ? (
                  <p className="empty-info">Сохранённых назначений пока нет.</p>
                ) : (
                  <div className="rx-existing-list">
                    {sortedList.slice(0, 6).map((doc) => (
                      <button
                        key={doc._id}
                        type="button"
                        className={`rx-existing-item ${editingId === doc._id ? 'active' : ''}`}
                        onClick={() => startEdit(doc)}
                      >
                        <strong>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ru-RU') : 'Без даты'}</strong>
                        <span>{doc.doctorName || 'Врач'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rx-form-head">
                <h4>{editingId ? 'Редактирование назначения' : 'Новое назначение'}</h4>
                {editingId ? (
                  <button type="button" className="rx-add" onClick={resetForm}>
                    + Новое назначение
                  </button>
                ) : null}
              </div>

              {blocks.map((block, blockIndex) => (
                <div key={`block-${blockIndex}`} className="rx-block">
                  <div className="rx-block-head">
                    <input
                      className="rx-block-title"
                      placeholder="Название блока (например: Утро, Витамины, Терапия)"
                      value={block.title}
                      onChange={(e) => updateBlock(blockIndex, e.target.value)}
                    />
                    <button type="button" className="rx-add" onClick={() => removeBlock(blockIndex)}>
                      Удалить блок
                    </button>
                  </div>
                  {block.items.map((row, rowIndex) => (
                    <div key={`row-${blockIndex}-${rowIndex}`} className="rx-row">
                      <input
                        placeholder="Препарат"
                        value={row.name}
                        onChange={(e) => updateRow(blockIndex, rowIndex, 'name', e.target.value)}
                        required={blockIndex === 0 && rowIndex === 0}
                      />
                      <input
                        placeholder="Дозировка"
                        value={row.dosage}
                        onChange={(e) => updateRow(blockIndex, rowIndex, 'dosage', e.target.value)}
                      />
                      <input
                        placeholder="Комментарий"
                        value={row.notes}
                        onChange={(e) => updateRow(blockIndex, rowIndex, 'notes', e.target.value)}
                      />
                      <button type="button" className="rx-row-remove" onClick={() => removeRow(blockIndex, rowIndex)}>
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" className="rx-add" onClick={() => addRow(blockIndex)}>
                    + Добавить строку
                  </button>
                </div>
              ))}

              <button type="button" className="rx-add" onClick={addBlock}>
                + Добавить блок
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
            </form>
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="rx-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="rx-save" form="rx-form" disabled={saving}>
              {saving ? 'Сохранение...' : editingId ? 'Обновить' : 'Сохранить'}
            </button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Overlay>
    </Modal>
  );
}
