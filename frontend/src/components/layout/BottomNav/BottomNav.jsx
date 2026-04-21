import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { to: '/home', icon: 'home', label: 'Главная' },
  { to: '/doctors', icon: 'local_hospital', label: 'Врачи' },
  { to: '/chats', icon: 'chat', label: 'Чаты' },
  { to: '/profile', icon: 'person', label: 'Профиль' },
];

export default function BottomNav() {
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
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
