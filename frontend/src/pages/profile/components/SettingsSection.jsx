import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../../components/features/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../../constants';

export const SettingsSection = ({ onLogout }) => {
  const navigate = useNavigate();

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
      <div className="setting-row logout-row" onClick={handleLogout}>
        <span>Выйти из аккаунта</span>
        <span className="material-icons">logout</span>
      </div>
    </section>
  );
};