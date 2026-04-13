import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dependentApi } from '../../../services/dependentApi';
import { AppHeader } from '../../../components/layout';
import { Button, Input } from '../../../components/ui';
import { RELATION_TYPES } from '../../../constants';
import './AddRelative.css';

export default function AddRelative() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', age: '', relation: 'child' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dependentApi.create(form);
      navigate('/profile');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Ошибка добавления родственника');
    }
  };

  return (
    <div>
      <AppHeader showBack backTo="/profile" />
      <div className="register-content">
        <h2>Добавить родственника</h2>
        <form onSubmit={handleSubmit}>
          <Input name="name" placeholder="Имя и фамилия" onChange={handleChange} required />
          <Input name="age" type="number" placeholder="Возраст" onChange={handleChange} required />
          <select name="relation" onChange={handleChange} required>
            {RELATION_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" size="large" className="huge-btn">
            Добавить
          </Button>
        </form>
      </div>
    </div>
  );
}
