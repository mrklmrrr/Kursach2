import { useNavigate } from 'react-router-dom';
import Avatar from '../../ui/Avatar/Avatar';

export default function ChatItem({ chat }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/chat/doctor/${chat.doctorId}`, {
      state: {
        doctor: {
          id: chat.doctorId,
          name: chat.doctorName,
          avatar: chat.avatar,
        },
      },
    });
  };

  return (
    <div className="chat-item" onClick={handleClick}>
      <div className="chat-avatar-container">
        <Avatar name={chat.doctorName} emoji={chat.avatar} size="medium" showOnline={chat.isOnline} />
      </div>
      <div className="chat-info">
        <div className="chat-header-row">
          <div className="chat-doctor-name">{chat.doctorName}</div>
          <div className="chat-time">{chat.time}</div>
        </div>
        <div className="chat-last-message">{chat.lastMessage}</div>
      </div>
      {chat.unread > 0 && <div className="chat-unread-badge">{chat.unread}</div>}
    </div>
  );
}
