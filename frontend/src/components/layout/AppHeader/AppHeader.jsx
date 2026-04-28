import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar } from '../../../components/ui';
import './AppHeader.css';

import { APP_BRAND_NAME } from '../../../constants';

export default function AppHeader({ showBack = false, backTo, title = APP_BRAND_NAME }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || 'Пользователь';

  return (
    <header className="app-header">
      {showBack ? (
        <button className="back-btn" onClick={() => backTo ? navigate(backTo) : navigate(-1)}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
      ) : (
        <div className="logo">{title}</div>
      )}
      <Avatar name={fullName} src={user?.avatarUrl || undefined} size="small" />
    </header>
  );
}
