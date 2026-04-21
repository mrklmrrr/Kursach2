import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './AppHeader.css';

import { APP_BRAND_NAME } from '../../../constants';

export default function AppHeader({ showBack = false, backTo, title = APP_BRAND_NAME }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const avatarInitials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    'А';

  return (
    <header className="app-header">
      {showBack ? (
        <button className="back-btn" onClick={() => backTo ? navigate(backTo) : navigate(-1)}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
      ) : (
        <div className="logo">{title}</div>
      )}
      <div className="avatar">{avatarInitials}</div>
    </header>
  );
}
