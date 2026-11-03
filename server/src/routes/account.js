import { Router } from 'express';
import { asyncHandler, clean } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { Appointment } from '../models/Appointment.js';
import { Enquiry } from '../models/Enquiry.js';
import { Product } from '../models/Product.js';

const router = Router();
router.use(requireUser);

// Replace the saved wishlist (the client merges guest + account lists first).
router.put(
  '/wishlist',
  asyncHandler(async (req, res) => {
    const slugs = [...new Set((Array.isArray(req.body?.wishlist) ? req.body.wishlist : []).map((s) => clean(s, 120)).filter(Boolean))].slice(0, 200);
    const existing = await Product.find({ slug: { $in: slugs } }, { slug: 1 }).lean();
    const valid = new Set(existing.map((p) => p.slug));
    req.user.wishlist = slugs.filter((s) => valid.has(s));
    await req.user.save();
    res.json({ wishlist: req.user.wishlist });
  }),
);

router.put(
  '/bag',
  asyncHandler(async (req, res) => {
    const items = (Array.isArray(req.body?.bag) ? req.body.bag : []).slice(0, 50).map((i) => ({
      slug: clean(i.slug, 120),
      size: clean(i.size, 10),
      colour: clean(i.colour, 60),
      qty: Math.max(1, Math.min(5, Number(i.qty) || 1)),
    }));
    req.user.bag = items.filter((i) => i.slug && i.size);
    await req.user.save();
    res.json({ bag: req.user.bag });
  }),
);

// Appointments and bespoke enquiries made while signed in.
router.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const [appointments, enquiries] = await Promise.all([
      Appointment.find({ user: req.user._id }, { slotKey: 0 }).sort({ date: -1, time: -1 }).lean(),
      Enquiry.find({ user: req.user._id }, { reference: 1, garment: 1, category: 1, status: 1, createdAt: 1, appointmentPreference: 1, quote: 1 })
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    res.json({ appointments, enquiries });
  }),
);

export default router;
