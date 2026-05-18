# API в интернете (мобильная сеть, iOS, веб)

Сайт [med24-nine.vercel.app](https://med24-nine.vercel.app) — только **фронтенд**.  
iOS и веб-логин нуждаются в **Node-бекенде** с HTTPS (чаты и звонки — Socket.IO).

## 1. Render (рекомендуется)

1. Зарегистрируйтесь на [render.com](https://render.com).
2. **New → Blueprint** → подключите репозиторий `Kursach2` (или залейте код на GitHub).
3. Render подхватит `render.yaml` и создаст сервис `med24-api`.
4. В **Environment** задайте (скопируйте из `backend/.env` на Mac):
   - `MONGO_URI` — тот же MongoDB Atlas, что у веба
   - `JWT_SECRET` — тот же, что в `.env` (иначе старые токены не подойдут)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — по желанию
5. После деплоя откройте URL вида `https://med24-api.onrender.com/api/health` — должен быть JSON: `{"status":"ok"}`.

**Важно:** на бесплатном плане сервер «засыпает»; первый запрос после паузы может идти 30–60 с.

### Веб на Vercel (те же данные, что на телефоне)

В проекте **frontend** на Vercel → **Environment Variables**:

| Переменная | Значение |
|------------|----------|
| `VITE_API_URL` | `https://med24-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://med24-api.onrender.com` |

Пересоберите деплой фронта.

## 2. iOS

В `Med24Patient/Core/APIConfig.swift` укажите тот же хост:

```swift
static let productionOrigin = "https://med24-api.onrender.com"
```

На **реальном iPhone** уже включён `.production`. Пересоберите в Xcode.

## 3. Проверка

- iPhone с **отключённым Wi‑Fi** (только LTE): вход, список врачей, чат.
- Врач на [med24-nine.vercel.app](https://med24-nine.vercel.app) и пациент в iOS должны бить в **один** API (один `MONGO_URI`).
