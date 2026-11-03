import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { asyncHandler, clean, validate, requireAdmin, HttpError } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { makeReference } from '../lib/refs.js';
import { sendMail } from '../lib/mailer.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../lib/razorpay.js';
import { env, isRazorpayConfigured } from '../config/env.js';
import { cleanAddress } from './auth.js';
import { commitStock, confirmationEmail, markPaid, notifyStudioOfOrder } from '../lib/orders.js';

const router = Router();
const checkoutLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const STATUS_LABELS = {
  pending_payment: 'Awaiting payment',
  placed: 'Order placed',
  processing: 'Being prepared in the atelier',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const publicOrder = (o) => ({
  orderNumber: o.orderNumber,
  email: o.email,
  items: o.items,
  shippingAddress: o.shippingAddress,
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  total: o.total,
  status: o.status,
  statusLabel: STATUS_LABELS[o.status],
  payment: { method: o.payment?.method, status: o.payment?.status, paidAt: o.payment?.paidAt },
  tracking: o.tracking,
  timeline: o.timeline,
  createdAt: o.createdAt,
});

// GET /api/orders/options — which payment methods are live.
router.get('/options', (_req, res) => {
  res.json({
    methods: { razorpay: isRazorpayConfigured, cod: env.codEnabled },
    razorpayKeyId: isRazorpayConfigured ? env.razorpay.keyId : null,
    shippingFee: env.shippingFee,
  });
});

// POST /api/orders — creates an order from the bag. Prices and stock come from the database.
router.post(
  '/',
  requireUser,
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const method = clean(req.body?.paymentMethod, 10);
    validate({ paymentMethod: { value: method, required: true, oneOf: ['razorpay', 'cod'] } });
    if (method === 'razorpay' && !isRazorpayConfigured) throw new HttpError(503, 'Online payment is not available yet.');
    if (method === 'cod' && !env.codEnabled) throw new HttpError(503, 'Cash on delivery is not available.');

    const address = cleanAddress(req.body?.address);
    const requested = (Array.isArray(req.body?.items) ? req.body.items : []).slice(0, 50);
    if (!requested.length) throw new HttpError(422, 'Your bag is empty.');

    const products = await Product.find({ slug: { $in: requested.map((i) => clean(i.slug, 120)) }, published: true }).lean();
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const items = requested.map((i) => {
      const p = bySlug.get(clean(i.slug, 120));
      const size = clean(i.size, 10);
      const qty = Math.max(1, Math.min(5, Number(i.qty) || 1));
      if (!p) throw new HttpError(409, 'An item in your bag is no longer available. Please review your bag.');
      if (!p.sizes.includes(size)) throw new HttpError(409, `Size ${size} is not available for ${p.name}.`);
      if (p.stock < qty) throw new HttpError(409, p.stock ? `Only ${p.stock} of ${p.name} left in stock.` : `${p.name} is sold out.`);
      const colour = p.colours?.some((c) => c.name === i.colour) ? i.colour : p.colours?.[0]?.name || '';
      return { slug: p.slug, name: p.name, image: p.images[0], size, colour, qty, price: p.price };
    });

    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const order = new Order({
      orderNumber: makeReference('RKO'),
      user: req.user._id,
      email: req.user.email,
      items,
      shippingAddress: address,
      subtotal,
      shippingFee: env.shippingFee,
      total: subtotal + env.shippingFee,
      payment: { method },
    });

    if (method === 'cod') {
      await commitStock(order);
      order.status = 'placed';
      order.payment.status = 'cod_due';
      order.timeline.push({ status: 'placed', note: 'Order placed — cash on delivery.' });
      await order.save();
      req.user.bag = [];
      if (req.body?.saveAddress) req.user.address = address;
      await req.user.save();
      const emailed = await confirmationEmail(order, req.user.name);
      notifyStudioOfOrder(order, req.user.name);
      return res.status(201).json({ order: publicOrder(order), emailed });
    }

    const rzp = await createRazorpayOrder({ amount: order.total, receipt: order.orderNumber });
    order.payment.razorpayOrderId = rzp.id;
    order.timeline.push({ status: 'pending_payment', note: 'Awaiting online payment.' });
    await order.save();
    if (req.body?.saveAddress) {
      req.user.address = address;
      await req.user.save();
    }
    res.status(201).json({
      order: publicOrder(order),
      razorpay: { keyId: env.razorpay.keyId, orderId: rzp.id, amount: rzp.amount, currency: rzp.currency },
    });
  }),
);

