import nodemailer from 'nodemailer';
import { env, isMailConfigured } from '../config/env.js';

const transport = isMailConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

/**
 * Sends an email when SMTP is configured. Returns true if sent, false if
 * skipped or failed — callers must never claim a notification was sent
 * unless this returns true.
 */
export async function sendMail({ to, subject, text }) {
  if (!transport || !to) {
    console.log(`[mail] skipped (SMTP not configured): ${subject}`);
    return false;
  }
  try {
    await transport.sendMail({ from: env.smtp.from, to, subject, text });
    return true;
  } catch (err) {
    console.error('[mail] failed:', err.message);
    return false;
  }
}
