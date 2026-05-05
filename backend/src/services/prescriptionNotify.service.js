const { User } = require('../models');
const { roles } = require('../constants');
const { sendTelegramMessage } = require('../utils/telegram');

/**
 * Уведомление в Telegram о новых назначениях (дата, препараты, рекомендации).
 */
async function notifyPrescriptionTelegram(patient, prescription) {
  if (!patient.telegramChatId || !patient.reminderTelegram) {
    return false;
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) return false;

  const dateStr = prescription.createdAt
    ? new Date(prescription.createdAt).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('ru-RU');

  const blocks = Array.isArray(prescription.blocks) && prescription.blocks.length > 0
    ? prescription.blocks
    : [{ title: 'Назначения', items: prescription.items || [] }];

  const lines = blocks
    .map((block) => {
      const title = String(block.title || 'Назначения').trim();
      const items = (block.items || []).map(
        (i) => `• ${escapeHtml(i.name)}${i.dosage ? ` — ${escapeHtml(i.dosage)}` : ''}${i.notes ? ` (${escapeHtml(i.notes)})` : ''}`
      );
      if (items.length === 0) return '';
      return `<b>${escapeHtml(title)}</b>\n${items.join('\n')}`;
    })
    .filter(Boolean);

  let text = `<b>Назначения от ${escapeHtml(prescription.doctorName || 'врача')}</b>\n`;
  text += `📅 <i>${dateStr}</i>\n\n`;
  text += lines.join('\n\n');
  if (prescription.recommendations && String(prescription.recommendations).trim()) {
    text += `\n\n<b>Рекомендации врача:</b>\n${escapeHtml(prescription.recommendations.trim())}`;
  }

  return sendTelegramMessage(patient.telegramChatId, text);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Еженедельное напоминание о сохранённых рекомендациях.
 */
async function sendWeeklyHealthRecommendationReminders() {
  if (process.env.REMINDERS_ENABLED === 'false') return { skipped: true };
  if (!process.env.TELEGRAM_BOT_TOKEN) return { skipped: true };

  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const users = await User.find({
    role: roles.PATIENT,
    reminderTelegram: true,
    telegramChatId: { $nin: [null, ''] },
    healthRecommendations: { $nin: [null, ''] }
  }).lean();

  let sent = 0;
  for (const u of users) {
    const last = u.lastHealthPushAt ? new Date(u.lastHealthPushAt).getTime() : 0;
    if (last && now - last < MS_WEEK) continue;

    const ok = await sendTelegramMessage(
      u.telegramChatId,
      `<b>Напоминание о рекомендациях врача</b>\n\n${escapeHtml(u.healthRecommendations)}`
    );
    if (ok) {
      await User.updateOne({ _id: u._id }, { $set: { lastHealthPushAt: new Date() } });
      sent += 1;
    }
  }

  return { sent, checked: users.length };
}

module.exports = { notifyPrescriptionTelegram, sendWeeklyHealthRecommendationReminders };
