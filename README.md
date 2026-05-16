# Мед24 — цифровая клиника

Веб-платформа телемедицины для частных клиник и телемед-сервисов: запись к врачу, оплата, видеоконсультации в браузере, чат, медицинская карта, кабинет врача и админ-панель с B2B-аналитикой.

Проект разработан как курсовая работа (fullstack): **React** на клиенте и **Node.js + Express** на сервере, данные хранятся в **MongoDB**.

---

## Возможности

### Пациент
- Регистрация и вход по телефону
- Каталог врачей, запись на приём, оплата консультации
- Видеозвонок и чат с врачом (WebRTC + Socket.IO)
- Профиль, родственники, история консультаций
- Медицинская карта, лабораторные и инструментальные исследования
- Электронные назначения (e-назначения)
- Срочный вызов врача (emergency)
- Напоминания о приёме по email и Telegram (при настройке)

### Врач
- Панель врача: расписание, пациенты, консультации
- Ведение медицинской карты, лабораторных и инструментальных бланков
- Выписка назначений после приёма
- Чат и видеокомнаты

### Администратор
- Управление врачами и платформой
- B2B-метрики (конверсия, SLA, e-назначения)
- Журнал аудита и экспорт отчётов

### Маркетинговые страницы (публичные)
- Лендинг (`/`), подбор врача по симптомам (`/triage`)
- Тарифы (`/plans`), демо-сценарий (`/demo`), блок доверия (`/trust`)

---

## Стек технологий

| Слой | Технологии |
|------|------------|
| Frontend | React 19, Vite, React Router, Axios, Socket.IO Client, simple-peer (WebRTC) |
| Backend | Node.js, Express, Mongoose, Socket.IO, JWT, Zod, Helmet, rate limiting |
| База данных | MongoDB |
| Дополнительно | Nodemailer (напоминания), node-cron (воркер), опционально OpenAI/OpenRouter (пояснения к анализам) |

---

## Структура репозитория

```
.
├── backend/          # REST API, Socket.IO, воркеры
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── workers/      # напоминания о приёме
│   └── .env.example
├── frontend/         # SPA на React
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/
├── DEMO.md           # сценарий презентации за 5–10 минут
└── README.md
```

---

## Требования

- **Node.js** 18+ (для встроенного `fetch` в сервисе ИИ-пояснений к анализам)
- **MongoDB** 6+ (локально или [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm

---

## Быстрый старт

### 1. Клонирование и зависимости

```bash
git clone <url-репозитория>
cd Kursach2

cd backend && npm install
cd ../frontend && npm install
```

### 2. MongoDB

Запустите MongoDB локально или укажите URI облачного кластера в переменных окружения.

### 3. Backend

```bash
cd backend
cp .env.example .env
# Отредактируйте .env: MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev
```

Сервер по умолчанию: **http://localhost:5001**

При первом запуске выполняется bootstrap:
- создаётся администратор из `ADMIN_*`;
- при пустой базе — сид списка врачей;
- создаются типовые шаблоны лабораторных бланков.

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm run dev
```

Приложение: **http://localhost:5173**

В режиме разработки Vite проксирует `/api` и `/uploads` на backend (см. `frontend/vite.config.js`). Можно не задавать `VITE_API_URL` и ходить в API через `/api`.

---

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт API (по умолчанию `5001`) |
| `MONGO_URI` | Строка подключения MongoDB |
| `JWT_SECRET` | Секрет для подписи JWT (обязательно сменить) |
| `FRONTEND_URL` | Origins для CORS (через запятую) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Учётная запись администратора |
| `SMTP_*`, `MAIL_FROM` | Почта для напоминаний (опционально) |
| `TELEGRAM_BOT_TOKEN` | Telegram-бот для напоминаний (опционально) |
| `OPENAI_API_KEY`, `OPENAI_API_BASE`, `OPENAI_MODEL` | ИИ-пояснения к лабораторным результатам (опционально) |
| `REMINDERS_ENABLED` | `false` — отключить cron-воркер напоминаний |

Полный список и комментарии — в [`backend/.env.example`](backend/.env.example).

### Frontend (`frontend/.env`)

| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | Базовый URL API, например `http://localhost:5001/api` |
| `VITE_SOCKET_URL` | URL Socket.IO, например `http://localhost:5001` |

Пример — в [`frontend/.env.example`](frontend/.env.example).

---

## Роли и вход в систему

| Роль | URL | Как получить доступ |
|------|-----|---------------------|
| **Пациент** | `/register`, `/login` | Регистрация по телефону |
| **Врач** | `/login` | Учётка из сида или созданная в админке (типичный тестовый пароль — `doctor123`) |
| **Администратор** | `/admin` | Email и пароль из `ADMIN_EMAIL` / `ADMIN_PASSWORD` |

---

## Основные маршруты приложения

| Путь | Назначение |
|------|------------|
| `/` | Лендинг |
| `/home` | Главная пациента |
| `/doctors` | Каталог врачей |
| `/consultation/:id` | Видеоконсультация |
| `/chats`, `/chat/:id` | Список чатов и переписка |
| `/profile` | Профиль и медкарта |
| `/doctor` | Панель врача |
| `/admin` | Админ-панель |

---

## API (краткий обзор)

Базовый префикс: `/api`

- `POST /api/auth/register`, `POST /api/auth/login` — аутентификация пациента
- `GET /api/doctors` — список врачей
- `POST /api/appointments` — запись на приём
- `GET /api/consultations`, `POST /api/consultations` — консультации
- `GET /api/prescriptions`, `POST /api/doctor/prescriptions` — назначения
- `GET /api/admin/b2b-metrics`, `GET /api/admin/audit-log` — админ
- `GET /api/health`, `GET /api/readiness` — проверка состояния сервера

Socket.IO используется для чата и сигналинга видеозвонков.

---

## Скрипты

### Backend

```bash
npm run dev      # nodemon, разработка
npm start        # production
npm test         # Jest
```

### Frontend

```bash
npm run dev      # Vite dev server
npm run build    # production-сборка
npm run preview  # просмотр сборки
npm run lint     # ESLint
```

---

## Демонстрация и защита проекта

Пошаговый сценарий презентации для заказчика или комиссии — в [**DEMO.md**](DEMO.md): подготовка окружения, роли, маршрут по экранам за 5–10 минут.

---

## Безопасность

- JWT с настраиваемым сроком жизни
- Helmet, CORS по whitelist, `express-mongo-sanitize`
- Rate limiting на логин, админку и ИИ-эндпоинты
- Ролевая авторизация (`patient`, `doctor`, `admin`)
- Журнал аудита действий администратора

Перед деплоем в production обязательно задайте надёжный `JWT_SECRET`, сильные пароли администратора и HTTPS.

---

## Лицензия

Учебный проект. Использование и лицензирование — по согласованию с автором.
