import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import AdminLoginForm from './AdminLoginForm';
import './Admin.css';

export default function AdminPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <AdminLoginForm />;
}
