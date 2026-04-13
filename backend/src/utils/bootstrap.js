const { User } = require('../models');
const { roles } = require('../constants');
const { doctorsList } = require('../data/doctors');
const bcrypt = require('bcryptjs');

/**
 * Единый bootstrap: индексы + админ + сид врачей
 * Вызывается из database.js при каждом старте
 */
async function bootstrap() {
  // 1. Индексы (idempotent)
  await ensureIndexes();

  // 2. Админ из env
  await ensureAdmin();

  // 3. Сид врачей (если нет ни одного)
  await seedDoctors();
}

async function ensureIndexes() {
  try {
    await User.collection.dropIndex('phone_1');
  } catch { /* Не было */ }
  try {
    await User.collection.dropIndex('email_1');
  } catch { /* Не было */ }
  try {
    await User.collection.dropIndex('email_unique');
  } catch { /* Не было */ }

  await User.collection.createIndex({ phone: 1 }, { name: 'phone_idx' });
  await User.collection.createIndex({ email: 1 }, { sparse: true, unique: true, name: 'email_unique' });
}

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return; // Админ не настроен

  const exists = await User.findOne({ role: roles.ADMIN });
  if (exists) return; // Уже есть

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({
    firstName: process.env.ADMIN_FIRST_NAME || 'Админ',
    lastName: process.env.ADMIN_LAST_NAME || 'Системы',
    email,
    phone: process.env.ADMIN_PHONE || '',
    password: hashedPassword,
    role: roles.ADMIN
  });
  await admin.save();
  console.log(`✅ Админ создан: ${email}`);
}

async function seedDoctors() {
  const count = await User.countDocuments({ role: roles.DOCTOR });
  if (count > 0) return; // Врачи уже есть

  const total = await User.countDocuments();
  await User.insertMany(
    doctorsList.map((d, i) => ({
      legacyId: total + i + 1,
      role: roles.DOCTOR,
      firstName: d.name.split(' ')[0],
      lastName: d.name.split(' ').slice(1).join(' '),
      specialty: d.specialty,
      rating: d.rating,
      isOnline: d.isOnline,
      price: d.price
    }))
  );
  console.log(`✅ Создано ${doctorsList.length} врачей`);
}

module.exports = bootstrap;
