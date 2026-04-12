import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

export default function ChatRoom() {
  const { id } = useParams();
  const location = useLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doctor = location.state?.doctor || { name: 'Врач', id: id };
  const [inputMsg, setInputMsg] = useState('');
  const [consultationId, setConsultationId] = useState(null);
  const { messages, sendMessage } = useSocket(consultationId || id);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Создаём консультацию для чата, если её нет
  useEffect(() => {
    const createChatConsultation = async () => {
      try {
        const res = await api.post('/consultations', {
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialty: doctor.specialty || 'Чат',
          price: 0,
          duration: 0,
          patientId: user?.id,
          patientName: user?.name,
          type: 'chat'
        });
        setConsultationId(res.data.consultationId);
      } catch (err) {
        console.error('Ошибка создания чата:', err);
        setConsultationId(id);
      }
    };
    if (!consultationId && doctor.id && user) {
      createChatConsultation();
    }
  }, [doctor, user, consultationId, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputMsg.trim() && consultationId) {
      sendMessage(inputMsg, 'user');
      setInputMsg('');
    }
  };

  return (
    <>
      <header>
        <button className="back-btn" onClick={() => window.history.back()}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
        <div className="logo">Чат с {doctor.name}</div>
      </header>
      <div className="chat-room-container">
        <div className="chat-messages-area">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
              Нет сообщений. Напишите что-нибудь...
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender === 'user' ? 'user' : 'doctor'}`}>
              <div className="message-text">{msg.message}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Напишите сообщение..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend}>Отправить</button>
        </div>
      </div>
      <BottomNav />
    </>
  );
}