import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function Chats() {
  const navigate = useNavigate();

  const chats = [
    { id: 1, doctorName: 'Анна Иванова', specialty: 'Педиатр', lastMessage: 'Всё в порядке, температура спала...', time: '2 ч назад', unread: 2 },
    { id: 2, doctorName: 'Сергей Петров', specialty: 'Терапевт', lastMessage: 'Анализы в норме...', time: 'Вчера', unread: 0 },
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <header>
        <div className="logo">Мед24/7</div>
        <div className="avatar">А</div>
      </header>
      <div className="section-title">Мои чаты</div>
      <div className="chat-list">
        {chats.map(chat => (
          <div key={chat.id} className="chat-item" onClick={() => navigate(`/chat/doctor/${chat.id}`, { state: { doctor: { name: chat.doctorName, id: chat.id } } })}>
            <div className="chat-avatar" style={{ background: 'linear-gradient(135deg, #0F52BA, #2A9D8F)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 18 }}>
              {getInitials(chat.doctorName)}
            </div>
            <div className="chat-info">
              <div className="chat-name">{chat.doctorName} ({chat.specialty})</div>
              <div className="chat-last-msg">{chat.lastMessage}</div>
            </div>
            <div className="chat-time">{chat.time}</div>
            {chat.unread > 0 && <span className="chat-unread">{chat.unread}</span>}
          </div>
        ))}
      </div>
      <BottomNav />
    </>
  );
}