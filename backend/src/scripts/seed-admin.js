/**
 * Seed-скрипт: создаёт первого администратора
 * Запуск: node src/scripts/seed-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config');

async function seedAdmin() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB подключён');

    const { User } = require('../models');
    const { roles } = require('../constants');

    // Проверяем, есть ли уже админ
    const existingAdmin = await User.findOne({ role: roles.ADMIN });
    if (existingAdmin) {
      console.log(`⚠️ Админ уже существует: ${existingAdmin.email}`);
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new User({
      firstName: 'Админ',
      lastName: 'Системы',
      email: 'admin@med24.ru',
      phone: '+70000000000',
      password: hashedPassword,
      role: roles.ADMIN
    });

    await admin.save();
    console.log('✅ Админ создан:');
    console.log('   Email: admin@med24.ru');
    console.log('   Пароль: admin123');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

seedAdmin();
