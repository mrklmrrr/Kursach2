import { useEffect, useState, useCallback, useMemo } from 'react';
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
const CHATS_CACHE_TTL = 300000; // 5 minutes

// Memoized time formatting with cache
const timeCache = new Map();
function formatChatTime(value) {
  if (!value) return '';
  
  if (timeCache.has(value)) {
    return timeCache.get(value);
  }
  
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  
  const formatted = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  timeCache.set(value, formatted);
  
  // Clear old entries periodically
  if (timeCache.size > 100) {
    const now = Date.now();
    for (const [key] of timeCache) {
      if (now - Number(key) > 3600000) { // 1 hour
        timeCache.delete(key);
      }
    }
  }
  
  return formatted;
}

// Memoized chat normalization
const normalizeCache = new Map();
function normalizeChats(data, isDoctor) {
  const cacheKey = `${isDoctor ? 'doctor' : 'patient'}_${data.length}_${data.map(d => d._id).join(',')}`;
  const cached = normalizeCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const normalized = data.map((chat) => ({
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
  
  normalizeCache.set(cacheKey, normalized);
  
  // Clear old cache entries
  if (normalizeCache.size > 20) {
    const keys = Array.from(normalizeCache.keys());
    normalizeCache.delete(keys[0]);
  }
  
  return normalized;
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
    console.time('[Chats] loadChats');
    setLoading(true);
    setError(null);
    try {
      const { data } = await chatApi.getChats();
      const isDoctor = user?.role === 'doctor';
      const normalized = normalizeChats(data, isDoctor);
      setChats(normalized);
      console.log('[Chats] Loaded', normalized.length, 'chats');
    } catch (err) {
      console.error('[Chats] Failed to load chats:', err);
      setError(err.response?.status === 429 
        ? 'Слишком много запросов. Пожалуйста, подождите немного.'
        : 'Не удалось загрузить чаты. Проверьте подключение к интернету.');
      setChats([]);
    } finally {
      setLoading(false);
      console.timeEnd('[Chats] loadChats');
    }
  }, [user?.role]);

  const loadChatsWithCacheCheck = useCallback(async () => {
    console.time('[Chats] loadChatsWithCacheCheck');
    const cached = apiCache.get(CHATS_CACHE_KEY);
    if (cached && cached.length > 0) {
      console.log('[Chats] Using cached chats');
      const isDoctor = user?.role === 'doctor';
      setChats(normalizeChats(cached, isDoctor));
      setLoading(false);
      console.timeEnd('[Chats] loadChatsWithCacheCheck');
      return;
    }
    await loadChats();
    console.timeEnd('[Chats] loadChatsWithCacheCheck');
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
