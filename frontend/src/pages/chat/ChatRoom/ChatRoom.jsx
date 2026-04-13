import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar } from '../../../components/ui';
import { getInitials } from '../../../utils/helpers';
import './ChatRoom.css';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`chat_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef(null);

  const doctor = location.state?.doctor || {
    id,
    name: 'Врач',
    specialty: 'Специалист',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${id}`, JSON.stringify(messages));
    }
  }, [messages, id]);

  const handleSend = useCallback(() => {
    if (!inputMsg.trim()) return;

    const newMessage = {
      id: Date.now(),
      message: inputMsg.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMsg('');
  }, [inputMsg]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
          {messages.length === 0 ? (
            <div className="no-messages">
              Здесь пока нет сообщений.<br />
              Напишите первое сообщение врачу
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'doctor'}`}
              >
                {msg.sender === 'doctor' && <Avatar name={doctor.name} size="small" />}
                <div>
                  <div className="message-bubble">{msg.message}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-room-input-area">
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
