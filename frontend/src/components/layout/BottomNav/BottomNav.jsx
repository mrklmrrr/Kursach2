import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { to: '/home', icon: 'home', label: 'Главная' },
  { to: '/doctors', icon: 'local_hospital', label: 'Врачи' },
  { to: '/chats', icon: 'chat', label: 'Чаты' },
  { to: '/emergency', icon: 'directions_car', label: 'Скорая' },
  { to: '/profile', icon: 'person', label: 'Профиль' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="material-icons nav-icon">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
