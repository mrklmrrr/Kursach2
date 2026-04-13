/**
 * Скрипт: удаляет старый уникальный индекс с phone
 */
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

async function fixIndex() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB подключён');

    const { User } = require('../models');

    // Удаляем уникальный индекс phone_1
    try {
      await User.collection.dropIndex('phone_1');
      console.log('✅ Уникальный индекс phone_1 удалён');
    } catch {
      console.log('⚠️ Индекс phone_1 не найден, пропускаем');
    }

    // Создаём обычный индекс
    await User.collection.createIndex({ phone: 1 }, { name: 'phone_idx' });
    console.log('✅ Создан обычный индекс phone');

    await mongoose.disconnect();
    console.log('✅ Готово!');
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

fixIndex();
