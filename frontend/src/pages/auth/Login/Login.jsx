import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button, Input } from '../../../components/ui';
import { validate } from '../../../utils/validation';
import './AuthForms.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    const phoneErr = validate.phone(phone);
    if (phoneErr) errs.phone = phoneErr;
    const passErr = validate.password(password);
    if (passErr) errs.password = passErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(phone, password);
      const redirectTo = location.state?.from || '/home';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Ошибка входа' });
    }
  };

  return (
    <div className="register-content page-shell">
      <div className="auth-logo">
        <img src="/med24-logo.svg" alt="Мед24" />
      </div>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <Input
            type="tel"
            placeholder="+375..."
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
            required
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>
        <div className="field-group">
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            required
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        {errors.form && <div className="form-error">{errors.form}</div>}
        <Button type="submit" variant="primary" size="large" className="huge-btn">
          Войти
        </Button>
      </form>
      <p className="auth-link">
        Нет аккаунта? <span onClick={() => navigate('/register')}>Зарегистрироваться</span>
      </p>
    </div>
  );
}
