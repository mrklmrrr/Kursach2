import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Modal } from '../../../components/ui';
import { chatApi } from '../../../services/chatApi';
import { videoRoomApi } from '../../../services/videoRoomApi';
import { useAuth } from '../../../hooks/useAuth';
import './ChatRoom.css';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [chatMeta, setChatMeta] = useState(null);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [startingVideo, setStartingVideo] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const doctor = location.state?.doctor || {
    id,
    name: 'Врач',
    specialty: 'Специалист',
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
      try {
        const [{ data: messagesData }, { data: chatsData = [] }] = await Promise.all([
          chatApi.getMessages(id),
          chatApi.getChats()
        ]);
        const currentChatMeta = chatsData.find((chat) => String(chat._id) === String(id)) || null;
        setChatMeta(currentChatMeta);
        setMessages(Array.isArray(messagesData.messages) ? messagesData.messages : []);
      } catch (err) {
        console.error('Не удалось загрузить сообщения', err);
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

    const token = localStorage.getItem('token');
    if (token) {
      const socket = chatApi.connectSocket(token);
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-chat', id);
      });

      socket.on('new-message', (message) => {
        setMessages((prev) => [...prev, message]);
      });
    }

    loadMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id]);

  const handleSend = useCallback(() => {
    if (!inputMsg.trim()) return;
    socketRef.current?.emit('send-message', { chatId: id, message: inputMsg.trim() });
    setInputMsg('');
  }, [id, inputMsg]);

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

    if (currentUserId && messageSenderId) {
      return currentUserId === messageSenderId;
    }

    if (isDoctor) return msg.sender === 'doctor';
    return msg.sender === 'user';
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
    <div className="chat-room-page">
      <header className="chat-room-header">
        <button className="back-btn" onClick={() => navigate('/chats')}>
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
              {isDoctor ? '' : ' • Открыть профиль'}
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
  );
}
