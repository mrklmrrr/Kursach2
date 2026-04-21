import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_BRAND_NAME } from '../../../constants';
import { useAuth } from '../../../hooks/useAuth';
import './OnboardingGate.css';

const STORAGE_KEY = 'kursach_onboarding_done_v1';

const STEPS_PATIENT = [
  {
    icon: 'home',
    title: 'Главная',
    text: 'Здесь ближайшие записи, врачи онлайн и быстрый доступ к срочной помощи.'
  },
  {
    icon: 'medical_services',
    title: 'Врачи и запись',
    text: 'Во вкладке «Врачи» можно найти специалиста и записаться на приём.'
  },
  {
    icon: 'folder_shared',
    title: 'Профиль и карта',
    text: 'В профиле — медицинская карта, лабораторные анализы, история консультаций и настройки.'
  }
];

const STEPS_DOCTOR = [
  {
    icon: 'dashboard',
    title: 'Панель врача',
    text: 'Заявки, расписание, чаты и список пациентов — в одном месте.'
  },
  {
    icon: 'assignment',
    title: 'Карта и исследования',
    text: 'Откройте карточку пациента: системы организма, больничные, лабораторные бланки.'
  }
];

export default function OnboardingGate() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => {
    if (user?.role === 'doctor') return STEPS_DOCTOR;
    return STEPS_PATIENT;
  }, [user?.role]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
    setStep(0);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'admin') return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      return;
    }

    const path = location.pathname;
    if (path === '/login' || path === '/register' || path.startsWith('/admin')) return;

    if (user.role === 'doctor' && path === '/doctor') {
      setOpen(true);
      setStep(0);
      return;
    }
    if (user.role === 'patient' && path === '/home') {
      setOpen(true);
      setStep(0);
    }
  }, [user, loading, location.pathname]);

  useEffect(() => {
    if (!open || !user) return;
    const path = location.pathname;
    const stay =
      (user.role === 'patient' && path === '/home') || (user.role === 'doctor' && path === '/doctor');
    if (!stay) setOpen(false);
  }, [location.pathname, open, user]);

  if (!open || !user || user.role === 'admin') return null;

  const current = steps[step];
  const isLast = step >= steps.length - 1;

  return (
    <div className="onboarding-root" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-scrim" onClick={finish} role="presentation" />
      <div className="onboarding-card">
        <button type="button" className="onboarding-skip" onClick={finish}>
          Пропустить
        </button>
        <div className="onboarding-brand">
          <span className="material-icons onboarding-brand-icon">favorite</span>
          <span>{APP_BRAND_NAME}</span>
        </div>
        <p className="onboarding-kicker">Краткий тур</p>
        <h2 id="onboarding-title" className="onboarding-title lux-heading">
          {current.title}
        </h2>
        <p className="onboarding-text">{current.text}</p>
        <div className="onboarding-visual" aria-hidden>
          <span className="material-icons onboarding-step-icon">{current.icon}</span>
        </div>
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>
        <div className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="btn btn-outline btn-medium" onClick={() => setStep((s) => s - 1)}>
              Назад
            </button>
          ) : (
            <span />
          )}
          {!isLast ? (
            <button type="button" className="btn btn-primary btn-medium" onClick={() => setStep((s) => s + 1)}>
              Далее
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-medium"
              onClick={() => {
                finish();
                if (user.role === 'patient') navigate('/doctors');
              }}
            >
              {user.role === 'doctor' ? 'Готово' : 'К врачам'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
