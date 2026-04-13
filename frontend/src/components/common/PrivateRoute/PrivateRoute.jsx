import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-spinner">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;

  // Проверка роли
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/home" />;
  }

  return children;
}
