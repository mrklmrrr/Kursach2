import { useState, useEffect } from 'react';
import { authApi } from '../../../services/authApi';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastProvider/useToast';
import { Button } from '../../../components/ui';

export default function ReminderSection() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState(user?.reminderEmail !== false);
  const [tg, setTg] = useState(Boolean(user?.reminderTelegram));
  const [tgName, setTgName] = useState(user?.telegramUsername || '');
  const [tgChatId, setTgChatId] = useState(user?.telegramChatId || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmail(user?.reminderEmail !== false);
    setTg(Boolean(user?.reminderTelegram));
    setTgName(user?.telegramUsername || '');
    setTgChatId(user?.telegramChatId || '');
  }, [user?.id, user?.reminderEmail, user?.reminderTelegram, user?.telegramUsername, user?.telegramChatId]);

  if (user?.role !== 'patient') return null;

  const save = async () => {
    setSaving(true);
    try {
      await authApi.updateReminderPreferences({
        reminderEmail: email,
        reminderTelegram: tg,
        telegramUsername: tgName,
        telegramChatId: tgChatId
      });
      await refreshUser();
      showToast('Настройки напоминаний сохранены', 'success');
    } catch (e) {
      showToast(e.response?.data?.message || 'Не удалось сохранить', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="section-card section-card--lux reminder-section-card">
      <h3>Напоминания</h3>
      <p className="empty-info">
        Напоминания о приёме — за сутки и за час до визита (email и/или Telegram, если включено).
        После назначения врача в Telegram приходит дата, список препаратов и рекомендации; раз в неделю бот может
        напоминать о сохранённых рекомендациях, если вы включили Telegram и указали chat_id.
      </p>
      <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
        Email
      </label>
      <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input type="checkbox" checked={tg} onChange={(e) => setTg(e.target.checked)} />
        Telegram (бот)
      </label>
      <input
        className="profile-inline-input"
        placeholder="Telegram chat_id (число)"
        value={tgChatId}
        onChange={(e) => setTgChatId(e.target.value)}
        style={{ marginBottom: 8, width: '100%', maxWidth: 320, padding: '10px 12px', borderRadius: 10, border: '2px solid #e5e7eb' }}
      />
      <p className="empty-info" style={{ fontSize: '0.82rem', marginBottom: 8 }}>
        Узнайте chat_id через @userinfobot или после команды /start вашего клинического бота. Username опционально:
      </p>
      <input
        className="profile-inline-input"
        placeholder="@username (опционально)"
        value={tgName}
        onChange={(e) => setTgName(e.target.value)}
        style={{ marginBottom: 12, width: '100%', maxWidth: 320, padding: '10px 12px', borderRadius: 10, border: '2px solid #e5e7eb' }}
      />
      <Button type="button" variant="primary" size="small" onClick={save} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </section>
  );
}
