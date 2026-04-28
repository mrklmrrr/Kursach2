import { useState } from 'react';
import { authApi } from '@services/authApi';

export const usePasswordChange = () => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Заполните все поля пароля.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Новый пароль должен быть не короче 6 символов.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Подтверждение пароля не совпадает.' });
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Пароль успешно изменен.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Не удалось изменить пароль'
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    passwordForm,
    saving,
    message,
    handlePasswordChange,
    handleChangePassword
  };
};