import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, BottomNav } from '@components/layout';
import { ChatItem } from '@components/features';
import { EmptyState } from '@components/ui';
import { chatApi } from '@services/chatApi';
import { apiCache } from '@services/cache';
import { useAuth } from '@hooks/useAuth';
import DoctorSidebar from '../../doctorPanel/components/DoctorSidebar/DoctorSidebar';
import './Chats.css';

const CHATS_CACHE_KEY = 'chats_list';

function formatChatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function normalizeChats(data, isDoctor) {
  return data.map((chat) => ({
    id: chat._id,
    doctorId: chat.doctorId,
    doctorName: chat.doctorName || 'Врач',
    patientName: chat.patientName || 'Пациент',
    displayName: isDoctor ? (chat.patientName || 'Пациент') : (chat.doctorName || 'Врач'),
    specialty: chat.specialty || 'Специалист',
    lastMessage: (() => {
      const last = chat.lastMessage;
      if (!last) return 'Нет сообщений';

      const sender = String(last.sender || '').toLowerCase();
      const senderLabel = sender === 'doctor'
        ? (isDoctor ? 'Вы' : 'Врач')
        : sender === 'user'
          ? (isDoctor ? 'Пациент' : 'Вы')
          : sender === 'admin'
            ? 'Администратор'
            : 'Собеседник';

      const content = last.message || (last.fileUrl ? 'Вложение' : 'Сообщение');
      return `${senderLabel}: ${content}`;
    })(),
    time: formatChatTime(chat.lastMessage?.timestamp || chat.updatedAt),
    unread: 0,
    avatarUrl: isDoctor
      ? (chat.patientAvatarUrl || chat.patientAvatar || '')
      : (chat.doctorAvatarUrl || chat.doctorAvatar || ''),
    isOnline: false
  }));
}

/**
 * @param {Object} props
 * @param {boolean} [props.inDoctorPanel] - Если true, используется внутри DoctorPanel (без sidebar/header/footer)
 */
export default function Chats({ inDoctorPanel = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await chatApi.getChats();
      const isDoctor = user?.role === 'doctor';
      const normalized = normalizeChats(data, isDoctor);
      setChats(normalized);
    } catch (err) {
      console.error('Не удалось загрузить чаты', err);
      setError(err.response?.status === 429 
        ? 'Слишком много запросов. Пожалуйста, подождите немного.'
        : 'Не удалось загрузить чаты. Проверьте подключение к интернету.');
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const loadChatsWithCacheCheck = useCallback(async () => {
    const cached = apiCache.get(CHATS_CACHE_KEY);
    if (cached && cached.length > 0) {
      const isDoctor = user?.role === 'doctor';
      setChats(normalizeChats(cached, isDoctor));
      setLoading(false);
      return;
    }
    await loadChats();
  }, [loadChats, user?.role]);

  useEffect(() => {
    loadChatsWithCacheCheck();
  }, [loadChatsWithCacheCheck]);

  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    // Redirect doctors from /chats to /doctor/chats
    if (isDoctor && !inDoctorPanel) {
      navigate('/doctor/chats', { replace: true });
      return;
    }
  }, [isDoctor, inDoctorPanel, navigate]);

  return (
    <div className={`chats-page ${isDoctor ? 'doctor-panel-page' : ''}`}>
      {isDoctor && <DoctorSidebar profile={user} />}
      <AppHeader />
      <div className="chats-content page-shell page-shell--flex-grow">
        <div className="section-title">
          {isDoctor ? 'Мои чаты с пациентами' : 'Мои чаты с врачами'}
        </div>
        {loading ? (
          <div className="empty-state">Загрузка чатов...</div>
        ) : error ? (
          <div className="empty-state">
            <div>{error}</div>
            <button 
              type="button" 
              className="btn btn-primary btn-medium" 
              style={{ marginTop: '1rem' }}
              onClick={loadChats}
            >
              Повторить
            </button>
          </div>
        ) : chats.length > 0 ? (
          <div className="chat-list">
            {chats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="card"
            icon="chat_bubble_outline"
            title="Пока нет диалогов"
            description={
              isDoctor
                ? 'Чаты появятся, когда пациенты напишут вам из записи или консультации.'
                : 'Начните с записи к врачу — после приёма сможете продолжить общение в чате.'
            }
            action={
              user?.role === 'patient' ? (
                <button type="button" className="btn btn-primary btn-medium" onClick={() => navigate('/doctors')}>
                  Записаться к врачу
                </button>
              ) : null
            }
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
