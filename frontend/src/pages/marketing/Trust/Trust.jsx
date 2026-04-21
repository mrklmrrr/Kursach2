import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import '../marketing.css';
import './Trust.css';

export default function Trust() {
  return (
    <div className="marketing-page trust-page">
      <header className="marketing-nav">
        <Link to="/" className="marketing-brand">
          <span className="material-icons">verified_user</span>
          Доверие и compliance
        </Link>
        <nav className="marketing-nav-links">
          <Link to="/">Главная</Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <h1>Безопасность, роли и учёт действий</h1>
        <p className="marketing-lead">
          Платформа рассчитана на работу с персональными данными и разграничением доступа: пациент, врач, администратор.
          Ниже — модель, которую можно развить до полного соответствия локальным требованиям (152-ФЗ, GDPR и т.д.).
        </p>
      </section>

      <section className="marketing-section">
        <h2>Роли и права</h2>
        <div className="marketing-grid-3">
          <article className="marketing-card">
            <h3>Пациент</h3>
            <p>Записи, оплаты, чаты, видео, назначения, настройки напоминаний и согласий.</p>
          </article>
          <article className="marketing-card">
            <h3>Врач</h3>
            <p>Кабинет, медкарта, назначения, расписание; доступ только к своим пациентам в рамках консультаций.</p>
          </article>
          <article className="marketing-card">
            <h3>Администратор</h3>
            <p>Врачи, B2B-метрики, журнал действий, операционные отчёты; без клинических данных без отдельной политики.</p>
          </article>
        </div>
      </section>

      <section className="marketing-section">
        <h2>Журнал действий</h2>
        <p className="section-intro">
          Ключевые события (вход администратора, создание врача, выписка назначения) пишутся в аудит-лог и доступны в
          админ-панели на вкладке «Соответствие».
        </p>
      </section>

      <section className="marketing-section">
        <h2>Согласия пациента</h2>
        <p className="section-intro">
          При регистрации пользователь подтверждает обработку данных; расширенные поля согласий и версионирование
          политики можно подключить на бэкенде (поля <code>consentPersonalDataAt</code>, маркетинг).
        </p>
        <Link to={ROUTES.REGISTER} className="marketing-btn marketing-btn-primary">
          Регистрация
        </Link>
      </section>

      <footer className="marketing-footer">
        <Link to="/">← На лендинг</Link>
      </footer>
    </div>
  );
}
