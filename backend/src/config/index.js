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

const config = {
  port: process.env.PORT || 5001,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: process.env.JWT_ISSUER || 'kursach-backend',
    audience: process.env.JWT_AUDIENCE || 'kursach-frontend'
  },
  mongoUri: process.env.MONGO_URI,
  frontendOrigins,
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;
