// Integration tests against a throwaway MongoDB database.
// Run with `npm test` (needs MongoDB running locally, or TEST_MONGODB_URI).
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/rk-fashions-test';
process.env.ADMIN_TOKEN = 'test-admin-token';
process.env.JWT_SECRET = 'test-secret';
process.env.COD_ENABLED = 'true';
process.env.RAZORPAY_KEY_ID = '';
process.env.RAZORPAY_KEY_SECRET = '';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret';

const mongoose = (await import('mongoose')).default;
const { app } = await import('../src/app.js');
const { connectDb } = await import('../src/config/db.js');
const { seedProducts } = await import('../src/seed.js');
const { Product } = await import('../src/models/Product.js');
const { User } = await import('../src/models/User.js');
const { Order } = await import('../src/models/Order.js');
const { cancelStaleUnpaidOrders } = await import('../src/lib/orders.js');
const crypto = await import('node:crypto');

let server;
let base;

/** Minimal client that keeps a session cookie. */
function client() {
  let cookie = '';
  return async (path, { method = 'GET', body, headers = {} } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
}

const futureWeekday = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  while (d.getDay() === 1) d.setDate(d.getDate() + 1); // studio closed on Mondays
  return d.toISOString().slice(0, 10);
};

const address = { fullName: 'Test Buyer', phone: '+91 98765 43210', line1: '1 Mall Road', city: 'Ludhiana', state: 'Punjab', pincode: '141001' };

