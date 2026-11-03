import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Appointment, APPOINTMENT_TYPES, ACTIVE_STATUSES } from '../models/Appointment.js';
import { asyncHandler, clean, validate, requireAdmin, HttpError } from '../lib/http.js';
import { dateProblem, slotsFor, getStudioHours, todayInStudio } from '../lib/slots.js';
import { makeReference } from '../lib/refs.js';
import { sendMail } from '../lib/mailer.js';
import { env } from '../config/env.js';

const router = Router();
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const slotKey = (date, time) => `${date}T${time}`;

async function takenTimes(date) {
  const booked = await Appointment.find({ date, status: { $in: ACTIVE_STATUSES } }, { time: 1 }).lean();
  return new Set(booked.map((a) => a.time));
}

// GET /api/appointments/config — studio calendar rules for the date picker.
router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const hours = await getStudioHours();
    res.json({
      today: todayInStudio(),
      closedWeekdays: hours.closedWeekdays,
      closedDates: hours.closedDates,
      bookingWindowDays: hours.bookingWindowDays,
      types: APPOINTMENT_TYPES,
    });
  }),
);

// GET /api/appointments/slots?date=YYYY-MM-DD
router.get(
  '/slots',
  asyncHandler(async (req, res) => {
    const date = clean(req.query.date, 10);
    const hours = await getStudioHours();
    const problem = dateProblem(date, hours);
    if (problem) return res.json({ date, slots: [], reason: problem });
    const taken = await takenTimes(date);
    const slots = slotsFor(date, hours).map((time) => ({ time, available: !taken.has(time) }));
    res.json({ date, slots, reason: slots.length ? null : 'No slots remain on this day.' });
  }),
);

// POST /api/appointments — creates a booking request that holds the slot.
router.post(
  '/',
  submitLimiter,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const data = {
      name: clean(b.name, 120),
      email: clean(b.email, 160),
      phone: clean(b.phone, 20),
      gender: clean(b.gender, 10),
      type: clean(b.type, 30),
      date: clean(b.date, 10),
      time: clean(b.time, 5),
      eventDate: clean(b.eventDate, 10),
      requirements: clean(b.requirements, 1500),
      message: clean(b.message, 1500),
    };
    validate({
      name: { value: data.name, required: true },
      email: { value: data.email, required: true, email: true },
      phone: { value: data.phone, required: true, phone: true },
      gender: { value: data.gender, required: true, oneOf: ['women', 'men'] },
      type: { value: data.type, required: true, oneOf: APPOINTMENT_TYPES },
      date: { value: data.date, required: true },
      time: { value: data.time, required: true },
    });

    const hours = await getStudioHours();
    const problem = dateProblem(data.date, hours);
    if (problem) throw new HttpError(422, problem, { date: problem });
    if (!slotsFor(data.date, hours).includes(data.time))
      throw new HttpError(422, 'That time is not available.', { time: 'Choose one of the available slots.' });

    let appointment;
    try {
      appointment = await Appointment.create({
        ...data,
        reference: makeReference('RKA'),
        user: req.user?._id,
        slotKey: slotKey(data.date, data.time),
      });
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.slotKey)
        throw new HttpError(409, 'Sorry — that slot was just booked. Please choose another time.', {
          time: 'This slot is no longer available.',
        });
      throw err;
    }

    const emailed = await sendMail({
      to: data.email,
      subject: `RK FASHIONS — Appointment request ${appointment.reference}`,
      text: `Dear ${data.name},\n\nWe have received your appointment request (${appointment.reference}) for ${data.date} at ${data.time}. The slot is being held for you while our studio team confirms it — you will hear from us shortly.\n\nWarm regards,\nRK FASHIONS`,
    });
    sendMail({
      to: env.studioEmail,
      subject: `Appointment request ${appointment.reference} — ${data.date} ${data.time}`,
      text: `${data.name} (${data.phone}) requested a ${data.type} consultation.\n\n${data.requirements}\n${data.message}`,
    });

    res.status(201).json({
      reference: appointment.reference,
      status: appointment.status,
      date: appointment.date,
      time: appointment.time,
      emailed,
    });
  }),
);

// ── Admin: list, accept, reject, reschedule ──
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json({ appointments: await Appointment.find(filter).sort({ date: 1, time: 1 }).lean() });
  }),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) throw new HttpError(404, 'Appointment not found.');
    const { status, date, time, adminNote } = req.body || {};

    if (date || time) {
      const nextDate = date || appt.date;
      const nextTime = time || appt.time;
      const hours = await getStudioHours();
      const problem = dateProblem(nextDate, hours);
      if (problem) throw new HttpError(422, problem);
      if (!slotsFor(nextDate, hours).includes(nextTime)) throw new HttpError(422, 'That time is not a studio slot.');
      appt.date = nextDate;
      appt.time = nextTime;
    }
    if (status) appt.status = status;
    if (adminNote !== undefined) appt.adminNote = clean(adminNote, 1000);
    appt.slotKey = ACTIVE_STATUSES.includes(appt.status) ? slotKey(appt.date, appt.time) : undefined;

    try {
      await appt.save();
    } catch (err) {
      if (err.code === 11000) throw new HttpError(409, 'That slot is already held by another booking.');
      throw err;
    }

    if (status === 'confirmed' || status === 'rejected' || date || time) {
      const msg = {
        confirmed: `Your appointment ${appt.reference} on ${appt.date} at ${appt.time} is confirmed. We look forward to welcoming you.`,
        rejected: `We're sorry — we are unable to accommodate appointment ${appt.reference}. Please choose another time on our website.`,
      }[status] || `Your appointment ${appt.reference} has been rescheduled to ${appt.date} at ${appt.time}.`;
      await sendMail({ to: appt.email, subject: `RK FASHIONS — Appointment ${appt.reference}`, text: `Dear ${appt.name},\n\n${msg}\n\nRK FASHIONS` });
    }
    res.json({ appointment: appt });
  }),
);

export default router;
