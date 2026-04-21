import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformApi } from '../../../services/platformApi';
import { ROUTES } from '../../../constants';
import '../marketing.css';
import './Plans.css';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    platformApi
      .getPlans()
      .then((res) => setPlans(res.data?.plans || []))
      .catch(() => setError('Не удалось загрузить тарифы (проверьте API)'));
  }, []);

  return (
    <div className="marketing-page plans-page">
      <header className="marketing-nav">
        <Link to="/" className="marketing-brand">
          <span className="material-icons">payments</span>
          Тарифы
        </Link>
        <nav className="marketing-nav-links">
          <Link to="/">Главная</Link>
          <Link to={ROUTES.REGISTER}>Регистрация пациента</Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <h1>Тарифы для клиник и пакеты для пациентов</h1>
        <p className="marketing-lead">
          Разовые оплаты консультаций остаются в продукте; здесь — абонементы для B2B и пакеты визитов для пациентов.
          Цифры ориентировочные для коммерческого предложения.
        </p>
      </section>

      <section className="marketing-section">
        {error && <p className="plans-error">{error}</p>}
        <div className="plans-grid">
          {plans.map((p) => (
            <article key={p.id} className={`marketing-card plan-card ${p.highlight ? 'plan-highlight' : ''}`}>
              {p.highlight && <span className="plan-ribbon">Популярно</span>}
              <h3>{p.name}</h3>
              <p className="plan-price">
                {p.priceBYN === 0 ? 'По запросу' : `${p.priceBYN} BYN`}
                <span> / {p.period}</span>
              </p>
              <ul className="plan-features">
                {(p.features || []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link to={ROUTES.LOGIN} className="marketing-btn marketing-btn-primary plan-cta">
                Обсудить внедрение
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="marketing-footer">
        <Link to="/demo">Демо-доступы</Link>
        {' · '}
        <Link to="/">← Назад</Link>
      </footer>
    </div>
  );
}
