import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AppHeader, BottomNav } from '../../../components/layout';
import { Avatar } from '../../../components/ui';
import { ThemeToggle } from '../../../components/features/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../../constants';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="profile-page">
      <AppHeader />
      <div className="profile-content">
        <div className="profile-header">
          <Avatar name={user?.name} size="xlarge" />
          <h1>{user?.name || 'Пользователь'}</h1>
          <p className="profile-email">{user?.email || ''}</p>
        </div>

        <section className="section-card">
          <h3>Мои родственники</h3>
          <div className="relative-item">
            <div>
              <div className="relative-name">Матвей, 4 года</div>
              <div className="relative-relation">Сын</div>
            </div>
          </div>
          <button className="btn btn-outline add-relative-btn" onClick={() => navigate(ROUTES.ADD_RELATIVE)}>
            + Добавить родственника
          </button>
        </section>

        <section className="section-card">
          <h3>Медицинская карта</h3>
          <ul className="medical-info">
            <li>Аллергия на пенициллин</li>
            <li>Последняя консультация: 05.03.2026</li>
            <li>Рецепты: 3 активных</li>
          </ul>
          <button className="btn btn-primary" onClick={() => alert('Медицинская карта скоро будет доступна')}>
            Открыть карту
          </button>
        </section>

        <section className="section-card">
          <h3>История консультаций</h3>
          <div className="history-item">05.03.2026 • Педиатр • 15 мин • 590 BYN</div>
          <div className="history-item">18.02.2026 • Терапевт • чат • 390 BYN</div>
          <button className="btn btn-outline" onClick={() => alert('Полная история скоро будет доступна')}>
            Показать всю историю
          </button>
        </section>

        <section className="section-card">
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
      </div>
      <BottomNav />
    </div>
  );
}
