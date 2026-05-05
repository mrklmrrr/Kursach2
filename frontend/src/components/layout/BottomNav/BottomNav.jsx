import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './BottomNav.css';

export default function BottomNav() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const navItems = [
    { to: '/home', icon: 'home', label: 'Главная' },
    isDoctor
      ? { to: '/doctor/patients', icon: 'local_hospital', label: 'Пациенты' }
      : { to: '/doctors', icon: 'medical_services', label: 'Врачи' },
    { to: '/chats', icon: 'chat', label: 'Чаты' },
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
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
