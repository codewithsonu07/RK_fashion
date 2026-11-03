import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Enquiry } from '../models/Enquiry.js';
import { asyncHandler, clean, validate, requireAdmin, HttpError } from '../lib/http.js';
import { imageUpload, storeImage } from '../lib/storage.js';
import { makeReference } from '../lib/refs.js';
import { sendMail } from '../lib/mailer.js';
import { env } from '../config/env.js';

const router = Router();
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const MEASUREMENT_KEYS = [
  'height', 'bust', 'chest', 'waist', 'hips', 'shoulder', 'sleeveLength', 'armhole',
  'topLength', 'bottomLength', 'neck', 'inseam',
];

// POST /api/enquiries — multipart form with up to 6 `inspiration` images.
router.post(
  '/',
  submitLimiter,
  imageUpload.array('inspiration', 6),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const data = {
      gender: clean(b.gender, 10),
      category: clean(b.category, 80),
      garment: clean(b.garment, 80),
      fabric: clean(b.fabric, 80),
      colour: clean(b.colour, 80),
      embellishments: clean(b.embellishments, 400).split(',').map((s) => s.trim()).filter(Boolean),
      designNotes: clean(b.designNotes, 1000),
      description: clean(b.description, 3000),
      referenceProduct: clean(b.referenceProduct, 120),
      eventDate: clean(b.eventDate, 10),
      budget: clean(b.budget, 60),
      appointmentPreference: clean(b.appointmentPreference, 20),
      contact: { name: clean(b.name, 120), email: clean(b.email, 160), phone: clean(b.phone, 20), city: clean(b.city, 80) },
    };

    validate({
      gender: { value: data.gender, required: true, oneOf: ['women', 'men'] },
      category: { value: data.category, required: true },
      garment: { value: data.garment, required: true },
      description: { value: data.description, required: true },
      appointmentPreference: { value: data.appointmentPreference, required: true, oneOf: ['in-store', 'online', 'call-back'] },
      name: { value: data.contact.name, required: true },
      email: { value: data.contact.email, required: true, email: true },
      phone: { value: data.contact.phone, required: true, phone: true },
    });

    const values = {};
    for (const key of MEASUREMENT_KEYS) {
      const v = clean(b[`m_${key}`], 10);
      if (v) values[key] = v;
    }
    data.measurements = {
      unit: b.unit === 'cm' ? 'cm' : 'in',
      takeAtAppointment: b.takeAtAppointment === 'true',
      values,
    };

    data.inspirationImages = await Promise.all((req.files || []).map((f) => storeImage(f, 'inspiration')));
    data.reference = makeReference('RKB');
    if (req.user) data.user = req.user._id;

    const enquiry = await Enquiry.create(data);

    const emailed = await sendMail({
      to: data.contact.email,
      subject: `RK FASHIONS — Bespoke enquiry received (${enquiry.reference})`,
      text: `Dear ${data.contact.name},\n\nThank you for sharing your vision with RK FASHIONS. Your bespoke enquiry ${enquiry.reference} for a ${data.garment} has been received.\n\nRohit Kumar and the design team will review your brief and contact you within 2 working days to discuss the design and share a quotation.\n\nWarm regards,\nRK FASHIONS`,
    });
    sendMail({
      to: env.studioEmail,
      subject: `New bespoke enquiry ${enquiry.reference} — ${data.garment}`,
      text: `${data.contact.name} (${data.contact.phone}, ${data.contact.email}) submitted a bespoke enquiry.\n\n${data.description}`,
    });

    res.status(201).json({ reference: enquiry.reference, status: enquiry.status, emailed });
  }),
);

// ── Admin ──
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json({ enquiries: await Enquiry.find(filter).sort({ createdAt: -1 }).lean() });
  }),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) throw new HttpError(404, 'Enquiry not found.');
    if (req.body.status) enquiry.status = req.body.status;
    const amount = Number(req.body.quote?.amount);
    const newQuote = amount > 0 && (amount !== enquiry.quote?.amount || clean(req.body.quote.notes, 1000) !== (enquiry.quote?.notes || ''));
    if (req.body.quote) {
      if (!(amount > 0)) throw new HttpError(422, 'Enter a quotation amount above zero.');
      enquiry.quote = { amount, notes: clean(req.body.quote.notes, 1000), sentAt: newQuote ? new Date() : enquiry.quote?.sentAt };
    }
    await enquiry.save();
    let emailed = false;
    if (newQuote)
      emailed = await sendMail({
        to: enquiry.contact.email,
        subject: `RK FASHIONS — Your bespoke quotation (${enquiry.reference})`,
        text: `Dear ${enquiry.contact.name},\n\nThank you for sharing your vision for your ${enquiry.garment}. Our quotation is ₹${amount.toLocaleString('en-IN')}.${enquiry.quote.notes ? `\n\n${enquiry.quote.notes}` : ''}\n\nReply to this email or book a consultation at ${env.clientUrl}/appointment to take the next step.\n\nWarm regards,\nRohit Kumar & the RK FASHIONS team`,
      });
    res.json({ enquiry, emailed });
  }),
);

export default router;
