const mongoose = require('mongoose');
const { ResearchType } = require('../models/Research');

async function seedResearchTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_app');

    const researchTypes = [
      {
        name: 'Общий анализ крови',
        category: 'laboratory',
        template: [
          { name: 'Гемоглобин', type: 'number', unit: 'г/л', required: true },
          { name: 'Эритроциты', type: 'number', unit: '×10¹²/л', required: true },
          { name: 'Лейкоциты', type: 'number', unit: '×10⁹/л', required: true },
          { name: 'Тромбоциты', type: 'number', unit: '×10⁹/л', required: true }
        ]
      },
      {
        name: 'Биохимический анализ крови',
        category: 'laboratory',
        template: [
          { name: 'Глюкоза', type: 'number', unit: 'ммоль/л', required: true },
          { name: 'Креатинин', type: 'number', unit: 'мкмоль/л', required: true },
          { name: 'Мочевина', type: 'number', unit: 'ммоль/л', required: true },
          { name: 'Билирубин общий', type: 'number', unit: 'мкмоль/л', required: true }
        ]
      },
      {
        name: 'Электрокардиография (ЭКГ)',
        category: 'instrumental',
        template: [
          { name: 'Ритм', type: 'string', unit: '', required: true },
          { name: 'ЧСС', type: 'number', unit: 'уд/мин', required: true },
          { name: 'Заключение', type: 'string', unit: '', required: true }
        ]
      },
      {
        name: 'Ультразвуковое исследование брюшной полости',
        category: 'instrumental',
        template: [
          { name: 'Печень', type: 'string', unit: '', required: true },
          { name: 'Желчный пузырь', type: 'string', unit: '', required: true },
          { name: 'Поджелудочная железа', type: 'string', unit: '', required: true },
          { name: 'Селезенка', type: 'string', unit: '', required: true },
          { name: 'Заключение', type: 'string', unit: '', required: true }
        ]
      }
    ];

    for (const typeData of researchTypes) {
      const existing = await ResearchType.findOne({ name: typeData.name });
      if (!existing) {
        await ResearchType.create(typeData);
        console.log(`Created research type: ${typeData.name}`);
      } else {
        console.log(`Research type already exists: ${typeData.name}`);
      }
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedResearchTypes();