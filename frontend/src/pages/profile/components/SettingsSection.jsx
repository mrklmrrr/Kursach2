import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../../components/features/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../../constants';
import { useAuth } from '../../../hooks/useAuth';
import { PasswordChangeSection } from './PasswordChangeSection';
import { UsernameChangeSection } from './UsernameChangeSection';

export const SettingsSection = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [usernameOpen, setUsernameOpen] = useState(false);
  const hasUsername = Boolean(String(user?.username || '').trim());
  const showUsernameChange = user?.role === 'patient' && hasUsername;

  const handleLogout = () => {
    onLogout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <section className="section-card section-card--lux">
      <h3>Настройки</h3>
      <div className="setting-row">
        <span>Тёмная тема</span>
        <ThemeToggle />
      </div>
      <button
        type="button"
        className="setting-row settings-action-row"
        aria-expanded={passwordOpen}
        onClick={() => setPasswordOpen((prev) => !prev)}
      >
        <span>Сменить пароль</span>
        <span className="settings-chevron" aria-hidden>
          {passwordOpen ? '▾' : '▸'}
        </span>
      </button>
      {passwordOpen && <PasswordChangeSection embedded />}
      {showUsernameChange && (
        <>
          <button
            type="button"
            className="setting-row settings-action-row"
            aria-expanded={usernameOpen}
            onClick={() => setUsernameOpen((prev) => !prev)}
          >
            <span>Сменить username</span>
            <span className="settings-chevron" aria-hidden>
              {usernameOpen ? '▾' : '▸'}
            </span>
          </button>
          {usernameOpen && <UsernameChangeSection embedded />}
        </>
      )}
      <div className="setting-row logout-row" onClick={handleLogout}>
        <span>Выйти из аккаунта</span>
        <span className="material-icons">logout</span>
      </div>
    </section>
  );
};