import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { UPLOAD_DIR } from './lib/storage.js';
import products from './routes/products.js';
import enquiries from './routes/enquiries.js';
import appointments from './routes/appointments.js';
import newsletter from './routes/newsletter.js';
import auth from './routes/auth.js';
import account from './routes/account.js';
import orders from './routes/orders.js';
import admin from './routes/admin.js';
import payments from './routes/payments.js';
import { getContent } from './lib/content.js';
import { asyncHandler, HttpError } from './lib/http.js';
import { loadUser } from './lib/auth.js';
import { Product } from './models/Product.js';

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
        'script-src': ["'self'", 'https://checkout.razorpay.com'],
        'frame-src': ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
        'connect-src': ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);
app.set('trust proxy', 1);
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use('/api/payments', payments); // raw body for webhook signatures — must come before express.json()
app.use(express.json({ limit: '300kb' }));
app.use(cookieParser());
app.use(loadUser);
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/products', products);
app.use('/api/enquiries', enquiries);
app.use('/api/appointments', appointments);
app.use('/api/newsletter', newsletter);
app.use('/api/auth', auth);
app.use('/api/account', account);
app.use('/api/orders', orders);
app.use('/api/admin', admin);
app.get('/api/content', asyncHandler(async (_req, res) => res.json({ content: await getContent() })));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// ───────── SEO ─────────
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nSitemap: ${env.clientUrl}/sitemap.xml\n`);
});
app.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const products = await Product.find({ published: true }, { slug: 1, updatedAt: 1 }).lean();
    const pages = ['', '/new-arrivals', '/women', '/men', '/collections', '/ready-to-wear', '/bespoke', '/appointment', '/about', '/track'];
    const urls = [
      ...pages.map((p) => `<url><loc>${env.clientUrl}${p}</loc></url>`),
      ...products.map((p) => `<url><loc>${env.clientUrl}/product/${p.slug}</loc><lastmod>${new Date(p.updatedAt).toISOString().slice(0, 10)}</lastmod></url>`),
    ];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
  }),
);

// ───────── Production: serve the built storefront from the same server ─────────
const CLIENT_DIST = path.resolve('../client/dist');
if (env.isProduction && fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1y', immutable: true, setHeaders: (res, file) => file.endsWith('.html') && res.setHeader('Cache-Control', 'no-cache') }));
  const indexHtml = fs.readFileSync(path.join(CLIENT_DIST, 'index.html'), 'utf8');
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Product pages get their own title, description and image in the HTML, so
  // link previews on WhatsApp, Instagram and Facebook (which don't run JavaScript) show the garment.
  const withProductMeta = async (url) => {
    const slug = url.match(/^\/product\/([a-z0-9-]+)\/?$/)?.[1];
    const p = slug && (await Product.findOne({ slug, published: true }, { name: 1, description: 1, images: 1, price: 1 }).lean());
    if (!p) return indexHtml;
    const title = esc(`${p.name} | RK FASHIONS`);
    const desc = esc(`${p.description || ''} ₹${p.price.toLocaleString('en-IN')}`.trim().slice(0, 300));
    const image = esc(p.images[0]?.includes('images.unsplash.com') ? `${p.images[0]}?auto=format&fit=crop&w=1200&q=80` : p.images[0] || '');
    return indexHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`)
      .replace(/(<meta property="og:image" content=")[^"]*/, `$1${image}`)
      .replace(/(<meta property="og:type" content=")[^"]*/, '$1product');
  };

  app.get(
    /^\/(?!api|uploads).*/,
    asyncHandler(async (req, res) => {
      res.set('Cache-Control', 'no-cache').type('html').send(await withProductMeta(req.path));
    }),
  );
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || /images are allowed/.test(err.message)) {
    return res.status(422).json({ error: err.message });
  }
  // HttpErrors carry customer-safe messages (including 502/503); anything else is unexpected.
  const known = err instanceof HttpError;
  const status = known ? err.status : 500;
  if (!known) console.error(err);
  res.status(status).json({
    error: known ? err.message : 'Something went wrong. Please try again.',
    fields: err.details,
  });
});