// POST /api/orders/:number/pay — restart payment for an unpaid order.
router.post(
  '/:number/pay',
  requireUser,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.number, user: req.user._id });
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status !== 'pending_payment') throw new HttpError(409, 'This order does not need payment.');
    if (!order.payment.razorpayOrderId) {
      const rzp = await createRazorpayOrder({ amount: order.total, receipt: order.orderNumber });
      order.payment.razorpayOrderId = rzp.id;
      await order.save();
    }
    res.json({
      order: publicOrder(order),
      razorpay: { keyId: env.razorpay.keyId, orderId: order.payment.razorpayOrderId, amount: order.total * 100, currency: 'INR' },
    });
  }),
);

// POST /api/orders/:number/verify — confirms payment only after the signature checks out.
router.post(
  '/:number/verify',
  requireUser,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.number, user: req.user._id });
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.payment.status === 'paid') return res.json({ order: publicOrder(order) });

    const ok =
      req.body?.razorpay_order_id === order.payment.razorpayOrderId &&
      verifyRazorpaySignature({
        orderId: order.payment.razorpayOrderId,
        paymentId: req.body?.razorpay_payment_id,
        signature: req.body?.razorpay_signature,
      });
    if (!ok) {
      order.timeline.push({ status: 'pending_payment', note: 'Payment verification failed.' });
      await order.save();
      throw new HttpError(400, 'We could not verify this payment. If money was deducted, it will be refunded by your bank — please contact us with your order number.');
    }

    const emailed = await markPaid(order, clean(req.body.razorpay_payment_id, 60), 'checkout');
    res.json({ order: publicOrder(await Order.findById(order._id).lean()), emailed });
  }),
);

// GET /api/orders — the signed-in customer's order history.
router.get(
  '/',
  requireUser,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ orders: orders.map(publicOrder) });
  }),
);

router.get(
  '/mine/:number',
  requireUser,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.number, user: req.user._id }).lean();
    if (!order) throw new HttpError(404, 'Order not found.');
    res.json({ order: publicOrder(order) });
  }),
);

// POST /api/orders/track — public tracking by order number + email.
router.post(
  '/track',
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const orderNumber = clean(req.body?.orderNumber, 30).toUpperCase();
    const email = clean(req.body?.email, 160).toLowerCase();
    validate({ orderNumber: { value: orderNumber, required: true }, email: { value: email, required: true, email: true } });
    const order = await Order.findOne({ orderNumber, email }).lean();
    if (!order) throw new HttpError(404, 'We could not find an order with that number and email.');
    const { shippingAddress, ...rest } = publicOrder(order);
    res.json({ order: { ...rest, shippingAddress: { city: shippingAddress?.city, state: shippingAddress?.state } } });
  }),
);

// ── Admin: list orders and update status / tracking ──
router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json({ orders: await Order.find(filter).sort({ createdAt: -1 }).lean() });
  }),
);

router.patch(
  '/admin/:number',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.number });
    if (!order) throw new HttpError(404, 'Order not found.');
    const { status, note, tracking } = req.body || {};
    if (status) {
      if (!ORDER_STATUSES.includes(status)) throw new HttpError(422, 'Invalid status.');
      order.status = status;
      order.timeline.push({ status, note: clean(note, 300) || STATUS_LABELS[status] });
      if (status === 'delivered' && order.payment.method === 'cod') order.payment.status = 'paid';
    }
    if (tracking) order.tracking = { carrier: clean(tracking.carrier, 60), number: clean(tracking.number, 60), url: clean(tracking.url, 300) };
    await order.save();
    if (status === 'shipped')
      await sendMail({
        to: order.email,
        subject: `RK FASHIONS — Order ${order.orderNumber} has shipped`,
        text: `Your order ${order.orderNumber} is on its way.${order.tracking?.number ? `\n${order.tracking.carrier} tracking number: ${order.tracking.number}` : ''}\n\nTrack it at ${env.clientUrl}/track\n\nRK FASHIONS`,
      });
    res.json({ order: publicOrder(order) });
  }),
);

export default router;
