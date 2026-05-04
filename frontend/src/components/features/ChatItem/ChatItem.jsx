import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../ui/Avatar/Avatar';

function ChatItem({ chat }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/chat/${chat.id}`, {
      state: {
        doctor: {
          id: chat.doctorId,
          name: chat.doctorName,
          specialty: chat.specialty,
          avatar: chat.avatarUrl,
          avatarUrl: chat.avatarUrl,
        },
      },
    });
  };

  return (
    <div className="chat-item" onClick={handleClick}>
      <div className="chat-avatar-container">
        <Avatar name={chat.displayName || chat.doctorName} src={chat.avatarUrl || undefined} size="medium" showOnline={chat.isOnline} />
      </div>
      <div className="chat-info">
        <div className="chat-header-row">
          <div className="chat-doctor-name">{chat.displayName || chat.doctorName}</div>
          <div className="chat-time">{chat.time}</div>
        </div>
        <div className="chat-last-message">{chat.lastMessage}</div>
      </div>
      {chat.unread > 0 && <div className="chat-unread-badge">{chat.unread}</div>}
    </div>
  );
}

export default memo(ChatItem, (prev, next) => {
  // Shallow comparison of chat object
  return prev.chat.id === next.chat.id && 
         prev.chat.displayName === next.chat.displayName &&
         prev.chat.lastMessage === next.chat.lastMessage &&
         prev.chat.time === next.chat.time;
});
