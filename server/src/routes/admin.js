import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Enquiry } from '../models/Enquiry.js';
import { Appointment } from '../models/Appointment.js';
import { Subscriber } from '../models/Subscriber.js';
import { asyncHandler, clean, requireAdmin, HttpError } from '../lib/http.js';
import { imageUpload, storeImage } from '../lib/storage.js';
import { getStudioHours, saveStudioHours } from '../lib/slots.js';
import { getContent, saveContent } from '../lib/content.js';

const router = Router();
router.use(requireAdmin);

const PAID_STATUSES = ['placed', 'processing', 'shipped', 'delivered'];

// ───────── Dashboard & sales reports ─────────
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const days = Math.max(7, Math.min(365, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 86400000);
    const sold = { status: { $in: PAID_STATUSES } };

    const [totals, byDay, byStatus, topProducts, byCategory, customers, newEnquiries, pendingAppointments, lowStock] = await Promise.all([
      Order.aggregate([{ $match: sold }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { ...sold, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: sold },
        { $unwind: '$items' },
        { $group: { _id: '$items.slug', name: { $first: '$items.name' }, units: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: sold },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.slug', foreignField: 'slug', as: 'p' } },
        { $group: { _id: { $ifNull: [{ $first: '$p.gender' }, 'unknown'] }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } },
      ]),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Enquiry.countDocuments({ status: 'new' }),
      Appointment.countDocuments({ status: 'requested' }),
      Product.find({ stock: { $lte: 2 }, published: true }, { name: 1, slug: 1, stock: 1 }).sort({ stock: 1 }).limit(8).lean(),
    ]);

    res.json({
      days,
      revenue: totals[0]?.revenue || 0,
      orders: totals[0]?.orders || 0,
      averageOrder: totals[0] ? Math.round(totals[0].revenue / totals[0].orders) : 0,
      byDay,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      byGender: Object.fromEntries(byCategory.map((s) => [s._id, s.revenue])),
      topProducts,
      customers,
      newEnquiries,
      pendingAppointments,
      lowStock,
    });
  }),
);

// CSV export of orders for accounting.
router.get(
  '/orders.csv',
  asyncHandler(async (_req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Order', 'Date', 'Customer email', 'Items', 'Subtotal', 'Shipping', 'Total', 'Status', 'Payment method', 'Payment status', 'City', 'State', 'PIN'],
      ...orders.map((o) => [
        o.orderNumber,
        new Date(o.createdAt).toISOString(),
        o.email,
        o.items.map((i) => `${i.name} (${i.size}) x${i.qty}`).join('; '),
        o.subtotal,
        o.shippingFee,
        o.total,
        o.status,
        o.payment?.method,
        o.payment?.status,
        o.shippingAddress?.city,
        o.shippingAddress?.state,
        o.shippingAddress?.pincode,
      ]),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rk-fashions-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(rows.map((r) => r.map(esc).join(',')).join('\n'));
  }),
);

// ───────── Products & inventory ─────────
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const strList = (v, max = 30) => (Array.isArray(v) ? v.map((x) => clean(String(x), 60)).filter(Boolean).slice(0, max) : []);