before(async () => {
  await connectDb();
  await mongoose.connection.db.dropDatabase();
  await seedProducts();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe('catalogue', () => {
  test('lists published products', async () => {
    const { status, body } = await client()('/products');
    assert.equal(status, 200);
    assert.ok(body.products.length > 40);
  });
});

describe('accounts', () => {
  test('register, read session, reject duplicates and wrong passwords', async () => {
    const c = client();
    const reg = await c('/auth/register', { method: 'POST', body: { name: 'Asha', email: 'asha@example.com', password: 'secret123' } });
    assert.equal(reg.status, 201);
    assert.equal(reg.body.user.role, 'customer');
    assert.equal((await c('/auth/me')).body.user.email, 'asha@example.com');
    assert.equal((await client()('/auth/register', { method: 'POST', body: { name: 'X', email: 'asha@example.com', password: 'secret123' } })).status, 409);
    assert.equal((await client()('/auth/login', { method: 'POST', body: { email: 'asha@example.com', password: 'wrong999' } })).status, 401);
  });

  test('weak passwords are rejected', async () => {
    const r = await client()('/auth/register', { method: 'POST', body: { name: 'B', email: 'b@example.com', password: 'short' } });
    assert.equal(r.status, 422);
  });
});

describe('appointments', () => {
  test('a slot cannot be booked twice', async () => {
    const date = futureWeekday();
    const body = { name: 'A', email: 'a@example.com', phone: '+91 90000 00000', gender: 'women', type: 'bridal', date, time: '12:00' };
    assert.equal((await client()('/appointments', { method: 'POST', body })).status, 201);
    const second = await client()('/appointments', { method: 'POST', body: { ...body, email: 'b@example.com' } });
    assert.equal(second.status, 409);
    const slots = await client()(`/appointments/slots?date=${date}`);
    assert.equal(slots.body.slots.find((s) => s.time === '12:00').available, false);
  });
});

describe('checkout', () => {
  test('uses database prices, reduces stock and refuses to oversell', async () => {
    const c = client();
    await c('/auth/register', { method: 'POST', body: { name: 'Buyer', email: 'buyer@example.com', password: 'secret123' } });
    const before = await Product.findOne({ slug: 'slate-linen-kurta' }).lean();

    // The client tries to send its own price — the server must ignore it.
    const order = await c('/orders', {
      method: 'POST',
      body: { paymentMethod: 'cod', address, items: [{ slug: 'slate-linen-kurta', size: 'M', qty: 2, price: 1 }] },
    });
    assert.equal(order.status, 201);
    assert.equal(order.body.order.total, before.price * 2);
    assert.equal(order.body.order.status, 'placed');
    assert.equal((await Product.findOne({ slug: 'slate-linen-kurta' }).lean()).stock, before.stock - 2);

    await Product.updateOne({ slug: 'slate-linen-kurta' }, { stock: 1 });
    const oversell = await c('/orders', { method: 'POST', body: { paymentMethod: 'cod', address, items: [{ slug: 'slate-linen-kurta', size: 'M', qty: 3 }] } });
    assert.equal(oversell.status, 409);
  });

  test('online payment is refused when Razorpay is not configured', async () => {
    const c = client();
    await c('/auth/register', { method: 'POST', body: { name: 'C', email: 'c@example.com', password: 'secret123' } });
    const r = await c('/orders', { method: 'POST', body: { paymentMethod: 'razorpay', address, items: [{ slug: 'royal-blue-kurta-set', size: 'M', qty: 1 }] } });
    assert.equal(r.status, 503);
  });

  test('orders are tracked by number and email only', async () => {
    const c = client();
    await c('/auth/register', { method: 'POST', body: { name: 'D', email: 'd@example.com', password: 'secret123' } });
    const { body } = await c('/orders', { method: 'POST', body: { paymentMethod: 'cod', address, items: [{ slug: 'royal-blue-kurta-set', size: 'M', qty: 1 }] } });
    const n = body.order.orderNumber;
    assert.equal((await client()('/orders/track', { method: 'POST', body: { orderNumber: n, email: 'd@example.com' } })).status, 200);
    assert.equal((await client()('/orders/track', { method: 'POST', body: { orderNumber: n, email: 'someone@else.com' } })).status, 404);
  });
});

describe('admin', () => {
  test('customers cannot reach admin APIs; admins can', async () => {
    const customer = client();
    await customer('/auth/register', { method: 'POST', body: { name: 'E', email: 'e@example.com', password: 'secret123' } });
    assert.equal((await customer('/admin/stats')).status, 403);
    assert.equal((await client()('/admin/stats')).status, 401);

    await User.updateOne({ email: 'e@example.com' }, { role: 'admin' });
    const stats = await customer('/admin/stats');
    assert.equal(stats.status, 200);
    assert.ok(stats.body.orders >= 2);
    assert.equal((await client()('/admin/stats', { headers: { Authorization: 'Bearer test-admin-token' } })).status, 200);
  });

  test('create, edit and delete a product', async () => {
    const a = client();
    await a('/auth/register', { method: 'POST', body: { name: 'F', email: 'f@example.com', password: 'secret123' } });
    await User.updateOne({ email: 'f@example.com' }, { role: 'admin' });
    const bad = await a('/admin/products', { method: 'POST', body: { name: '' } });
    assert.equal(bad.status, 422);
    const created = await a('/admin/products', {
      method: 'POST',
      body: { name: 'Test Sharara', gender: 'women', category: 'skirt-sets', price: 25000, stock: 3, sizes: ['S', 'M'], images: ['https://images.unsplash.com/photo-1'] },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.product.slug, 'test-sharara');
    const id = created.body.product._id;
    assert.equal((await a(`/admin/products/${id}`, { method: 'PUT', body: { price: 27000 } })).body.product.price, 27000);
    assert.equal((await a(`/admin/products/${id}`, { method: 'DELETE' })).body.deleted, true);
  });

  test('studio hours and site content are saved', async () => {
    const auth = { headers: { Authorization: 'Bearer test-admin-token' } };
    const hours = await client()('/admin/studio-hours', { method: 'PUT', body: { slotTimes: ['10:00', '11:00'], closedWeekdays: [0], closedDates: [], bookingWindowDays: 30 }, ...auth });
    assert.deepEqual(hours.body.hours.slotTimes, ['10:00', '11:00']);
    const saved = await client()('/admin/content', { method: 'PUT', body: { content: { announcement: 'Festive preview', unknownKey: 1 } }, ...auth });
    assert.equal(saved.status, 200);
    const pub = await client()('/content');
    assert.equal(pub.body.content.announcement, 'Festive preview');
    assert.equal(pub.body.content.unknownKey, undefined);
  });
});

describe('payments', () => {
  async function pendingOrder(email) {
    const user = await User.create({ name: 'Pay', email, passwordHash: 'x' });
    const p = await Product.findOne({ slug: 'nimbu-silk-kurta' }).lean();
    return Order.create({
      orderNumber: `RKO-TEST-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      user: user._id,
      email,
      items: [{ slug: p.slug, name: p.name, image: p.images[0], size: 'M', colour: '', qty: 1, price: p.price }],
      shippingAddress: address,
      subtotal: p.price,
      shippingFee: 0,
      total: p.price,
      status: 'pending_payment',
      payment: { method: 'razorpay', razorpayOrderId: `order_${Math.random().toString(36).slice(2, 10)}` },
    });
  }
  const webhook = (bodyObj, secret = 'test-webhook-secret') => {
    const raw = JSON.stringify(bodyObj);
    const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return fetch(`${base}/payments/razorpay/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': sig }, body: raw });
  };

  test('a signed payment.captured webhook confirms the order once and reduces stock once', async () => {
    const order = await pendingOrder('pay1@example.com');
    const stockBefore = (await Product.findOne({ slug: 'nimbu-silk-kurta' }).lean()).stock;
    const event = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123', order_id: order.payment.razorpayOrderId, amount: order.total * 100 } } } };
    assert.equal((await webhook(event)).status, 200);
    assert.equal((await webhook(event)).status, 200); // Razorpay retries — must stay idempotent
    const after = await Order.findById(order._id).lean();
    assert.equal(after.status, 'placed');
    assert.equal(after.payment.status, 'paid');
    assert.equal((await Product.findOne({ slug: 'nimbu-silk-kurta' }).lean()).stock, stockBefore - 1);
  });

  test('forged signatures and wrong amounts are ignored', async () => {
    const order = await pendingOrder('pay2@example.com');
    const ok = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_x', order_id: order.payment.razorpayOrderId, amount: order.total * 100 } } } };
    assert.equal((await webhook(ok, 'wrong-secret')).status, 400);
    const short = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_y', order_id: order.payment.razorpayOrderId, amount: 100 } } } };
    assert.equal((await webhook(short)).status, 200);
    assert.equal((await Order.findById(order._id).lean()).status, 'pending_payment');
  });

  test('unpaid online orders are cancelled after 24 hours', async () => {
    const order = await pendingOrder('pay3@example.com');
    await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt: new Date(Date.now() - 25 * 3600 * 1000) } });
    assert.ok((await cancelStaleUnpaidOrders()) >= 1);
    assert.equal((await Order.findById(order._id).lean()).status, 'cancelled');
  });
});

describe('newsletter', () => {
  test('subscribes once and exports to admins', async () => {
    assert.equal((await client()('/newsletter', { method: 'POST', body: { email: 'News@Example.com' } })).status, 201);
    assert.equal((await client()('/newsletter', { method: 'POST', body: { email: 'news@example.com' } })).status, 201);
    const list = await client()('/admin/subscribers', { headers: { Authorization: 'Bearer test-admin-token' } });
    assert.equal(list.body.subscribers.filter((s) => s.email === 'news@example.com').length, 1);
  });
});
