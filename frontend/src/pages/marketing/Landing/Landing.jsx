import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import '../marketing.css';
import './Landing.css';

export default function Landing() {
  return (
    <div className="marketing-page landing-page">
      <header className="marketing-nav">
        <Link to="/" className="marketing-brand">
          <span className="material-icons">health_and_safety</span>
          Мед24
        </Link>
        <nav className="marketing-nav-links" aria-label="Навигация">
          <Link to="/triage">Подбор врача</Link>
          <Link to="/plans">Тарифы</Link>
          <Link to="/trust">Безопасность</Link>
          <Link to="/demo">Демо</Link>
          <Link to={ROUTES.LOGIN}>Вход</Link>
          <Link to={ROUTES.REGISTER} className="marketing-btn marketing-btn-primary" style={{ padding: '8px 14px', fontSize: '0.88rem' }}>
            Регистрация
          </Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <div className="marketing-badge-row">
          <span className="marketing-badge">B2B для клиник и телемед-сервисов</span>
          <span className="marketing-badge">MVP+ готов к демо</span>
        </div>
        <h1>Цифровая клиника в одном контуре: запись, видео в браузере, чат и аналитика</h1>
        <p className="marketing-lead">
          Мы продаём не «сайт с врачами», а готовую платформу для частных клиник, сетей и телемед-проектов:
          снижение no-show, рост конверсии «запись → оплата», прозрачная загрузка врачей и compliance-слой для
          регуляторики и доверия пациентов.
        </p>
        <div className="marketing-cta-row">
          <Link to="/demo" className="marketing-btn marketing-btn-primary">
            <span className="material-icons" style={{ fontSize: 20 }}>rocket_launch</span>
            Демо за 5 минут
          </Link>
          <Link to="/plans" className="marketing-btn marketing-btn-ghost">
            Тарифы и пакеты
          </Link>
        </div>

        <div className="marketing-metrics" aria-label="Выгоды в цифрах (демонстрационные ориентиры)">
          <div className="metric-cell">
            <strong>−35%</strong>
            <span>no-show с напоминаниями</span>
          </div>
          <div className="metric-cell">
            <strong>+22%</strong>
            <span>конверсия в оплату</span>
          </div>
          <div className="metric-cell">
            <strong>15 мин</strong>
            <span>SLA первого ответа</span>
          </div>
          <div className="metric-cell">
            <strong>100%</strong>
            <span>WebRTC в браузере</span>
          </div>
          <div className="metric-cell">
            <strong>24/7</strong>
            <span>журнал действий</span>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <h2>Кому продаём</h2>
        <p className="section-intro">Три сегмента — одна платформа, разные боли.</p>
        <div className="marketing-grid-3">
          <article className="marketing-card">
            <h3>Частные клиники</h3>
            <p>Единое расписание, онлайн-оплата, снижение административной нагрузки и рост повторных визитов.</p>
          </article>
          <article className="marketing-card">
            <h3>Сети и франшизы</h3>
            <p>Сводная аналитика по точкам, роли и права, экспорт отчётов для руководства и LPU.</p>
          </article>
          <article className="marketing-card">
            <h3>Телемед-сервисы</h3>
            <p>Видео в браузере без установки приложений, triage перед записью, интеграции напоминаний.</p>
          </article>
        </div>
      </section>

      <section className="marketing-section">
        <h2>«Вау»-функции в MVP+</h2>
        <p className="section-intro">Уже заложены в продукт или подключаются модулем.</p>
        <div className="marketing-grid-3">
          <article className="marketing-card">
            <h3>Видеозвонок в браузере</h3>
            <p>WebRTC-консультация после оплаты — без отдельного софта, прямо из личного кабинета.</p>
          </article>
          <article className="marketing-card">
            <h3>Напоминания</h3>
            <p>Email и Telegram (очередь уведомлений; настройки у пациента в профиле).</p>
          </article>
          <article className="marketing-card">
            <h3>E-назначения</h3>
            <p>Врач фиксирует препараты и режим; пациент видит список в кабинете после приёма.</p>
          </article>
          <article className="marketing-card">
            <h3>Triage-бот</h3>
            <p>Короткий опрос симптомов → рекомендация специальности и переход в каталог врачей.</p>
          </article>
          <article className="marketing-card">
            <h3>B2B-дашборд</h3>
            <p>Конверсия, загрузка врачей, повторные визиты, SLA и журнал действий для владельца.</p>
          </article>
          <article className="marketing-card">
            <h3>Пакеты и абонементы</h3>
            <p>Тарифы для клиники + пакеты консультаций для пациентов на странице «Тарифы».</p>
          </article>
        </div>
      </section>

      <footer className="marketing-footer">
        <p>
          <Link to="/trust">Политика данных, роли и журнал действий</Link>
          {' · '}
          <Link to={ROUTES.LOGIN}>Вход для пациентов и врачей</Link>
          {' · '}
          <Link to="/admin">Кабинет владельца (admin)</Link>
        </p>
      </footer>
    </div>
  );
}
