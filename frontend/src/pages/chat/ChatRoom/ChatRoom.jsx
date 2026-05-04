import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Modal } from '../../../components/ui';
import { chatApi } from '../../../services/chatApi';
import { videoRoomApi } from '../../../services/videoRoomApi';
import { useAuth } from '../../../hooks/useAuth';
import DoctorSidebar from '../../doctorPanel/components/DoctorSidebar/DoctorSidebar';
import './ChatRoom.css';

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
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [startingVideo, setStartingVideo] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const doctor = location.state?.doctor || {
    id,
    name: 'Врач',
    specialty: 'Специалист',
    avatar: '',
    avatarUrl: ''
  };

  const isDoctor = user?.role === 'doctor';
  const chatCompanion = isDoctor
    ? {
        id: chatMeta?.patientId,
        name: chatMeta?.patientName || 'Пациент',
        specialty: 'Пациент',
        avatarUrl: chatMeta?.patientAvatarUrl || chatMeta?.patientAvatar || ''
      }
    : {
        id: doctor.id || chatMeta?.doctorId,
        name: doctor.name || chatMeta?.doctorName || 'Врач',
        specialty: doctor.specialty || chatMeta?.specialty || 'Специалист',
        avatarUrl: doctor.avatarUrl || doctor.avatar || chatMeta?.doctorAvatarUrl || chatMeta?.doctorAvatar || ''
      };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      console.log('[ChatRoom] Loading messages for chat:', id);
      try {
        const { data: messagesData } = await chatApi.getMessages(id);

        console.log('[ChatRoom] Messages loaded:', messagesData);

        // Extract chat metadata from messages response
        const currentChatMeta = {
          _id: messagesData.consultationId || id,
          doctorName: messagesData.doctorName,
          specialty: messagesData.specialty,
          patientId: messagesData.patientId || null,
          patientName: messagesData.patientName || null,
          patientAvatarUrl: messagesData.patientAvatarUrl || null,
          doctorId: null,
          doctorAvatarUrl: messagesData.doctorAvatarUrl || ''
        };

        setChatMeta(currentChatMeta);
        const messagesArray = Array.isArray(messagesData.messages) ? messagesData.messages : [];
        console.log('[ChatRoom] Messages array:', messagesArray);
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
      }
    };

    loadMessages();

    // Connect to socket for real-time messages
    if (token) {
      console.log('[ChatRoom] Connecting to socket...');
      const socket = chatApi.connectSocket(token);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[ChatRoom] Socket connected');
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('[ChatRoom] Socket disconnected');
        setSocketConnected(false);
      });

      // Join the chat room
      console.log('[ChatRoom] Joining chat room:', id);
      socket.emit('join-chat', id);

      // Listen for new messages
      socket.on('new-message', (newMessage) => {
        console.log('[ChatRoom] New message received:', newMessage);
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === newMessage._id || m.id === newMessage.id)) {
            console.log('[ChatRoom] Message already exists, skipping');
            return prev;
          }
          console.log('[ChatRoom] Adding new message to list');
          return [...prev, newMessage];
        });
      });

      // Handle socket errors
      socket.on('chat-error', (error) => {
        console.error('[ChatRoom] Socket error:', error);
      });

      return () => {
        console.log('[ChatRoom] Cleaning up socket');
        socket.off('new-message');
        socket.off('chat-error');
        socket.off('connect');
        socket.off('disconnect');
        socket.disconnect();
      };
    } else {
      console.warn('[ChatRoom] No token available, socket will not connect');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id, token]);

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
        .then(() => {
          console.log('Message sent via HTTP');
        })
        .catch((err) => {
          console.error('Failed to send message:', err);
          // Remove temp message on error
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
      await chatApi.uploadAttachment(id, file, inputMsg.trim());
      setInputMsg('');
    } catch (err) {
      console.error('Ошибка загрузки вложения', err);
      alert(err.response?.data?.message || 'Не удалось загрузить файл');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnMessage = useCallback((msg) => {
    if (!msg) return false;

    const currentUserId = user?.id != null ? String(user.id) : '';
    const messageSenderId = msg.senderId != null ? String(msg.senderId) : '';

    console.log('[ChatRoom] isOwnMessage check:', { currentUserId, messageSenderId, sender: msg.sender });

    // First try to match by senderId
    if (currentUserId && messageSenderId) {
      const isOwn = currentUserId === messageSenderId;
      console.log('[ChatRoom] Matched by senderId:', isOwn);
      return isOwn;
    }

    // Fallback to sender field for backwards compatibility
    const isOwn = isDoctor ? msg.sender === 'doctor' : msg.sender === 'user';
    console.log('[ChatRoom] Matched by sender:', isOwn);
    return isOwn;
  }, [isDoctor, user?.id]);

  const resolveFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${chatApi.getBackendOrigin()}${url}`;
  };

  const handleHeaderProfileClick = () => {
    if (isDoctor) {
      setShowPatientProfile(true);
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
      // Create video room using consultation ID (chatId)
      const room = await videoRoomApi.createRoom(id);
      navigate(`/video-room/${room._id || id}`, { 
        state: { consultationId: id } 
      });
    } catch (err) {
      console.error('Ошибка при создании видео комнаты:', err);
      alert('Ошибка при создании видео комнаты: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setStartingVideo(false);
    }
  };

  return (
    <div className={`chat-room-page ${isDoctor ? 'doctor-panel-page' : ''}`}>
      {isDoctor && <DoctorSidebar profile={user} />}
      <header className="chat-room-header">
        <button className="back-btn" onClick={() => navigate(isDoctor ? '/doctor/chats' : '/chats')}>
          <span className="material-icons">arrow_back</span>
        </button>
        <button
          type="button"
          className="chat-room-header-info"
          onClick={handleHeaderProfileClick}
        >
          <Avatar name={chatCompanion.name} src={chatCompanion.avatarUrl || undefined} size="small" />
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
            disabled={startingVideo}
            title="Начать видеовызов с пациентом"
          >
            <span className="material-icons">{startingVideo ? 'hourglass_top' : 'videocam'}</span>
          </button>
        )}
      </header>

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
            messages.map((msg) => {
              const own = isOwnMessage(msg);
              return (
              <div
                key={msg._id || msg.id || `${msg.timestamp}-${msg.message || 'media'}`}
                className={`message-wrapper ${own ? 'user' : 'doctor'}`}
              >
                {!own && <Avatar name={chatCompanion.name} src={chatCompanion.avatarUrl || undefined} size="small" />}
                <div>
                  <div className="message-bubble">
                    {msg.fileUrl && msg.messageType === 'image' && (
                      <img className="chat-media-preview" src={resolveFileUrl(msg.fileUrl)} alt={msg.fileName || 'Изображение'} />
                    )}
                    {msg.fileUrl && msg.messageType === 'video' && (
                      <video className="chat-media-preview" src={resolveFileUrl(msg.fileUrl)} controls />
                    )}
                    {msg.message ? <div>{msg.message}</div> : null}
                  </div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
              );
            })
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
        <Modal open={showPatientProfile} onClose={() => setShowPatientProfile(false)}>
          <Modal.Overlay>
            <Modal.Content>
              <Modal.Header>
                <h3>Профиль пациента</h3>
              </Modal.Header>
 
              <Modal.Body>
                <p><strong>Имя:</strong> {chatMeta?.patientName || 'Пациент'}</p>
                <p><strong>ID:</strong> {chatMeta?.patientId || '—'}</p>
                {chatMeta?.patientAvatarUrl && (
                  <img 
                    src={chatMeta.patientAvatarUrl} 
                    alt="Аватар пациента" 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      marginTop: '12px'
                    }} 
                  />
                )}
              </Modal.Body>
 
              <Modal.Footer>
                <button type="button" className="btn btn-primary" onClick={() => setShowPatientProfile(false)}>
                  Закрыть
                </button>
              </Modal.Footer>
            </Modal.Content>
          </Modal.Overlay>
        </Modal>
        )}
      </div>
    </div>
  );
}
