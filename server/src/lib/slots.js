import { getSetting, putSetting } from '../models/Setting.js';
import { HttpError } from './http.js';

// Default studio consultation calendar. The admin dashboard saves overrides in
// the `studioHours` setting; these values apply until then.
export const STUDIO_HOURS = {
  slotTimes: ['11:00', '12:00', '13:00', '14:30', '15:30', '16:30', '17:30', '18:30'],
  closedWeekdays: [1], // 0 = Sunday … 6 = Saturday. Closed on Mondays.
  closedDates: [], // e.g. ['2026-11-08'] for Diwali
  bookingWindowDays: 60,
  timeZone: 'Asia/Kolkata',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

let cache = null;

export async function getStudioHours() {
  cache ??= { ...STUDIO_HOURS, ...(await getSetting('studioHours', {})) };
  return cache;
}

/** Validates and saves studio hours from the admin dashboard. Returns the merged hours. */
export async function saveStudioHours(input = {}) {
  const slotTimes = [...new Set((input.slotTimes || []).filter((t) => TIME_RE.test(t)))].sort();
  const closedWeekdays = [...new Set((input.closedWeekdays || []).map(Number).filter((d) => d >= 0 && d <= 6))];
  const closedDates = [...new Set((input.closedDates || []).filter((d) => DATE_RE.test(d)))].sort();
  const bookingWindowDays = Math.max(1, Math.min(365, Number(input.bookingWindowDays) || STUDIO_HOURS.bookingWindowDays));
  if (!slotTimes.length) throw new HttpError(422, 'Add at least one appointment time.');
  await putSetting('studioHours', { slotTimes, closedWeekdays, closedDates, bookingWindowDays });
  cache = null;
  return getStudioHours();
}

export function todayInStudio() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: STUDIO_HOURS.timeZone }).format(new Date());
}

function nowMinutesInStudio() {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: STUDIO_HOURS.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .split(':')
    .map(Number);
  return h * 60 + m;
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Returns null if the date can be booked, otherwise a human reason. */
export function dateProblem(date, hours = STUDIO_HOURS) {
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return 'Invalid date.';
  const today = todayInStudio();
  if (date < today) return 'Please choose a future date.';
  if (date > addDays(today, hours.bookingWindowDays))
    return `Appointments open up to ${hours.bookingWindowDays} days ahead.`;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (hours.closedWeekdays.includes(weekday) || hours.closedDates.includes(date))
    return 'The studio is closed on this day.';
  return null;
}

/** Slot times for a date, excluding slots already in the past (same-day, with a 2-hour buffer). */
export function slotsFor(date, hours = STUDIO_HOURS) {
  if (dateProblem(date, hours)) return [];
  if (date !== todayInStudio()) return hours.slotTimes;
  const cutoff = nowMinutesInStudio() + 120;
  return hours.slotTimes.filter((t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m >= cutoff;
  });
}
