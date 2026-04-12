import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    lastName: '', firstName: '', middleName: '', phone: '', birthDate: '', gender: ''
  });
  const [agree, setAgree] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) return alert('Подтвердите согласие на обработку данных');
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
        <input name="lastName" placeholder="Фамилия" onChange={handleChange} required />
        <input name="firstName" placeholder="Имя" onChange={handleChange} required />
        <input name="middleName" placeholder="Отчество" onChange={handleChange} />
        <input name="phone" placeholder="Номер телефона (+375...)" onChange={handleChange} required />
        <input name="birthDate" type="date" onChange={handleChange} required />
        <select name="gender" onChange={handleChange} required>
          <option value="">Пол</option>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>
        <label>
          <input type="checkbox" checked={agree} onChange={() => setAgree(!agree)} required />
          Соглашаюсь с <a href="#">обработкой персональных данных</a>
        </label>
        <button type="submit" className="btn btn-primary huge-btn">Зарегистрироваться</button>
      </form>
      <p>Уже есть аккаунт? <span onClick={() => navigate('/login')}>Войти</span></p>
    </div>
  );
}