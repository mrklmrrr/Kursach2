import { useEffect, useState } from 'react';
import { AppHeader, BottomNav } from '../../../components/layout';
import { ChatItem } from '../../../components/features';
import { EmptyState } from '../../../components/ui';
import { chatApi } from '../../../services/chatApi';
import './Chats.css';

function formatChatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Chats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const { data } = await chatApi.getChats();
        const normalized = data.map((chat) => ({
          id: chat._id,
          doctorId: chat.doctorId,
          doctorName: chat.doctorName || 'Врач',
          specialty: chat.specialty || 'Специалист',
          lastMessage: chat.lastMessage?.message || (chat.lastMessage?.fileUrl ? 'Вложение' : 'Нет сообщений'),
          time: formatChatTime(chat.lastMessage?.timestamp || chat.updatedAt),
          unread: 0,
          avatar: '👨‍⚕️',
          isOnline: false
        }));
        setChats(normalized);
      } catch (err) {
        console.error('Не удалось загрузить чаты', err);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  return (
    <div className="chats-page">
      <AppHeader />
      <div className="chats-content">
        <div className="section-title">Мои чаты с врачами</div>
        {loading ? (
          <div className="empty-state">Загрузка чатов...</div>
        ) : chats.length > 0 ? (
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
