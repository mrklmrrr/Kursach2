import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button, Input } from '../../../components/ui';
import { validate } from '../../../utils/validation';
import { parseAuthFormError } from '../../../utils/apiError';
import './AuthForms.css';

function normalizePhone(value) {
  return value.replace(/[\s()-]/g, '');
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const normalizedPhone = normalizePhone(phone);
    const errs = {};
    const phoneErr = validate.phone(normalizedPhone);
    if (phoneErr) errs.phone = phoneErr;
    const passErr = validate.password(password);
    if (passErr) errs.password = passErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (!validateForm()) return;

    try {
      await login(normalizedPhone, password);
      const redirectTo = location.state?.from || '/home';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const { fieldErrors, form } = parseAuthFormError(err, 'Ошибка входа');
      setErrors((prev) => ({ ...prev, ...fieldErrors, form }));
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
              if (errors.phone || errors.form) {
                setErrors((prev) => ({ ...prev, phone: '', form: undefined }));
              }
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
              if (errors.password || errors.form) {
                setErrors((prev) => ({ ...prev, password: '', form: undefined }));
              }
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
