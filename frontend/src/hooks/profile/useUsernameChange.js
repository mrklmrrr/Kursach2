import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@services/authApi';
import { useAuth } from '@hooks/useAuth';

let checkTimer;

export const useUsernameChange = () => {
  const { user, refreshUser } = useAuth();
  const [value, setValue] = useState('');
  const [hint, setHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setValue(user?.username || '');
  }, [user?.username]);

  const runCheck = useCallback(
    async (raw) => {
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
        setHint(data.available ? 'Свободно' : 'Уже занят');
      } catch {
        setHint('');
      }
    },
    [user?.username]
  );

  const onChange = (e) => {
    const v = e.target.value.replace(/\s/g, '').replace(/[^a-zA-Z0-9_@]/g, '');
    setValue(v);
    setMessage({ type: '', text: '' });
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => runCheck(v), 380);
  };

  const save = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const trimmed = value.trim().replace(/^@+/, '');
    if (trimmed.length < 3) {
      setMessage({ type: 'error', text: 'Username: минимум 3 символа.' });
      return;
    }
    if (user?.username && trimmed.toLowerCase() === String(user.username).toLowerCase()) {
      setMessage({ type: 'error', text: 'Укажите новый username.' });
      return;
    }
    setSaving(true);
    try {
      await authApi.setUsername(trimmed);
      await refreshUser();
      setMessage({ type: 'success', text: 'Username обновлён.' });
      setHint('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Не удалось сохранить username'
      });
    } finally {
      setSaving(false);
    }
  };

  return { value, hint, saving, message, onChange, save };
};
