const nodemailer = require('nodemailer');
const { sendTelegramMessage } = require('../utils/telegram');
const { Appointment, User, ReminderLog } = require('../models');
const { roles } = require('../constants');

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;
/** Окно ±15 мин относительно «за 24ч / за 1ч» — совпадает с cron каждые 10 мин */
const WINDOW_MS = 15 * 60 * 1000;

function getMailConfig() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
  };
}

let transporterCache = null;
function getTransporter() {
  const cfg = getMailConfig();
  if (!cfg) return null;
  if (!transporterCache) {
    transporterCache = nodemailer.createTransport(cfg);
  }
  return transporterCache;
}

function parseSlot(appointment) {
  const { date, time } = appointment;
  if (!date || !time) return null;
  const iso = `${date}T${time.length === 5 ? `${time}:00` : time}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function sendEmail(to, subject, text) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const t = getTransporter();
  if (!t || !from) {
    console.warn('[reminders] SMTP не настроен (SMTP_HOST / MAIL_FROM)');
    return false;
  }
  await t.sendMail({ from, to, subject, text });
  return true;
}

function buildMessage(appointment, kind) {
  const when = `${appointment.date} в ${appointment.time}`;
  const doc = appointment.doctorName || 'Врач';
  if (kind === '24h') {
    return {
      subject: 'Напоминание: приём завтра',
      body: `Здравствуйте, ${appointment.patientName}!\n\nНапоминаем о записи к ${doc} на ${when}.\n\nС уважением, Мед24`
    };
  }
  return {
    subject: 'Напоминание: приём через час',
    body: `Здравствуйте, ${appointment.patientName}!\n\nЧерез час у вас приём у ${doc} (${when}).\n\nС уважением, Мед24`
  };
}

function inWindow(msUntil, targetMs) {
  return msUntil >= targetMs - WINDOW_MS && msUntil <= targetMs + WINDOW_MS;
}

/**
 * Одна итерация: найти подходящие записи и отправить напоминания.
 */
async function sendAppointmentReminders() {
  if (process.env.REMINDERS_ENABLED === 'false') {
    return { skipped: true };
  }

  const now = Date.now();
  const statuses = ['scheduled', 'confirmed'];
  const appointments = await Appointment.find({ status: { $in: statuses } }).lean();

  let logsCreated = 0;
  let emails = 0;
  let telegrams = 0;

  for (const a of appointments) {
    const slot = parseSlot(a);
    if (!slot) continue;
    const msUntil = slot.getTime() - now;
    if (msUntil <= 0) continue;

    for (const kind of ['24h', '1h']) {
      const target = kind === '24h' ? MS_DAY : MS_HOUR;
      if (!inWindow(msUntil, target)) continue;

      const existing = await ReminderLog.findOne({ appointmentId: a._id, kind }).lean();
      if (existing) continue;

      const patient = await User.findById(a.patientId).lean();
      if (!patient || patient.role !== roles.PATIENT) continue;

      const { subject, body } = buildMessage(a, kind);
      let emailSent = false;
      let telegramSent = false;

      if (patient.reminderEmail !== false && patient.email) {
        try {
          emailSent = await sendEmail(patient.email, subject, body);
          if (emailSent) emails += 1;
        } catch (e) {
          console.error('[reminders] email error', e.message);
        }
      }

      if (patient.reminderTelegram && process.env.TELEGRAM_BOT_TOKEN && patient.telegramChatId) {
        const html = `<b>${subject}</b>\n\n${body.replace(/\n/g, '\n')}`;
        try {
          telegramSent = await sendTelegramMessage(patient.telegramChatId, html);
          if (telegramSent) telegrams += 1;
        } catch (e) {
          console.error('[reminders] telegram error', e.message);
        }
      }

      if (emailSent || telegramSent) {
        await ReminderLog.create({
          appointmentId: a._id,
          kind,
          emailSent,
          telegramSent
        });
        logsCreated += 1;
        console.log(
          `[reminders] ${kind} → appointment ${a._id} email=${emailSent} tg=${telegramSent}`
        );
      } else {
        const wants =
          (patient.reminderEmail !== false && patient.email) ||
          (patient.reminderTelegram && patient.telegramChatId && process.env.TELEGRAM_BOT_TOKEN);
        if (!wants) {
          await ReminderLog.create({
            appointmentId: a._id,
            kind,
            emailSent: false,
            telegramSent: false
          });
          logsCreated += 1;
          console.log(`[reminders] ${kind} → appointment ${a._id} skipped (нет каналов)`);
        } else {
          console.warn(`[reminders] ${kind} → appointment ${a._id} send failed, will retry`);
        }
      }
    }
  }

  return { logsCreated, emails, telegrams, checked: appointments.length };
}

module.exports = { sendAppointmentReminders, parseSlot, inWindow };
