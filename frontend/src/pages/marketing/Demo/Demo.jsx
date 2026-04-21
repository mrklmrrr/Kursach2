import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import '../marketing.css';
import './Demo.css';

export default function Demo() {
  return (
    <div className="marketing-page demo-page">
      <header className="marketing-nav">
        <Link to="/" className="marketing-brand">
          <span className="material-icons">science</span>
          Демо-режим
        </Link>
        <nav className="marketing-nav-links">
          <Link to="/">Главная</Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <h1>Зайдите под готовыми ролями за 5 минут</h1>
        <p className="marketing-lead">
          Ниже — шаблон учётных данных. Реальные логины задаются при развёртывании через переменные окружения и регистрацию.
          Врачи создаются сидом при пустой базе; пациент — через регистрацию в приложении.
        </p>
      </section>

      <section className="marketing-section">
        <div className="marketing-card demo-table-card">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Роль</th>
                <th>Как войти</th>
                <th>Что проверить</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Владелец / админ</td>
                <td>
                  URL <code>/admin</code>, email и пароль из <code>backend/.env</code> (<code>ADMIN_EMAIL</code>,{' '}
                  <code>ADMIN_PASSWORD</code>)
                </td>
                <td>B2B-метрики, журнал, врачи, экспорт</td>
              </tr>
              <tr>
                <td>Врач</td>
                <td>Телефон и пароль врача из базы (часто <code>doctor123</code> если задавали при создании)</td>
                <td>Кабинет врача, e-назначения пациенту</td>
              </tr>
              <tr>
                <td>Пациент</td>
                <td>
                  <Link to={ROUTES.REGISTER}>Регистрация</Link> или тестовый номер из вашей среды
                </td>
                <td>Запись, оплата, видео, назначения, напоминания в профиле</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="demo-hint">
          Полный чек-лист сценария см. в файле <code>DEMO.md</code> в корне репозитория.
        </p>
      </section>

      <section className="marketing-section">
        <h2>Рекомендуемый маршрут «на показ»</h2>
        <ol className="marketing-list">
          <li>Лендинг → Triage → каталог врачей → профиль врача → запись.</li>
          <li>Пациент: оплата → загрузчик → видеоконсультация в браузере.</li>
          <li>Врач: назначение после приёма (e-рецепт/назначения).</li>
          <li>Админ: конверсия, SLA-индикаторы, журнал, выгрузка CSV.</li>
        </ol>
      </section>

      <footer className="marketing-footer">
        <Link to="/" className="marketing-btn marketing-btn-primary">
          На лендинг
        </Link>
      </footer>
    </div>
  );
}
