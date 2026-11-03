import express, { Router } from 'express';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../lib/http.js';
import { verifyWebhookSignature } from '../lib/razorpay.js';
import { markPaid } from '../lib/orders.js';

const router = Router();

// POST /api/payments/razorpay/webhook
// Backup confirmation: if a customer pays but closes the page before the
// checkout's verify step runs, Razorpay's `payment.captured` / `order.paid`
// event still confirms the order. Needs the raw body for the signature check,
// so it is mounted before express.json().
router.post(
  '/razorpay/webhook',
  express.raw({ type: 'application/json', limit: '200kb' }),
  asyncHandler(async (req, res) => {
    if (!verifyWebhookSignature(req.body, req.get('x-razorpay-signature'))) return res.status(400).json({ error: 'Invalid signature.' });

    const event = JSON.parse(req.body.toString('utf8'));
    if (!['payment.captured', 'order.paid'].includes(event.event)) return res.json({ ignored: true });

    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id;
    const order = razorpayOrderId && (await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId }));
    if (!order) return res.json({ ignored: true }); // not one of ours — acknowledge so Razorpay stops retrying

    // Only accept the full amount for this order.
    if (payment && payment.amount !== Math.round(order.total * 100)) {
      console.error(`[webhook] amount mismatch for ${order.orderNumber}: ${payment.amount}`);
      return res.json({ ignored: true });
    }
    await markPaid(order, payment?.id || '', 'webhook');
    res.json({ ok: true });
  }),
);

export default router;
