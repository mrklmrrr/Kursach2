import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '../../../components/ui';
import { chatApi } from '../../../services/chatApi';
import './ChatRoom.css';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const doctor = location.state?.doctor || {
    id,
    name: 'Врач',
    specialty: 'Специалист',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data } = await chatApi.getMessages(id);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
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

  const resolveFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${chatApi.getBackendOrigin()}${url}`;
  };

  return (
    <div className="chat-room-page">
      <header className="chat-room-header">
        <button className="back-btn" onClick={() => navigate('/chats')}>
          <span className="material-icons">arrow_back</span>
        </button>
        <div className="chat-room-header-info">
          <Avatar name={doctor.name} size="small" />
          <div>
            <div className="chat-room-doctor-name">{doctor.name}</div>
            <div className="chat-room-doctor-spec">{doctor.specialty}</div>
          </div>
        </div>
      </header>

      <div className="chat-room-container">
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
              <div
                key={msg._id || msg.id || `${msg.timestamp}-${msg.message || 'media'}`}
                className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'doctor'}`}
              >
                {msg.sender === 'doctor' && <Avatar name={doctor.name} size="small" />}
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
      </div>
    </div>
  );
}
