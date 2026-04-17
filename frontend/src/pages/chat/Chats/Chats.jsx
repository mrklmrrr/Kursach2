import { useEffect, useState } from 'react';
import { AppHeader, BottomNav } from '../../../components/layout';
import { ChatItem } from '../../../components/features';
import { EmptyState } from '../../../components/ui';
import { chatApi } from '../../../services/chatApi';
import { useAuth } from '../../../hooks/useAuth';
import './Chats.css';

function formatChatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Chats() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const { data } = await chatApi.getChats();
        const isDoctor = user?.role === 'doctor';
        const normalized = data.map((chat) => ({
          id: chat._id,
          doctorId: chat.doctorId,
          doctorName: chat.doctorName || 'Врач',
          patientName: chat.patientName || 'Пациент',
          displayName: isDoctor ? (chat.patientName || 'Пациент') : (chat.doctorName || 'Врач'),
          specialty: chat.specialty || 'Специалист',
          lastMessage: (() => {
            const last = chat.lastMessage;
            if (!last) return 'Нет сообщений';

            const sender = String(last.sender || '').toLowerCase();
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
          time: formatChatTime(chat.lastMessage?.timestamp || chat.updatedAt),
          unread: 0,
          avatar: isDoctor ? '🙂' : '👨‍⚕️',
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
  }, [user?.role]);

  return (
    <div className="chats-page">
      <AppHeader />
      <div className="chats-content">
        <div className="section-title">
          {user?.role === 'doctor' ? 'Мои чаты с пациентами' : 'Мои чаты с врачами'}
        </div>
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
