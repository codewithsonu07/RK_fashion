import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 5050,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rk-fashions',
  // CLIENT_URL may list several origins separated by commas (e.g. the custom
  // domain plus a Vercel preview URL). The first one is used in email links.
  clientOrigins: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean),
  get clientUrl() {
    return this.clientOrigins[0];
  },
  // 'lax' when the API serves the site (same domain). Use 'none' when the
  // frontend is on a different domain, so sign-in cookies are sent cross-site.
  cookieSameSite: ['lax', 'strict', 'none'].includes(process.env.COOKIE_SAMESITE) ? process.env.COOKIE_SAMESITE : 'lax',
  adminToken: process.env.ADMIN_TOKEN || '',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || '',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  // Cash on delivery is a business decision — off unless explicitly enabled.
  codEnabled: process.env.COD_ENABLED === 'true',
  shippingFee: Number(process.env.SHIPPING_FEE) || 0,
  studioEmail: process.env.STUDIO_EMAIL || '',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'RK FASHIONS <no-reply@rkfashions.in>',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);
export const isMailConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

export const isRazorpayConfigured = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
