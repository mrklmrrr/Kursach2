/**
 * Публичные данные платформы: тарифы, витрина для лендинга
 */
class PlatformController {
  getPlans(req, res) {
    res.json({
      plans: [
        {
          id: 'starter',
          name: 'Старт',
          priceBYN: 0,
          period: 'пилот',
          features: ['До 5 врачей', 'Чат и видео в браузере', 'Базовая аналитика'],
          highlight: false
        },
        {
          id: 'clinic',
          name: 'Клиника',
          priceBYN: 490,
          period: 'в месяц',
          features: ['Неограниченно врачей', 'Напоминания email/Telegram', 'B2B-дашборд и отчёты', 'e-назначения'],
          highlight: true
        },
        {
          id: 'network',
          name: 'Сеть',
          priceBYN: 1290,
          period: 'в месяц',
          features: ['Несколько точек', 'SLA и журнал действий', 'Экспорт PDF/Excel', 'Интеграции'],
          highlight: false
        },
        {
          id: 'packages',
          name: 'Пакеты для пациентов',
          priceBYN: 79,
          period: '3 консультации',
          features: ['Скидка на пакет', 'Приоритет в очереди', 'Единый чек'],
          highlight: false
        }
      ]
    });
  }
}

module.exports = PlatformController;
