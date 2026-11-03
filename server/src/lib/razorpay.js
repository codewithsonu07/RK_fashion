import crypto from 'node:crypto';
import { env, isRazorpayConfigured } from '../config/env.js';
import { HttpError } from './http.js';

/** Creates a Razorpay order via the REST API. Amount in rupees. */
export async function createRazorpayOrder({ amount, receipt }) {
  if (!isRazorpayConfigured) throw new HttpError(503, 'Online payments are not configured yet.');
  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[razorpay] order create failed:', data?.error?.description || res.status);
    throw new HttpError(502, 'The payment gateway could not start the payment. Please try again.');
  }
  return data;
}

/** Verifies the checkout signature Razorpay returns to the browser. */
export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verifies a webhook body (raw bytes) against the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret || !signature || !rawBody) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
