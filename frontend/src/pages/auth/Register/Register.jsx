import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button, Input } from '../../../components/ui';
import { GENDER_TYPES } from '../../../constants';
import './AuthForms.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    birthDate: '',
    gender: '',
  });
  const [agree, setAgree] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      alert('Подтвердите согласие на обработку данных');
      return;
    }
    try {
      await register(form);
      navigate('/home');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="register-content">
      <h1>Регистрация</h1>
      <p>Заполните данные один раз — это займёт 1 минуту</p>
      <form onSubmit={handleSubmit}>
        <Input name="lastName" placeholder="Фамилия" onChange={handleChange} required />
        <Input name="firstName" placeholder="Имя" onChange={handleChange} required />
        <Input name="middleName" placeholder="Отчество" onChange={handleChange} />
        <Input name="phone" placeholder="Номер телефона (+375...)" onChange={handleChange} required />
        <Input name="birthDate" type="date" onChange={handleChange} required />
        <select name="gender" onChange={handleChange} required>
          <option value="">Пол</option>
          {GENDER_TYPES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        <label className="checkbox-label">
          <input type="checkbox" checked={agree} onChange={() => setAgree(!agree)} required />
          Соглашаюсь с <a href="#">обработкой персональных данных</a>
        </label>
        <Button type="submit" variant="primary" size="large" className="huge-btn">
          Зарегистрироваться
        </Button>
      </form>
      <p className="auth-link">
        Уже есть аккаунт? <span onClick={() => navigate('/login')}>Войти</span>
      </p>
    </div>
  );
}
