import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, BottomNav, UserSidebar } from '@components/layout';
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
    doctorAvatarUrl: chat.doctorAvatarUrl || chat.doctorAvatar || '',
    patientId: chat.patientId,
    patientName: chat.patientName || 'Пациент',
    patientAvatarUrl: chat.patientAvatarUrl || chat.patientAvatar || '',
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
    lastSender: String(chat.lastMessage?.sender || '').toLowerCase(),
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
  const [searchTerm, setSearchTerm] = useState('');
  const [participantFilter, setParticipantFilter] = useState('all');

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
  const isPatient = user?.role === 'patient';

  const filteredChats = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const searchMatched = chats.filter((chat) => {
      const doctorName = String(chat.doctorName || '').toLowerCase();
      const patientName = String(chat.patientName || '').toLowerCase();
      const displayName = String(chat.displayName || '').toLowerCase();
      const specialty = String(chat.specialty || '').toLowerCase();
      const lastMessage = String(chat.lastMessage || '').toLowerCase();

      const matchesSearch = !normalizedSearch
        || doctorName.includes(normalizedSearch)
        || patientName.includes(normalizedSearch)
        || displayName.includes(normalizedSearch)
        || specialty.includes(normalizedSearch)
        || lastMessage.includes(normalizedSearch);

      return matchesSearch;
    });

    if (!isDoctor) {
      return searchMatched;
    }

    if (participantFilter === 'doctors') {
      return searchMatched.filter((chat) => chat.lastSender === 'doctor');
    }

    if (participantFilter === 'patients') {
      return searchMatched.filter((chat) => chat.lastSender === 'user');
    }

    return searchMatched;
  }, [chats, searchTerm, participantFilter]);

  useEffect(() => {
    // Redirect doctors from /chats to /doctor/chats
    if (isDoctor && !inDoctorPanel) {
      navigate('/doctor/chats', { replace: true });
      return;
    }
  }, [isDoctor, inDoctorPanel, navigate]);

  useEffect(() => {
    if (isDoctor) {
      setParticipantFilter('patients');
    } else {
      setParticipantFilter('all');
    }
  }, [isDoctor]);

  return (
    <div className={`chats-page ${isDoctor ? 'doctor-panel-page' : 'user-panel-page'}`}>
      {isDoctor && <DoctorSidebar profile={user} />}
      {!isDoctor && <UserSidebar />}
      <AppHeader />
      <div className="chats-content page-shell page-shell--flex-grow">
        <div className="section-title">
          {isDoctor ? 'Мои чаты с пациентами' : 'Мои чаты с врачами'}
        </div>
        <div className="chats-controls">
          <input
            type="text"
            className="chat-search-input"
            placeholder="Поиск по имени, специализации или сообщению..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isDoctor && (
            <div className="chat-role-filters" role="tablist" aria-label="Фильтр собеседников">
              <button
                type="button"
                role="tab"
                className={`chat-role-filter ${participantFilter === 'all' ? 'active' : ''}`}
                aria-selected={participantFilter === 'all'}
                onClick={() => setParticipantFilter('all')}
              >
                Все
              </button>
              <button
                type="button"
                role="tab"
                className={`chat-role-filter ${participantFilter === 'doctors' ? 'active' : ''}`}
                aria-selected={participantFilter === 'doctors'}
                onClick={() => setParticipantFilter('doctors')}
              >
                Врачи
              </button>
              <button
                type="button"
                role="tab"
                className={`chat-role-filter ${participantFilter === 'patients' ? 'active' : ''}`}
                aria-selected={participantFilter === 'patients'}
                onClick={() => setParticipantFilter('patients')}
              >
                Пациенты
              </button>
            </div>
          )}
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
        ) : filteredChats.length > 0 ? (
          <div className="chat-list">
            {filteredChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="card"
            icon="chat_bubble_outline"
            title={searchTerm.trim() || (isDoctor && participantFilter !== 'all') ? 'Чаты не найдены' : 'Пока нет диалогов'}
            description={
              searchTerm.trim() || (isDoctor && participantFilter !== 'all')
                ? 'Попробуйте изменить строку поиска или снять фильтры.'
                : isDoctor
                  ? 'Чаты появятся, когда пациенты напишут вам из записи или консультации.'
                  : 'Начните с записи к врачу — после приёма сможете продолжить общение в чате.'
            }
            action={
              isPatient ? (
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