function productFromBody(b, partial = false) {
  const out = {};
  const has = (k) => b[k] !== undefined;
  if (!partial || has('name')) out.name = clean(b.name, 120);
  if (!partial || has('gender')) out.gender = b.gender;
  if (!partial || has('category')) out.category = clean(b.category, 60);
  if (!partial || has('price')) out.price = Number(b.price);
  if (has('stock') || !partial) out.stock = Math.max(0, Math.floor(Number(b.stock) || 0));
  for (const k of ['description', 'fabric', 'craft', 'care', 'delivery']) if (has(k)) out[k] = clean(b[k], 3000);
  for (const k of ['collections', 'occasions', 'sizes']) if (has(k)) out[k] = strList(b[k]);
  if (has('images')) out.images = (Array.isArray(b.images) ? b.images : []).map((u) => clean(String(u), 500)).filter(Boolean).slice(0, 12);
  if (has('colours'))
    out.colours = (Array.isArray(b.colours) ? b.colours : [])
      .map((c) => ({ name: clean(c?.name, 40), hex: /^#[0-9a-fA-F]{6}$/.test(c?.hex) ? c.hex : '#C6A770' }))
      .filter((c) => c.name)
      .slice(0, 12);
  for (const k of ['customisable', 'readyToShip', 'newArrival', 'bestSeller', 'published']) if (has(k)) out[k] = Boolean(b[k]);

  const errors = {};
  if ('name' in out && !out.name) errors.name = 'Required.';
  if ('gender' in out && !['women', 'men'].includes(out.gender)) errors.gender = 'Choose women or men.';
  if ('category' in out && !out.category) errors.category = 'Required.';
  if ('price' in out && !(out.price > 0)) errors.price = 'Enter a price above zero.';
  if (!partial && !out.images?.length) errors.images = 'Add at least one image.';
  if (!partial && !out.sizes?.length) errors.sizes = 'Add at least one size.';
  if (Object.keys(errors).length) throw new HttpError(422, 'Please check the highlighted fields.', errors);
  return out;
}

router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    res.json({ products: await Product.find().sort({ publishedAt: -1 }).lean() });
  }),
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const data = productFromBody(req.body || {});
    let slug = slugify(req.body.slug || data.name);
    if (!slug) throw new HttpError(422, 'Please check the highlighted fields.', { name: 'Required.' });
    for (let n = 2; await Product.exists({ slug }); n++) slug = `${slugify(req.body.slug || data.name)}-${n}`;
    const product = await Product.create({ ...data, slug, publishedAt: new Date() });
    res.status(201).json({ product });
  }),
);

router.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const data = productFromBody(req.body || {}, true);
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    if (!product) throw new HttpError(404, 'Product not found.');
    res.json({ product });
  }),
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found.');
    // Products that appear in orders are hidden instead of deleted, so order history stays intact.
    if (await Order.exists({ 'items.slug': product.slug })) {
      product.published = false;
      await product.save();
      return res.json({ archived: true, product });
    }
    await product.deleteOne();
    res.json({ deleted: true });
  }),
);

// Image upload for products, banners and content (Cloudinary when configured).
router.post(
  '/uploads',
  imageUpload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw new HttpError(422, 'Choose at least one image.');
    const images = await Promise.all(req.files.map((f) => storeImage(f, 'catalogue')));
    res.status(201).json({ images });
  }),
);

// ───────── Customers ─────────
router.get(
  '/customers',
  asyncHandler(async (_req, res) => {
    const [users, stats] = await Promise.all([
      User.find({}, { name: 1, email: 1, phone: 1, role: 1, createdAt: 1, address: 1 }).sort({ createdAt: -1 }).lean(),
      Order.aggregate([{ $match: { status: { $in: PAID_STATUSES } } }, { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, last: { $max: '$createdAt' } } }]),
    ]);
    const byUser = new Map(stats.map((s) => [String(s._id), s]));
    res.json({
      customers: users.map((u) => ({
        ...u,
        city: u.address?.city || '',
        orders: byUser.get(String(u._id))?.orders || 0,
        spent: byUser.get(String(u._id))?.spent || 0,
        lastOrder: byUser.get(String(u._id))?.last || null,
      })),
    });
  }),
);

// ───────── Newsletter subscribers ─────────
router.get(
  '/subscribers',
  asyncHandler(async (_req, res) => {
    res.json({ subscribers: await Subscriber.find({}, { email: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean() });
  }),
);

router.get(
  '/subscribers.csv',
  asyncHandler(async (_req, res) => {
    const list = await Subscriber.find({}, { email: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rk-fashions-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(['Email,Subscribed', ...list.map((s) => `"${s.email}",${new Date(s.createdAt).toISOString().slice(0, 10)}`)].join('\n'));
  }),
);

router.delete(
  '/subscribers/:id',
  asyncHandler(async (req, res) => {
    await Subscriber.deleteOne({ _id: req.params.id });
    res.json({ deleted: true });
  }),
);

// ───────── Studio hours & site content ─────────
router.get('/studio-hours', asyncHandler(async (_req, res) => res.json({ hours: await getStudioHours() })));
router.put('/studio-hours', asyncHandler(async (req, res) => res.json({ hours: await saveStudioHours(req.body) })));

router.get('/content', asyncHandler(async (_req, res) => res.json({ content: await getContent() })));
router.put('/content', asyncHandler(async (req, res) => res.json({ content: await saveContent(req.body?.content) })));

export default router;
