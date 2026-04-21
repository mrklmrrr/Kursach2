import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../../services/authApi';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastProvider/useToast';
import { Button, Input } from '../../../components/ui';

let checkTimer;
export default function UsernameSection() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [value, setValue] = useState('');
  const [hint, setHint] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(user?.username || '');
  }, [user?.username]);

  const runCheck = useCallback(async (raw) => {
    const v = String(raw || '').trim().replace(/^@+/, '');
    if (v.length < 3) {
      setHint('');
      return;
    }
    if (user?.username && v.toLowerCase() === String(user.username).toLowerCase()) {
      setHint('Это ваш текущий username');
      return;
    }
    try {
      const { data } = await authApi.checkUsername(v);
      if (!data.ok && data.reason === 'format') {
        setHint(data.message || '3–24 символа, латиница, цифры, _');
        return;
      }
      if (data.available) {
        setHint('Свободно');
      } else {
        setHint('Уже занят');
      }
    } catch {
      setHint('');
    }
  }, [user?.username]);

  const onChange = (e) => {
    const v = e.target.value.replace(/\s/g, '').replace(/[^a-zA-Z0-9_@]/g, '');
    setValue(v);
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => runCheck(v), 380);
  };

  const save = async () => {
    setSaving(true);
    try {
      await authApi.setUsername(value.trim());
      await refreshUser();
      showToast('Username сохранён', 'success');
      setHint('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Не удалось сохранить', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'patient') return null;

  return (
    <section className="section-card section-card--lux username-section">
      <h3 className="lux-heading">Ваш username</h3>
      <p className="username-lead">
        Уникальный ник в приложении: по нему вас могут добавить в «родственники» только зарегистрированные пользователи
        (например взрослые родственники с собственным аккаунтом).
      </p>
      <div className="username-row">
        <span className="username-at" aria-hidden>@</span>
        <Input
          className="username-input"
          value={value}
          onChange={onChange}
          placeholder="например maria_ivanova"
          autoComplete="username"
        />
      </div>
      {hint && <p className={`username-hint ${hint === 'Свободно' ? 'ok' : hint === 'Уже занят' ? 'bad' : ''}`}>{hint}</p>}
      <Button type="button" variant="primary" size="small" onClick={save} disabled={saving || !value.trim()}>
        {saving ? 'Сохранение…' : 'Сохранить username'}
      </Button>
    </section>
  );
}
