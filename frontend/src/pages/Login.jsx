import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(phone);
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка входа');
    }
  };

  return (
    <div className="register-content">
      <h1>Вход</h1>
      <p>Введите номер телефона</p>
      <form onSubmit={handleSubmit}>
        <input type="tel" placeholder="+375..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button type="submit" className="btn-primary huge-btn">Войти</button>
      </form>
      <p>Нет аккаунта? <span onClick={() => navigate('/register')}>Зарегистрироваться</span></p>
    </div>
  );
}