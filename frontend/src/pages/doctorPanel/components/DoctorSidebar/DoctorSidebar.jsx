import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Avatar } from '@components/ui';

const sidebarNav = [
  { id: 'requests', label: 'Заявки', icon: 'inbox', path: '/doctor/permit' },
  { id: 'schedule', label: 'Расписание', icon: 'calendar_today', path: '/doctor/schedule' },
  { id: 'appointments', label: 'Записи', icon: 'event_note', path: '/doctor/appointments' },
  { id: 'chats', label: 'Чаты', icon: 'chat', path: '/doctor/chats' },
  { id: 'patients', label: 'Пациенты', icon: 'people', path: '/doctor/patients' },
];

const sidebarLinks = [
  { to: '/chats', label: 'Чаты', icon: 'chat' },
];

export default function DoctorSidebar({ profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const p = profile || user || {};

  return (
    <aside className="doctor-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">Мед24</div>
        <div className="sidebar-subtitle">Кабинет врача</div>
      </div>

      <nav className="sidebar-nav" aria-label="Разделы кабинета">
        {sidebarNav.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        {sidebarLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`sidebar-profile ${location.pathname === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <Avatar
            name={`${p.firstName} ${p.lastName}`}
            src={p.avatarUrl || undefined}
            size="small"
          />
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">
              {p.firstName} {p.lastName}
            </div>
            <div className="sidebar-profile-status">{p.specialty}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
