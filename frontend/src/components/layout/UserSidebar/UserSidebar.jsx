import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useChatUnread } from '@contexts/ChatUnreadProvider/ChatUnreadProvider';
import { Avatar } from '@components/ui';
import NavUnreadBadge from '../NavUnreadBadge/NavUnreadBadge';
import './UserSidebar.css';

const userNavItems = [
  { to: '/home', label: 'Главная', icon: 'home' },
  { to: '/doctors', label: 'Врачи', icon: 'medical_services' },
  { to: '/chats', label: 'Чаты', icon: 'chat' },
  { to: '/emergency', label: 'Экстренно', icon: 'emergency' },
];

function isProfilePath(pathname) {
  return pathname.startsWith('/profile');
}

function isDoctorsPath(pathname) {
  return pathname === '/doctors' || pathname.startsWith('/doctors/');
}

export default function UserSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { totalUnread } = useChatUnread();

  const name = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Пользователь';
  const subtitle = user?.email || user?.phone || 'Личный кабинет';

  return (
    <aside className="user-sidebar">
      <div className="user-sidebar-header">
        <div className="user-sidebar-brand">Мед24</div>
        <div className="user-sidebar-subtitle">Кабинет пациента</div>
      </div>

      <nav className="user-sidebar-nav" aria-label="Разделы пользователя">
        {userNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => {
              const active = item.to === '/doctors'
                ? isDoctorsPath(location.pathname)
                : isActive;
              return `user-sidebar-link ${active ? 'active' : ''}`;
            }}
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
            {item.to === '/chats' ? <NavUnreadBadge count={totalUnread} /> : null}
          </NavLink>
        ))}
      </nav>

      <div className="user-sidebar-footer">
        <button
          type="button"
          className={`user-sidebar-profile ${isProfilePath(location.pathname) ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <Avatar name={name} src={user?.avatarUrl || undefined} size="small" />
          <div className="user-sidebar-profile-info">
            <div className="user-sidebar-profile-name">{name}</div>
            <div className="user-sidebar-profile-status">{subtitle}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
