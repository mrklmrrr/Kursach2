import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '../../../components/ui';
import { chatApi } from '../../../services/chatApi';
import { videoRoomApi } from '../../../services/videoRoomApi';
import { doctorPanelApi } from '../../../services/doctorPanelApi';
import { useAuth } from '../../../hooks/useAuth';
import { UserSidebar } from '../../../components/layout';
import DoctorSidebar from '../../doctorPanel/components/DoctorSidebar/DoctorSidebar';
import PatientProfileModal from '../../doctorPanel/components/modals/PatientProfileModal';
import './ChatRoom.css';

// Global socket instance to avoid reconnecting on every navigation
let globalSocket = null;
let globalSocketRef = { current: null };

// Message time cache
const messageTimeCache = new Map();
function formatMessageTime(timestamp) {
  if (messageTimeCache.has(timestamp)) {
    return messageTimeCache.get(timestamp);
  }
  
  const formatted = new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  messageTimeCache.set(timestamp, formatted);
  
  // Clean up old entries
  if (messageTimeCache.size > 500) {
    const keys = Array.from(messageTimeCache.keys());
    for (let i = 0; i < 100; i++) {
      messageTimeCache.delete(keys[i]);
    }
  }
  
  return formatted;
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function getBackendOriginSafe() {
  const fallbackOrigin = window.location.origin;
  const backendOrigin = (chatApi.getBackendOrigin?.() || '').trim();
  if (!backendOrigin) return fallbackOrigin;
  try {
    return new URL(backendOrigin).origin;
  } catch {
    return fallbackOrigin;
  }
}

// Message component for memoization
const MessageBubble = memo(function MessageBubble({ msg, isOwn, chatCompanion, resolveFileUrl }) {
  const isSystem = msg.messageType === 'system' || msg.sender === 'system';
  if (isSystem) {
    return (
      <div
        key={msg._id || msg.id || `${msg.timestamp}-${msg.message || 'system'}`}
        className="message-wrapper message-system"
      >
        <div className="message-bubble message-bubble--system">
          {msg.message ? <div>{msg.message}</div> : null}
        </div>
        <div className="message-time message-time--system">{formatMessageTime(msg.timestamp)}</div>
      </div>
    );
  }

  return (
    <div
      key={msg._id || msg.id || `${msg.timestamp}-${msg.message || 'media'}`}
      className={`message-wrapper ${isOwn ? 'user' : 'doctor'}`}
    >
      {!isOwn && <Avatar name={chatCompanion.name} src={chatCompanion.avatarUrl || undefined} size="small" />}
      <div>
        <div className="message-bubble">
          {msg.fileUrl && (msg.messageType === 'image' || String(msg.fileMimeType || '').startsWith('image/')) && (
            <img className="chat-media-preview" src={resolveFileUrl(msg.fileUrl)} alt={msg.fileName || 'Изображение'} />
          )}
          {msg.fileUrl && (msg.messageType === 'video' || String(msg.fileMimeType || '').startsWith('video/')) && (
            <video className="chat-media-preview" src={resolveFileUrl(msg.fileUrl)} controls />
          )}
          {msg.message ? <div>{msg.message}</div> : null}
        </div>
        <div className="message-time">{formatMessageTime(msg.timestamp)}</div>
      </div>
    </div>
  );
});

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [chatMeta, setChatMeta] = useState(null);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [startingVideo, setStartingVideo] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRingingOut, setIsRingingOut] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const companionFromState = location.state?.companion || null;
  const doctor = (companionFromState?.role === 'doctor'
    ? {
        id: companionFromState.id || id,
        name: companionFromState.name || 'Врач',
        specialty: companionFromState.specialty || 'Специалист',
        avatar: companionFromState.avatarUrl || '',
        avatarUrl: companionFromState.avatarUrl || ''
      }
    : location.state?.doctor) || {
    id,
    name: 'Врач',
    specialty: 'Специалист',
    avatar: '',
    avatarUrl: ''
  };
  const patientFromState = location.state?.patient || null;

  const isDoctor = user?.role === 'doctor';
  const isCurrentUserPatientSide = useMemo(() => {
    if (!isDoctor) return false;
    const currentId = String(user?.id || '');
    const currentLegacyId = String(user?.legacyId || '');
    const patientId = String(chatMeta?.patientId || patientFromState?.id || '');
    if (!patientId) return false;
    return patientId === currentId || patientId === currentLegacyId;
  }, [isDoctor, user?.id, user?.legacyId, chatMeta?.patientId, patientFromState?.id]);

  const chatCompanion = useMemo(() => isDoctor
    ? (isCurrentUserPatientSide
      ? {
          id: doctor.id || chatMeta?.doctorId,
          name: chatMeta?.doctorName || doctor.name || 'Врач',
          specialty: chatMeta?.specialty || doctor.specialty || 'Специалист',
          avatarUrl: doctor.avatarUrl || doctor.avatar || chatMeta?.doctorAvatarUrl || chatMeta?.doctorAvatar || '',
          isOnline: Boolean(
            chatMeta?.doctorIsOnline
            ?? companionFromState?.isOnline
            ?? doctor?.isOnline
          )
        }
      : {
          id: chatMeta?.patientId || patientFromState?.id,
          name: chatMeta?.patientName || patientFromState?.name || 'Пациент',
          specialty: 'Пациент',
          avatarUrl: chatMeta?.patientAvatarUrl || chatMeta?.patientAvatar || patientFromState?.avatarUrl || patientFromState?.avatar || '',
          isOnline: Boolean(
            chatMeta?.patientIsOnline
            ?? companionFromState?.isOnline
            ?? patientFromState?.isOnline
          )
        })
    : {
        id: doctor.id || chatMeta?.doctorId,
        // Prefer fresh API metadata over stale route state
        name: chatMeta?.doctorName || doctor.name || 'Врач',
        specialty: chatMeta?.specialty || doctor.specialty || 'Специалист',
        avatarUrl: doctor.avatarUrl || doctor.avatar || chatMeta?.doctorAvatarUrl || chatMeta?.doctorAvatar || '',
        isOnline: Boolean(
          chatMeta?.doctorIsOnline
          ?? companionFromState?.isOnline
          ?? doctor?.isOnline
        )
      },
  [isDoctor, isCurrentUserPatientSide, chatMeta, doctor, patientFromState, companionFromState]);

  // Smooth scroll only when new messages arrive (not on every render)
  const lastMessageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const loadStart = performance.now();
    const loadMessages = async () => {
      try {
        const { data: messagesData } = await chatApi.getMessages(id);

        // Extract chat metadata from messages response
        const currentChatMeta = {
          _id: messagesData.consultationId || id,
          doctorName: messagesData.doctorName,
          specialty: messagesData.specialty,
          doctorIsOnline: Boolean(messagesData.doctorIsOnline),
          patientId: messagesData.patientId || patientFromState?.id || null,
          patientName: messagesData.patientName || patientFromState?.name || null,
          patientAvatarUrl: messagesData.patientAvatarUrl || patientFromState?.avatarUrl || patientFromState?.avatar || null,
          patientIsOnline: Boolean(messagesData.patientIsOnline),
          doctorId: messagesData.doctorId || doctor.id || null,
          doctorAvatarUrl: messagesData.doctorAvatarUrl || ''
        };

        setChatMeta(currentChatMeta);
        const messagesArray = Array.isArray(messagesData.messages) ? messagesData.messages : [];
        setMessages(messagesArray);
      } catch (err) {
        console.error('[ChatRoom] Failed to load messages:', err);
        if (err.response?.status === 404) {
          setMessages([]);
          alert('Чат не найден или у вас нет доступа к этому чату');
        } else {
          setMessages([]);
        }
      } finally {
        setLoading(false);
        console.log('[ChatRoom] loadMessages:', performance.now() - loadStart, 'ms');
      }
    };

    loadMessages();

    // Reuse global socket if available
    if (!globalSocket && token) {
      console.log('[ChatRoom] Creating new socket connection');
      const socket = chatApi.connectSocket(token);
      globalSocket = socket;
      globalSocketRef.current = socket;
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[ChatRoom] Socket connected');
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('[ChatRoom] Socket disconnected');
        setSocketConnected(false);
      });

      socket.on('chat-error', (error) => {
        console.error('[ChatRoom] Socket error:', error);
      });
    } else if (token) {
      console.log('[ChatRoom] Reusing existing socket');
      socketRef.current = globalSocket;
    }

    // Join the chat room
    if (socketRef.current) {
      socketRef.current.emit('join-chat', id);
    }

    // Listen for new messages
    const handleMessage = (newMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMessage._id || m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    };

    const handleIncomingCall = (callData) => {
      if (isDoctor) return;
      if (!callData?.chatId || String(callData.chatId) !== String(id)) return;
      setIncomingCall(callData);
    };
    const handleCallAccepted = (callData) => {
      if (String(callData?.chatId) !== String(id)) return;
      setIsRingingOut(false);
    };
    const handleCallRejected = (callData) => {
      if (String(callData?.chatId) !== String(id)) return;
      setIsRingingOut(false);
      alert('Звонок отклонен');
    };

    socketRef.current?.on('new-message', handleMessage);
    socketRef.current?.on('video-call-incoming', handleIncomingCall);
    socketRef.current?.on('video-call-accepted', handleCallAccepted);
    socketRef.current?.on('video-call-rejected', handleCallRejected);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-message', handleMessage);
        socketRef.current.off('video-call-incoming', handleIncomingCall);
        socketRef.current.off('video-call-accepted', handleCallAccepted);
        socketRef.current.off('video-call-rejected', handleCallRejected);
        // Don't disconnect global socket
        if (socketRef.current === globalSocket) {
          // Keep socket alive for other chats
          socketRef.current = null;
        }
      }
    };
  }, [id, token, patientFromState, doctor.id, isDoctor]);

  const handleSend = useCallback(() => {
    if (!inputMsg.trim()) return;
    
    const messageText = inputMsg.trim();
    
    // Optimistically add message to UI
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      message: messageText,
      sender: isDoctor ? 'doctor' : 'user',
      senderId: user?.id ? String(user.id) : '',
      timestamp: new Date().toISOString(),
      messageType: 'text'
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setInputMsg('');
    
    // Send via socket
    if (socketRef.current) {
      socketRef.current.emit('send-message', { chatId: id, message: messageText });
    } else {
      // Fallback to HTTP API if socket not connected
      chatApi.sendMessage(id, messageText)
        .catch((err) => {
          console.error('Failed to send message:', err);
          setMessages((prev) => prev.filter(m => m._id !== tempMessage._id));
          alert('Не удалось отправить сообщение');
        });
    }
  }, [id, inputMsg, isDoctor, user?.id]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: savedMessage } = await chatApi.uploadAttachment(id, file, inputMsg.trim());
      if (savedMessage) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === savedMessage._id || m.id === savedMessage.id)) {
            return prev;
          }
          return [...prev, savedMessage];
        });
      }
      setInputMsg('');
    } catch (err) {
      console.error('Ошибка загрузки вложения', err);
      alert(err.response?.data?.message || 'Не удалось загрузить файл');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  };

  const isOwnMessage = useCallback((msg) => {
    if (!msg) return false;
    if (msg.messageType === 'system' || msg.sender === 'system') return false;

    const currentUserId = user?.id != null ? String(user.id) : '';
    const messageSenderId = msg.senderId != null ? String(msg.senderId) : '';

    if (currentUserId && messageSenderId) {
      return currentUserId === messageSenderId;
    }

    if (isDoctor) return msg.sender === 'doctor';
    return msg.sender === 'user';
  }, [isDoctor, user?.id]);

  const resolveFileUrl = useCallback((url) => {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (/^(data:|blob:)/i.test(raw)) return raw;

    const backendOrigin = getBackendOriginSafe();
    if (/^https?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        const currentHost = window.location.hostname;
        if (isLocalHost(parsed.hostname) && !isLocalHost(currentHost)) {
          return `${backendOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        return raw;
      }
      return raw;
    }
    return `${backendOrigin}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }, []);

  const handleHeaderProfileClick = () => {
    if (isDoctor) {
      const patientId = chatCompanion.id || chatMeta?.patientId;
      if (!patientId) return;

      const fallbackPatient = {
        id: patientId,
        name: chatCompanion.name || chatMeta?.patientName || 'Пациент',
        phone: '—',
        birthDate: '',
        consultationCount: 0
      };
      setSelectedPatientProfile(fallbackPatient);

      doctorPanelApi.getPatients()
        .then(({ data }) => {
          const patientIdStr = String(patientId);
          const matched = (Array.isArray(data) ? data : []).find((p) =>
            String(p.id) === patientIdStr || String(p._id) === patientIdStr || String(p.legacyId) === patientIdStr
          );
          if (matched) {
            setSelectedPatientProfile({
              ...matched,
              id: matched.id || matched._id || patientId
            });
          }
        })
        .catch(() => {
          // Keep fallback profile if patients list is temporarily unavailable.
        });
      return;
    }
    const doctorId = chatCompanion.id;
    if (doctorId) {
      navigate(`/doctors/${doctorId}`);
    }
  };

  const handleStartVideoChat = async () => {
    try {
      setStartingVideo(true);
      const response = await videoRoomApi.createRoom(id);
      const roomId = response?.data?.roomId || id;
      if (!socketRef.current) {
        throw new Error('Сокет не подключен');
      }
      socketRef.current.emit('video-call-invite', { chatId: id });
      setIsRingingOut(true);
      navigate(`/video-room/${roomId}`, {
        state: { consultationId: id }
      });
    } catch (err) {
      console.error('Ошибка при создании видео комнаты:', err);
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
      alert('Ошибка при создании видео комнаты: ' + (serverMessage || err.message || 'Неизвестная ошибка'));
    } finally {
      setStartingVideo(false);
    }
  };

  const handleAcceptCall = () => {
    if (!incomingCall || !socketRef.current) return;
    socketRef.current.emit('video-call-response', { chatId: incomingCall.chatId, accepted: true });
    navigate(`/video-room/${incomingCall.roomId}`, {
      state: { consultationId: incomingCall.chatId }
    });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall || !socketRef.current) return;
    socketRef.current.emit('video-call-response', { chatId: incomingCall.chatId, accepted: false });
    setIncomingCall(null);
  };

  const callDoctorName = incomingCall?.doctorName || chatCompanion.name || 'Врач';
  const callDoctorSpecialty = incomingCall?.doctorSpecialty || chatCompanion.specialty || 'Специалист';
  const callDoctorAvatar = incomingCall?.doctorAvatarUrl || chatCompanion.avatarUrl || '';

  const handleOpenMedicalRecordFromChat = (patient) => {
    const patientId = patient?.id || patient?._id || chatMeta?.patientId || chatCompanion.id;
    if (!patientId) return;
    navigate('/doctor/permit', {
      state: {
        openMedicalRecordForPatientId: patientId,
        openMedicalRecordTab: 'systems'
      }
    });
  };

  return (
    <div className={`chat-room-page ${isDoctor ? 'doctor-panel-page' : 'user-panel-page'}`}>
      {isDoctor && <DoctorSidebar profile={user} />}
      {!isDoctor && <UserSidebar />}
      <header className="chat-room-header">
        <button className="back-btn" onClick={() => navigate(isDoctor ? '/doctor/chats' : '/chats')}>
          <span className="material-icons">arrow_back</span>
        </button>
        <button
          type="button"
          className="chat-room-header-info"
          onClick={handleHeaderProfileClick}
        >
          <Avatar
            name={chatCompanion.name}
            src={chatCompanion.avatarUrl || undefined}
            size="small"
            showOnline={chatCompanion.isOnline}
          />
          <div>
            <div className="chat-room-doctor-name">{chatCompanion.name}</div>
            <div className="chat-room-doctor-spec">
              {chatCompanion.specialty}
              {!isDoctor ? ' • Открыть профиль' : ''}
              {!socketConnected && !loading && ' • Оффлайн'}
            </div>
          </div>
        </button>
        {isDoctor && (
          <button
            className="chat-room-video-btn"
            onClick={handleStartVideoChat}
            disabled={startingVideo || isRingingOut}
            title="Начать видеовызов с пациентом"
          >
            <span className="material-icons">{(startingVideo || isRingingOut) ? 'hourglass_top' : 'videocam'}</span>
          </button>
        )}
      </header>

      {isDoctor && isRingingOut && (
        <div className="chat-room-call-status">
          <span className="material-icons">ring_volume</span>
          Ожидание ответа пациента...
        </div>
      )}

      <div className="chat-room-container page-shell page-shell--no-bottom-nav">
        <div className="chat-room-messages">
          {loading ? (
            <div className="no-messages">Загрузка сообщений...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              Здесь пока нет сообщений.<br />
              Напишите первое сообщение врачу
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg._id || msg.id || `${msg.timestamp}-${msg.message || 'media'}`}
                msg={msg}
                isOwn={isOwnMessage(msg)}
                chatCompanion={chatCompanion}
                resolveFileUrl={resolveFileUrl}
              />
            ))
          )}
           <div ref={messagesEndRef} />
        </div>
 
        <div className="chat-room-input-area">
          <button className="chat-room-attach-btn" onClick={handlePickFile} disabled={uploading}>
            <span className="material-icons">{uploading ? 'hourglass_top' : 'attach_file'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Напишите сообщение..."
            onKeyPress={handleKeyPress}
          />
          <button className="chat-room-send-btn" onClick={handleSend}>
            <span className="material-icons">send</span>
          </button>
        </div>
 
        {isDoctor && (
          <PatientProfileModal
            patient={selectedPatientProfile}
            onOpenMedicalRecord={handleOpenMedicalRecordFromChat}
            onClose={() => setSelectedPatientProfile(null)}
          />
        )}

        {incomingCall && (
          <div className="chat-room-call-overlay">
            <div className="chat-room-call-modal">
              <div className="chat-room-call-icon-wrap" aria-hidden="true">
                <span className="material-icons">videocam</span>
              </div>
              <div className="chat-room-call-doctor">
                <Avatar name={callDoctorName} src={callDoctorAvatar || undefined} size="medium" />
                <div>
                  <h3>Входящий видеозвонок</h3>
                  <p className="chat-room-call-doctor-name">{callDoctorName}</p>
                  <p className="chat-room-call-doctor-spec">{callDoctorSpecialty}</p>
                </div>
              </div>
              <p className="chat-room-call-text">Врач приглашает вас к видеоконсультации.</p>
              <div className="chat-room-call-actions">
                <button type="button" className="chat-room-call-btn chat-room-call-btn-reject" onClick={handleRejectCall}>
                  <span className="material-icons">call_end</span>
                  Отклонить
                </button>
                <button type="button" className="chat-room-call-btn chat-room-call-btn-accept" onClick={handleAcceptCall}>
                  <span className="material-icons">call</span>
                  Присоединиться
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
