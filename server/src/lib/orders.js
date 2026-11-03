import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { HttpError } from './http.js';
import { sendMail } from './mailer.js';
import { env } from '../config/env.js';

/** Atomically reduces stock for every item; rolls back if any item is short. */
export async function commitStock(order) {
  if (order.stockCommitted) return;
  const done = [];
  for (const item of order.items) {
    const r = await Product.updateOne({ slug: item.slug, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
    if (r.modifiedCount !== 1) {
      await Promise.all(done.map((d) => Product.updateOne({ slug: d.slug }, { $inc: { stock: d.qty } })));
      throw new HttpError(409, `Sorry — ${item.name} has just sold out in the quantity requested.`);
    }
    done.push(item);
  }
  order.stockCommitted = true;
}

export function confirmationEmail(order, name) {
  const lines = order.items.map((i) => `• ${i.name} (${i.size}) × ${i.qty} — ₹${(i.price * i.qty).toLocaleString('en-IN')}`).join('\n');
  const pay = order.payment.method === 'cod' ? 'Payment: cash on delivery.' : 'Payment received — thank you.';
  return sendMail({
    to: order.email,
    subject: `RK FASHIONS — Order ${order.orderNumber} confirmed`,
    text: `Dear ${name},\n\nThank you for your order ${order.orderNumber}.\n\n${lines}\n\nTotal: ₹${order.total.toLocaleString('en-IN')}\n${pay}\n\nTrack your order any time at ${env.clientUrl}/track\n\nRK FASHIONS`,
  });
}

export function notifyStudioOfOrder(order, name) {
  const lines = order.items.map((i) => `• ${i.name} (${i.size}) × ${i.qty}`).join('\n');
  return sendMail({
    to: env.studioEmail,
    subject: `New order ${order.orderNumber} — ₹${order.total.toLocaleString('en-IN')}`,
    text: `${name} (${order.email}) placed order ${order.orderNumber}.\n\n${lines}\n\nPayment: ${order.payment.method === 'cod' ? 'cash on delivery' : 'paid online'}\nShip to: ${order.shippingAddress.city}, ${order.shippingAddress.state}\n\nManage it at ${env.clientUrl}/admin/orders`,
  });
}

/**
 * Confirms a Razorpay payment exactly once — called from the checkout verify
 * step and from the webhook, whichever arrives first. Returns whether the
 * customer confirmation email was sent.
 */
export async function markPaid(order, paymentId, source) {
  // `order` is not modified; re-read it afterwards for the confirmed state.
  // Atomic claim so the checkout and the webhook can't both confirm the same order.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, 'payment.status': { $ne: 'paid' } },
    { $set: { 'payment.status': 'paid', 'payment.razorpayPaymentId': paymentId, 'payment.paidAt': new Date(), status: 'placed' } },
    { new: true },
  );
  if (!claimed) return false;
  claimed.timeline.push({ status: 'placed', note: 'Payment received. Order confirmed.' });
  try {
    await commitStock(claimed);
  } catch (err) {
    // Paid but out of stock: keep the order and flag it for the studio rather than losing the payment.
    claimed.timeline.push({ status: 'placed', note: 'Stock check needed — our team will contact you.' });
    console.error(`[orders] ${claimed.orderNumber} paid but stock short:`, err.message);
  }
  await claimed.save();
  const user = await User.findByIdAndUpdate(claimed.user, { $set: { bag: [] } });
  console.log(`[orders] ${claimed.orderNumber} paid (${source})`);
  const emailed = await confirmationEmail(claimed, user?.name || 'there');
  notifyStudioOfOrder(claimed, user?.name || claimed.email);
  return emailed;
}

/** Cancels online-payment orders that were never paid, so they don't clutter the studio's list. */
export async function cancelStaleUnpaidOrders(maxAgeHours = 24) {
  const cutoff = new Date(Date.now() - maxAgeHours * 3600 * 1000);
  const res = await Order.updateMany(
    { status: 'pending_payment', createdAt: { $lt: cutoff } },
    { $set: { status: 'cancelled', 'payment.status': 'failed' }, $push: { timeline: { status: 'cancelled', note: 'Cancelled automatically — payment was not completed.', at: new Date() } } },
  );
  if (res.modifiedCount) console.log(`[orders] cancelled ${res.modifiedCount} unpaid order(s)`);
  return res.modifiedCount;
}
