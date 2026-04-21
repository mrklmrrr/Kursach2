import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dependentApi } from '../../../services/dependentApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { Button, Input } from '../../../components/ui';
import { RELATION_TYPES, GENDER_TYPES } from '../../../constants';
import './AddRelative.css';

const manualInitial = {
  name: '',
  age: '',
  relation: 'parent',
  birthDate: '',
  gender: '',
  phone: '',
  notes: '',
  allergies: '',
  chronicConditions: '',
};

export default function AddRelative() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('account');
  const [relativeUsername, setRelativeUsername] = useState('');
  const [relationAcc, setRelationAcc] = useState('parent');
  const [notesAcc, setNotesAcc] = useState('');
  const [form, setForm] = useState(manualInitial);
  const [saving, setSaving] = useState(false);

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    const u = relativeUsername.trim().replace(/^@+/, '');
    if (u.length < 3) {
      alert('Введите username (3–24 символа)');
      return;
    }
    setSaving(true);
    try {
      await dependentApi.create({
        relativeUsername: u,
        relation: relationAcc,
        notes: notesAcc.trim() || undefined,
      });
      navigate('/profile');
    } catch (err) {
      alert(err.response?.data?.message || 'Не удалось добавить');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dependentApi.create({
        name: form.name.trim(),
        age: form.age,
        relation: form.relation,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        allergies: form.allergies.trim() || undefined,
        chronicConditions: form.chronicConditions.trim() || undefined,
      });
      navigate('/profile');
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка добавления');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-relative-page">
      <AppHeader showBack backTo="/profile" />
      <div className="add-relative-inner page-shell page-shell--flex-grow">
        <h1 className="add-relative-title lux-heading">Родственники</h1>
        <p className="add-relative-lead">
          Основной сценарий — человек с отдельным аккаунтом в приложении: вы вводите его <strong>username</strong>.
          Запись к врачу и оплата остаются на стороне каждого взрослого пользователя.
        </p>

        <div className="ar-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'account'}
            className={`ar-mode-tab ${mode === 'account' ? 'active' : ''}`}
            onClick={() => setMode('account')}
          >
            По username
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'manual'}
            className={`ar-mode-tab ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            Без аккаунта
          </button>
        </div>

        {mode === 'account' && (
          <form className="add-relative-form ar-form-lux" onSubmit={handleSubmitAccount}>
            <label className="ar-label">Степень родства</label>
            <select className="ar-select" value={relationAcc} onChange={(e) => setRelationAcc(e.target.value)} required>
              {RELATION_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label className="ar-label">Username в приложении</label>
            <div className="ar-username-row">
              <span className="ar-at">@</span>
              <Input
                value={relativeUsername}
                onChange={(e) => setRelativeUsername(e.target.value.replace(/\s/g, '').replace(/[^a-zA-Z0-9_@]/g, ''))}
                placeholder="например oleg_petrov"
                autoComplete="off"
                required
              />
            </div>
            <p className="ar-hint">Человек должен быть зарегистрирован и указать такой же username в профиле.</p>

            <label className="ar-label">Заметка (необязательно)</label>
            <textarea
              className="ar-textarea"
              rows={2}
              value={notesAcc}
              onChange={(e) => setNotesAcc(e.target.value)}
              placeholder="Напоминание только для вас"
            />

            <Button type="submit" variant="primary" size="large" className="add-relative-submit" disabled={saving}>
              {saving ? 'Добавляем…' : 'Добавить'}
            </Button>
          </form>
        )}

        {mode === 'manual' && (
          <form className="add-relative-form" onSubmit={handleSubmitManual}>
            <p className="ar-manual-note">
              Если у человека нет телефона и аккаунта (например пожилой родственник), можно завести карточку вручную —
              без связи с чужим логином.
            </p>
            <label className="ar-label">ФИО</label>
            <Input name="name" placeholder="Имя и фамилия" value={form.name} onChange={handleManualChange} required />

            <div className="ar-row">
              <div>
                <label className="ar-label">Возраст (лет)</label>
                <Input name="age" type="number" min={0} max={130} placeholder="Напр. 78" value={form.age} onChange={handleManualChange} required />
              </div>
              <div>
                <label className="ar-label">Дата рождения</label>
                <input className="ar-input" type="date" name="birthDate" value={form.birthDate} onChange={handleManualChange} />
              </div>
            </div>

            <label className="ar-label">Степень родства</label>
            <select className="ar-select" name="relation" value={form.relation} onChange={handleManualChange} required>
              {RELATION_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label className="ar-label">Пол</label>
            <select className="ar-select" name="gender" value={form.gender} onChange={handleManualChange}>
              <option value="">Не указано</option>
              {GENDER_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>

            <label className="ar-label">Телефон</label>
            <Input name="phone" type="tel" placeholder="+375 …" value={form.phone} onChange={handleManualChange} />

            <label className="ar-label">Аллергии</label>
            <textarea
              className="ar-textarea"
              name="allergies"
              rows={2}
              placeholder="Лекарства, продукты…"
              value={form.allergies}
              onChange={handleManualChange}
            />

            <label className="ar-label">Хронические заболевания</label>
            <textarea
              className="ar-textarea"
              name="chronicConditions"
              rows={2}
              placeholder="Астма, диабет…"
              value={form.chronicConditions}
              onChange={handleManualChange}
            />

            <label className="ar-label">Заметки для врача</label>
            <textarea
              className="ar-textarea"
              name="notes"
              rows={2}
              value={form.notes}
              onChange={handleManualChange}
            />

            <Button type="submit" variant="primary" size="large" className="add-relative-submit" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить карточку'}
            </Button>
          </form>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
