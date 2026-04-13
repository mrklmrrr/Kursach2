import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './AppHeader.css';

export default function AppHeader({ showBack = false, backTo, title = 'Мед24/7' }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="app-header">
      {showBack ? (
        <button className="back-btn" onClick={() => backTo ? navigate(backTo) : navigate(-1)}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
      ) : (
        <div className="logo">{title}</div>
      )}
      <div className="avatar">{user?.name?.charAt(0) || 'А'}</div>
    </header>
  );
}
