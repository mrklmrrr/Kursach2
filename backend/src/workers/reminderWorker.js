const cron = require('node-cron');
const { sendAppointmentReminders } = require('../services/reminderDispatch.service');
const { sendWeeklyHealthRecommendationReminders } = require('../services/prescriptionNotify.service');

function startReminderWorker() {
  if (process.env.REMINDERS_ENABLED === 'false') {
    console.log('⏸ Напоминания отключены (REMINDERS_ENABLED=false)');
    return;
  }

  const cronOpts = {};
  if (process.env.TZ) {
    cronOpts.timezone = process.env.TZ;
  }

  cron.schedule(
    '*/10 * * * *',
    async () => {
      try {
        const r = await sendAppointmentReminders();
        if (r?.skipped) return;
        if (r && (r.emails > 0 || r.telegrams > 0 || r.logsCreated > 0)) {
          console.log('[reminders] tick', r);
        }
      } catch (e) {
        console.error('[reminders] worker error', e.message);
      }
    },
    cronOpts
  );

  cron.schedule(
    '0 10 * * *',
    async () => {
      try {
        const r = await sendWeeklyHealthRecommendationReminders();
        if (r?.skipped) return;
        if (r?.sent > 0) {
          console.log('[health-reminders] weekly Telegram', r);
        }
      } catch (e) {
        console.error('[health-reminders] worker error', e.message);
      }
    },
    cronOpts
  );

  console.log('📅 Воркер напоминаний: каждые 10 мин (приёмы); ежедневно 10:00 — напоминания о рекомендациях в Telegram (не чаще раза в 7 дней на пользователя)');
}

module.exports = { startReminderWorker };
