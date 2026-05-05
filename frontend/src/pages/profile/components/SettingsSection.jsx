import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../../components/features/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../../constants';
import { PasswordChangeSection } from './PasswordChangeSection';

export const SettingsSection = ({ onLogout }) => {
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);

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
      <div className="setting-row logout-row" onClick={handleLogout}>
        <span>Выйти из аккаунта</span>
        <span className="material-icons">logout</span>
      </div>
    </section>
  );
};