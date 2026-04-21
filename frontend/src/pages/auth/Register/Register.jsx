import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button, Input } from '../../../components/ui';
import { GENDER_TYPES } from '../../../constants';
import { validate } from '../../../utils/validation';
import './AuthForms.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    phone: '',
    birthDate: '',
    gender: '',
    password: '',
    confirmPassword: ''
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const errs = {};
    const firstNameErr = validate.name(form.firstName, 'Имя');
    if (firstNameErr) errs.firstName = firstNameErr;
    const lastNameErr = validate.name(form.lastName, 'Фамилия');
    if (lastNameErr) errs.lastName = lastNameErr;
    const phoneErr = validate.phone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    const bdErr = validate.birthDate(form.birthDate);
    if (bdErr) errs.birthDate = bdErr;
    const genderErr = validate.gender(form.gender);
    if (genderErr) errs.gender = genderErr;
    const passErr = validate.password(form.password);
    if (passErr) errs.password = passErr;
    const confirmErr = validate.confirmPassword(form.confirmPassword, form.password);
    if (confirmErr) errs.confirmPassword = confirmErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      setErrors({ form: 'Подтвердите согласие на обработку данных' });
      return;
    }
    if (!validateForm()) return;

    try {
      const userData = { ...form };
      delete userData.confirmPassword;
      await register(userData);
      navigate('/home');
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Ошибка регистрации' });
    }
  };

  return (
    <div className="register-content page-shell">
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <Input name="firstName" placeholder="Имя" value={form.firstName} onChange={handleChange} required />
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>
        <div className="field-group">
          <Input name="lastName" placeholder="Фамилия" value={form.lastName} onChange={handleChange} required />
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>
        <div className="field-group">
          <Input name="phone" placeholder="+375..." value={form.phone} onChange={handleChange} required />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>
        <div className="field-group">
          <Input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required />
          {errors.birthDate && <span className="field-error">{errors.birthDate}</span>}
        </div>
        <div className="field-group">
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Пол</option>
            {GENDER_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          {errors.gender && <span className="field-error">{errors.gender}</span>}
        </div>
        <div className="field-group">
          <Input name="password" type="password" placeholder="Пароль (мин. 6 символов)" value={form.password} onChange={handleChange} required />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <div className="field-group">
          <Input name="confirmPassword" type="password" placeholder="Повторите пароль" value={form.confirmPassword} onChange={handleChange} required />
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </div>
        <label className="checkbox-label">
          <input type="checkbox" checked={agree} onChange={() => setAgree(!agree)} required />
          Соглашаюсь с <Link to="/trust">обработкой персональных данных и политикой платформы</Link>
        </label>
        {errors.form && <div className="form-error">{errors.form}</div>}
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
