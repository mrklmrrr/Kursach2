import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AddRelative() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', age: '', relation: 'child' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dependents', form);
      navigate('/profile');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Ошибка добавления родственника');
    }
  };

  return (
    <>
      <header>
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
        <div className="logo">Мед24/7</div>
      </header>
      <div className="register-content">
        <h2>Добавить родственника</h2>
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Имя и фамилия" onChange={handleChange} required />
          <input name="age" type="number" placeholder="Возраст" onChange={handleChange} required />
          <select name="relation" onChange={handleChange} required>
            <option value="child">Ребёнок</option>
            <option value="parent">Родитель</option>
            <option value="spouse">Супруг/супруга</option>
            <option value="other">Другой родственник</option>
          </select>
          <button type="submit" className="btn-primary huge-btn">Добавить</button>
        </form>
      </div>
    </>
  );
}