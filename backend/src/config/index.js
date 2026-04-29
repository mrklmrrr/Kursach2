require('dotenv').config();

const required = ['JWT_SECRET', 'MONGO_URI'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

const frontendOrigins = String(process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const port = process.env.PORT || 5001;

const config = {
  port,
  /** Базовый URL API для ссылок на статику (аватары): без завершающего слэша */
  publicApiBase: (process.env.PUBLIC_API_BASE || `http://localhost:${port}`).replace(/\/$/, ''),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'kursach-backend',
    audience: process.env.JWT_AUDIENCE || 'kursach-frontend'
  },
  mongoUri: process.env.MONGO_URI,
  frontendOrigins,
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;
