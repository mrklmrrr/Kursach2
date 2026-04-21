import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input, Button } from '../../components/ui';

export default function AdminLoginForm() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginAdmin(email, password);
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка входа');
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
        Пациент или врач? <span onClick={() => navigate('/login')}>Обычный вход</span>
      </p>
    </div>
  );
}
