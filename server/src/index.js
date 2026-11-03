import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { Product } from './models/Product.js';
import { seedProducts } from './seed.js';
import { cancelStaleUnpaidOrders } from './lib/orders.js';

await connectDb();
if ((await Product.estimatedDocumentCount()) === 0) await seedProducts();

// Tidy up abandoned online-payment orders every hour.
const sweep = () => cancelStaleUnpaidOrders().catch((err) => console.error('[orders] cleanup failed:', err.message));
sweep();
setInterval(sweep, 60 * 60 * 1000).unref();

app.listen(env.port, () => console.log(`[api] RK FASHIONS API on http://localhost:${env.port}`));
