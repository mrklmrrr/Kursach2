import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useChatUnread } from '../../../contexts/ChatUnreadProvider/ChatUnreadProvider';
import NavUnreadBadge from '../NavUnreadBadge/NavUnreadBadge';
import './BottomNav.css';

export default function BottomNav() {
  const { user } = useAuth();
  const { totalUnread } = useChatUnread();
  const isDoctor = user?.role === 'doctor';
  const navItems = [
    { to: '/home', icon: 'home', label: 'Главная' },
    isDoctor
      ? { to: '/doctor/patients', icon: 'local_hospital', label: 'Пациенты' }
      : { to: '/doctors', icon: 'medical_services', label: 'Врачи' },
    isDoctor
      ? { to: '/doctor/chats', icon: 'chat', label: 'Чаты' }
      : { to: '/chats', icon: 'chat', label: 'Чаты' },
    { to: '/profile', icon: 'person', label: 'Профиль' },
  ];

  return (
    <div className="bottom-nav-shell">
      <div className="bottom-nav-track">
        <nav className="bottom-nav" aria-label="Основное меню">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-icons nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
              {(to === '/chats' || to === '/doctor/chats') ? <NavUnreadBadge count={totalUnread} /> : null}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
