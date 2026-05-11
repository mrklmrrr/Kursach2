import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, BottomNav, UserSidebar } from '@components/layout';
import { ChatItem } from '@components/features';
import { Avatar, EmptyState } from '@components/ui';
import { chatApi } from '@services/chatApi';
import { getChatSocket } from '@services/chatSocket';
import { doctorApi } from '@services/doctorApi';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@contexts/ToastProvider/useToast';
import DoctorSidebar from '../../doctorPanel/components/DoctorSidebar/DoctorSidebar';
import './Chats.css';

let initialChatsLoadPromise = null;

function getChatSortTimestamp(chat) {
  const value = chat?.lastMessageTimestamp || chat?.updatedAt;
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

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
function normalizeChats(data, isDoctor, currentUserId, currentUserLegacyId) {
  const cacheKey = `${isDoctor ? 'doctor' : 'patient'}_${currentUserId || ''}_${currentUserLegacyId || ''}_${data.length}_${data
    .map((d) => `${d._id}:${d.updatedAt || ''}:${d.doctorName || ''}:${d.patientName || ''}:${d.specialty || ''}`)
    .join('|')}`;
  const cached = normalizeCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const normalized = data.map((chat) => {
    const companion = chat.companion || null;
    const meId = String(currentUserId || '');
    const meLegacyId = String(currentUserLegacyId || '');
    const isSelfOnPatientSide = String(chat.patientId || '') === meId || String(chat.patientId || '') === meLegacyId;
    const fallbackCompanion = isSelfOnPatientSide
      ? {
          role: 'doctor',
          name: chat.doctorName || 'Врач',
          avatarUrl: chat.doctorAvatarUrl || chat.doctorAvatar || '',
          specialty: chat.specialty || 'Специалист',
          isOnline: Boolean(chat.doctorIsOnline)
        }
      : {
          role: chat.patientRole || 'patient',
          name: chat.patientName || 'Пациент',
          avatarUrl: chat.patientAvatarUrl || chat.patientAvatar || '',
          specialty: (chat.patientRole === 'doctor' ? (chat.patientSpecialty || 'Специалист') : 'Пациент'),
          isOnline: Boolean(chat.patientIsOnline)
        };
    const resolvedCompanion = companion || fallbackCompanion;

    const lastMessageTimestamp = chat.lastMessage?.timestamp || chat.updatedAt || null;
    const unread = Number(chat.unreadCount || 0);

    return {
      id: chat._id,
      doctorId: chat.doctorId,
      doctorName: chat.doctorName || 'Врач',
      doctorAvatarUrl: chat.doctorAvatarUrl || chat.doctorAvatar || '',
      patientId: chat.patientId,
      patientName: chat.patientName || 'Пациент',
      patientAvatarUrl: chat.patientAvatarUrl || chat.patientAvatar || '',
      displayName: isDoctor ? (resolvedCompanion.name || 'Собеседник') : (chat.doctorName || 'Врач'),
      specialty: isDoctor ? (resolvedCompanion.specialty || 'Специалист') : (chat.specialty || 'Специалист'),
      lastMessage: (() => {
      const last = chat.lastMessage;
      if (!last) return 'Нет сообщений';

      const sender = String(last.sender || '').toLowerCase();
      if (sender === 'system' || last.messageType === 'system') {
        return last.message || 'Системное сообщение';
      }

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
      participantRole: isDoctor
        ? (resolvedCompanion.role || chat.patientRole || 'patient')
        : 'doctor',
      isInitialized: Number(chat.messageCount || 0) > 0,
      time: formatChatTime(chat.lastMessage?.timestamp || chat.updatedAt),
      unread,
      lastMessageTimestamp,
      avatarUrl: isDoctor
        ? (resolvedCompanion.avatarUrl || '')
        : (chat.doctorAvatarUrl || chat.doctorAvatar || ''),
      companion: resolvedCompanion,
      isOnline: isDoctor
        ? Boolean(resolvedCompanion.isOnline)
        : Boolean(chat.doctorIsOnline)
    };
  });
  
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
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [incomingCall, setIncomingCall] = useState(null);
  const [doctorDirectory, setDoctorDirectory] = useState([]);
  const [creatingDoctorChatId, setCreatingDoctorChatId] = useState('');
  const [doctorDirectoryLoading, setDoctorDirectoryLoading] = useState(false);
  const incomingCallSocketRef = useRef(null);
  const chatsRef = useRef([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const loadChats = useCallback(async () => {
    const loadStart = performance.now();
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const { data } = await chatApi.getChats();
      const isDoctor = user?.role === 'doctor';
      const normalized = normalizeChats(data, isDoctor, user?.id, user?.legacyId);
      if (isMountedRef.current) {
        const sorted = [...normalized].sort((a, b) => getChatSortTimestamp(b) - getChatSortTimestamp(a));
        setChats(sorted);
      }
      console.log('[Chats] Loaded', normalized.length, 'chats');
    } catch (err) {
      console.error('[Chats] Failed to load chats:', err);
      if (isMountedRef.current) {
        setError(err.response?.status === 429 
          ? 'Слишком много запросов. Пожалуйста, подождите немного.'
          : 'Не удалось загрузить чаты. Проверьте подключение к интернету.');
        setChats([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      console.log('[Chats] loadChats:', performance.now() - loadStart, 'ms');
    }
  }, [user?.role, user?.id, user?.legacyId]);

  const loadChatsWithCacheCheck = useCallback(async () => {
    const loadWithCacheStart = performance.now();
    await loadChats();
    console.log('[Chats] loadChatsWithCacheCheck:', performance.now() - loadWithCacheStart, 'ms');
  }, [loadChats]);

  useEffect(() => {
    if (!initialChatsLoadPromise) {
      initialChatsLoadPromise = loadChatsWithCacheCheck()
        .finally(() => {
          initialChatsLoadPromise = null;
        });
      return;
    }

    initialChatsLoadPromise.catch(() => {
      // Errors are already handled inside loadChats.
    });
  }, [loadChatsWithCacheCheck]);

  useEffect(() => {
    if (!isDoctor) {
      setDoctorDirectory([]);
      return;
    }

    let cancelled = false;
    setDoctorDirectoryLoading(true);
    doctorApi.getAll()
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setDoctorDirectory(list.filter((doctor) => String(doctor.id || doctor._id) !== String(user?.id)));
      })
      .catch((err) => {
        console.error('[Chats] Failed to load doctor directory:', err);
        if (!cancelled) setDoctorDirectory([]);
      })
      .finally(() => {
        if (!cancelled) setDoctorDirectoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isDoctor, user?.id]);

  const filteredChats = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const searchMatched = chats.filter((chat) => {
      const doctorName = String(chat.doctorName || '').toLowerCase();
      const patientName = String(chat.patientName || '').toLowerCase();
      const displayName = String(chat.displayName || '').toLowerCase();
      const specialty = String(chat.specialty || '').toLowerCase();
      const lastMessage = String(chat.lastMessage?.message || '').toLowerCase();

      const matchesSearch = !normalizedSearch
        || doctorName.includes(normalizedSearch)
        || patientName.includes(normalizedSearch)
        || displayName.includes(normalizedSearch)
        || specialty.includes(normalizedSearch)
        || lastMessage.includes(normalizedSearch);

      return matchesSearch;
    });

    // Doctors should see only initialized chats (non-empty message history).
    const initializedMatched = isDoctor
      ? searchMatched.filter((chat) => chat.isInitialized)
      : searchMatched;

    let filtered = initializedMatched;
    if (isDoctor) {
      if (participantFilter === 'doctors') {
        filtered = initializedMatched.filter((chat) => chat.participantRole === 'doctor');
      } else if (participantFilter === 'patients') {
        filtered = initializedMatched.filter((chat) => chat.participantRole === 'patient');
      }
    }

    return [...filtered].sort((a, b) => getChatSortTimestamp(b) - getChatSortTimestamp(a));
  }, [chats, searchTerm, participantFilter, isDoctor]);

  const doctorSearchResults = useMemo(() => {
    if (!isDoctor) return [];
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return [];

    return doctorDirectory
      .filter((doctor) => {
        const fullName = String(doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()).toLowerCase();
        const specialty = String(doctor.specialty || '').toLowerCase();
        return fullName.includes(normalized) || specialty.includes(normalized);
      })
      .slice(0, 8);
  }, [doctorDirectory, searchTerm, isDoctor]);

  const handleStartDoctorChat = useCallback(async (doctor) => {
    const targetDoctorId = String(doctor.id || doctor._id || '');
    if (!targetDoctorId) return;

    try {
      setCreatingDoctorChatId(targetDoctorId);
      const { data } = await chatApi.createDoctorChat(targetDoctorId);
      const consultationId = data?.data?.consultationId;
      if (!consultationId) {
        throw new Error('Не удалось получить идентификатор чата');
      }
      await loadChats();
      navigate(`/chat/${consultationId}`, {
        state: {
          doctor: {
            id: doctor.id || doctor._id,
            name: doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Врач',
            specialty: doctor.specialty || 'Специалист',
            avatar: doctor.avatarUrl || '',
            avatarUrl: doctor.avatarUrl || '',
          }
        }
      });
    } catch (err) {
      console.error('[Chats] Failed to start doctor chat:', err);
      showToast(err?.response?.data?.message || 'Не удалось начать чат с врачом', 'error');
    } finally {
      setCreatingDoctorChatId('');
    }
  }, [loadChats, navigate, showToast]);

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

  useEffect(() => {
    if (!token) return undefined;
    const socket = getChatSocket(token);
    incomingCallSocketRef.current = socket;

    const handleIncomingCall = (callData) => {
      if (isDoctor) return;
      if (!callData?.chatId || !callData?.roomId) return;
      const chat = chatsRef.current.find((item) => String(item.id) === String(callData.chatId));
      setIncomingCall({
        ...callData,
        doctorName: callData.doctorName || chat?.doctorName || 'Врач',
        doctorSpecialty: callData.doctorSpecialty || chat?.specialty || 'Специалист',
        doctorAvatarUrl: chat?.avatarUrl || ''
      });
    };

    const handleChatUpdated = ({ chatId, message } = {}) => {
      if (!chatId || !message) return;
      setChats((prev) => {
        const idx = prev.findIndex((chat) => String(chat.id) === String(chatId));
        if (idx === -1) {
          loadChats();
          return prev;
        }
        const sender = String(message.sender || '').toLowerCase();
        const senderLabel = sender === 'doctor'
          ? (isDoctor ? 'Вы' : 'Врач')
          : sender === 'user'
            ? (isDoctor ? 'Пациент' : 'Вы')
            : sender === 'admin'
              ? 'Администратор'
              : 'Собеседник';
        const content = message.message || (message.fileUrl ? 'Вложение' : 'Сообщение');
        const lastMessageText = (sender === 'system' || message.messageType === 'system')
          ? (message.message || 'Системное сообщение')
          : `${senderLabel}: ${content}`;

        const isIncoming = sender !== (isDoctor ? 'doctor' : 'user') && sender !== 'system';
        const nextUnread = isIncoming ? Number(prev[idx].unread || 0) + 1 : Number(prev[idx].unread || 0);

        const updatedChat = {
          ...prev[idx],
          lastMessage: lastMessageText,
          lastSender: sender,
          isInitialized: true,
          time: formatChatTime(message.timestamp || new Date().toISOString()),
          lastMessageTimestamp: message.timestamp || new Date().toISOString(),
          unread: nextUnread
        };
        const next = [...prev];
        next.splice(idx, 1);
        return [updatedChat, ...next];
      });
    };

    socket.on('video-call-incoming', handleIncomingCall);
    socket.on('chat-updated', handleChatUpdated);
    return () => {
      socket.off('video-call-incoming', handleIncomingCall);
      socket.off('chat-updated', handleChatUpdated);
      incomingCallSocketRef.current = null;
    };
  }, [token, isDoctor, loadChats]);

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    incomingCallSocketRef.current?.emit('video-call-response', { chatId: incomingCall.chatId, accepted: true });
    navigate(`/video-room/${incomingCall.roomId}`, {
      state: { consultationId: incomingCall.chatId }
    });
    setIncomingCall(null);
  };

  const handleRejectIncomingCall = () => {
    if (!incomingCall) return;
    incomingCallSocketRef.current?.emit('video-call-response', { chatId: incomingCall.chatId, accepted: false });
    setIncomingCall(null);
  };

  return (
    <div className={`chats-page ${isDoctor ? 'doctor-panel-page' : 'user-panel-page'}`}>
      {isDoctor && <DoctorSidebar profile={user} />}
      {!isDoctor && <UserSidebar />}
      <AppHeader />
      <div className="chats-content page-shell page-shell--flex-grow">
        <div className="section-title">
          {isDoctor ? 'Мои чаты' : 'Мои чаты с врачами'}
        </div>
        <div className="chats-controls">
          <div className="chat-search-wrap">
            <input
              type="text"
              className="chat-search-input"
              placeholder="Поиск по имени, специализации или сообщению..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isDoctor && searchTerm.trim() && (
              <div className="doctor-search-results doctor-search-results--inline">
                <div className="doctor-search-inline-title">Врачи</div>
                {doctorDirectoryLoading ? (
                  <div className="doctor-search-empty">Загрузка врачей...</div>
                ) : doctorSearchResults.length === 0 ? (
                  <div className="doctor-search-empty">Врачи не найдены</div>
                ) : (
                  doctorSearchResults.map((doctor) => {
                    const doctorId = String(doctor.id || doctor._id || '');
                    const doctorName = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Врач';
                    const isCreating = creatingDoctorChatId === doctorId;
                    return (
                      <button
                        key={doctorId}
                        type="button"
                        className="doctor-search-item"
                        onClick={() => handleStartDoctorChat(doctor)}
                        disabled={isCreating}
                      >
                        <div className="doctor-search-main">
                          <Avatar name={doctorName} src={doctor.avatarUrl || undefined} size="small" />
                          <div className="doctor-search-meta">
                            <div className="doctor-search-name">{doctorName}</div>
                            <div className="doctor-search-spec">{doctor.specialty || 'Специалист'}</div>
                          </div>
                        </div>
                        <span className="doctor-search-action">{isCreating ? 'Создание...' : 'Написать'}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
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
          <div className="chats-skeleton-list" role="status" aria-label="Загрузка чатов">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`chat-skeleton-${idx}`} className="chat-skeleton-item">
                <div className="chat-skeleton-avatar" />
                <div className="chat-skeleton-content">
                  <div className="chat-skeleton-header">
                    <div className="chat-skeleton-name" />
                    <div className="chat-skeleton-time" />
                  </div>
                  <div className="chat-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
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
      {incomingCall && (
        <div className="chats-call-overlay">
          <div className="chats-call-modal">
            <div className="chats-call-doctor">
              <Avatar
                name={incomingCall.doctorName}
                src={incomingCall.doctorAvatarUrl || undefined}
                size="medium"
              />
              <div>
                <h3>Входящий видеозвонок</h3>
                <p className="chats-call-doctor-name">{incomingCall.doctorName}</p>
                <p className="chats-call-doctor-spec">{incomingCall.doctorSpecialty}</p>
              </div>
            </div>
            <p className="chats-call-text">Врач приглашает вас к видеоконсультации.</p>
            <div className="chats-call-actions">
              <button type="button" className="btn btn-outline btn-medium chats-call-btn" onClick={handleRejectIncomingCall}>
                Отклонить
              </button>
              <button type="button" className="btn btn-primary btn-medium chats-call-btn" onClick={handleAcceptIncomingCall}>
                Присоединиться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
