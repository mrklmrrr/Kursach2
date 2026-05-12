import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastProvider/useToast';
import { useAuth } from '../../hooks/useAuth';
import { Input, Button } from '../../components/ui';

export default function AdminLoginForm() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginAdmin(email, password);
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка входа', 'error');
    }
  };

  return (
    <div className="admin-login-content page-shell">
      <h1>🔐 Админ-панель</h1>
      <p>Вход для администраторов</p>
      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="primary" size="large" className="huge-btn">
          Войти
        </Button>
      </form>
      <p className="auth-link">
        Пациент или врач?{' '}
        <button type="button" className="auth-link-btn" onClick={() => navigate('/login')}>
          Обычный вход
        </button>
      </p>
    </div>
  );
}
