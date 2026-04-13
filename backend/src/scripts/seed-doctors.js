/**
 * Скрипт: добавляет врачей из data/doctors.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

async function seedDoctors() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB подключён');

    const { User } = require('../models');
    const { roles } = require('../constants');
    const { doctorsList } = require('../data/doctors');

    // Удаляем существующих врачей-ботов
    await User.deleteMany({ role: roles.DOCTOR });
    console.log('🗑️ Старые врачи-боты удалены');

    // Вставляем заново
    const counter = await User.countDocuments();
    const docs = await User.insertMany(
      doctorsList.map((d, i) => ({
        legacyId: counter + i + 1,
        role: roles.DOCTOR,
        firstName: d.name.split(' ')[0],
        lastName: d.name.split(' ').slice(1).join(' '),
        specialty: d.specialty,
        rating: d.rating,
        isOnline: d.isOnline,
        price: d.price
      }))
    );

    console.log(`✅ Создано ${docs.length} врачей:`);
    docs.forEach(d => console.log(`   ${d.firstName} ${d.lastName} — ${d.specialty}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

seedDoctors();
