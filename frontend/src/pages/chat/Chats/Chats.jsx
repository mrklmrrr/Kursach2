import { useNavigate } from 'react-router-dom';
import { AppHeader, BottomNav } from '../../../components/layout';
import { ChatItem } from '../../../components/features';
import { EmptyState } from '../../../components/ui';
import './Chats.css';

const MOCK_CHATS = [
  {
    id: 1,
    doctorId: 1,
    doctorName: 'Анна Иванова',
    specialty: 'Педиатр',
    lastMessage: 'Температура спала, всё в порядке. Следите за самочувствием.',
    time: '14:32',
    unread: 2,
    avatar: '👩‍⚕️',
    isOnline: true,
  },
  {
    id: 2,
    doctorId: 2,
    doctorName: 'Сергей Петров',
    specialty: 'Терапевт',
    lastMessage: 'Анализы в норме. Рекомендую продолжить курс.',
    time: 'Вчера',
    unread: 0,
    avatar: '👨‍⚕️',
    isOnline: false,
  },
  {
    id: 3,
    doctorId: 4,
    doctorName: 'Елена Смирнова',
    specialty: 'Психолог',
    lastMessage: 'Давайте обсудим это на следующем сеансе...',
    time: 'Вт',
    unread: 1,
    avatar: '👩‍⚕️',
    isOnline: true,
  },
];

export default function Chats() {
  const chats = MOCK_CHATS;

  return (
    <div className="chats-page">
      <AppHeader />
      <div className="chats-content">
        <div className="section-title">Мои чаты с врачами</div>
        {chats.length > 0 ? (
          <div className="chat-list">
            {chats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        ) : (
          <EmptyState icon="chat_bubble_outline" title="Нет чатов" description="У вас пока нет активных чатов" />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
