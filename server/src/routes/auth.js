import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { asyncHandler, clean, validate, HttpError } from '../lib/http.js';
import { setSession, clearSession, requireUser, hashToken } from '../lib/auth.js';
import { sendMail } from '../lib/mailer.js';
import { env, isMailConfigured } from '../config/env.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

const passwordProblem = (pw) =>
  pw.length < 8 ? 'Use at least 8 characters.' : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? 'Include at least one letter and one number.' : null;

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 160).toLowerCase();
    const phone = clean(req.body?.phone, 20);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    validate({
      name: { value: name, required: true },
      email: { value: email, required: true, email: true },
      phone: { value: phone, phone: true },
      password: { value: password, required: true },
    });
    const problem = passwordProblem(password);
    if (problem) throw new HttpError(422, problem, { password: problem });
    if (await User.exists({ email }))
      throw new HttpError(409, 'An account with this email already exists. Please sign in.', { email: 'Already registered — sign in instead.' });

    const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 12) });
    setSession(res, user);
    res.status(201).json({ user: user.toPublic() });
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = clean(req.body?.email, 160).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    validate({ email: { value: email, required: true, email: true }, password: { value: password, required: true } });
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new HttpError(401, 'The email or password is incorrect.');
    setSession(res, user);
    res.json({ user: user.toPublic() });
  }),
);

router.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? req.user.toPublic() : null });
});

router.patch(
  '/me',
  requireUser,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (b.name !== undefined) {
      const name = clean(b.name, 120);
      validate({ name: { value: name, required: true } });
      req.user.name = name;
    }
    if (b.phone !== undefined) {
      const phone = clean(b.phone, 20);
      validate({ phone: { value: phone, phone: true } });
      req.user.phone = phone;
    }
    if (b.address !== undefined) req.user.address = cleanAddress(b.address, false);
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  }),
);

router.post(
  '/change-password',
  requireUser,
  authLimiter,
  asyncHandler(async (req, res) => {
    const { current = '', next = '' } = req.body || {};
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(String(current), user.passwordHash)))
      throw new HttpError(422, 'Your current password is incorrect.', { current: 'Incorrect password.' });
    const problem = passwordProblem(String(next));
    if (problem) throw new HttpError(422, problem, { next: problem });
    user.passwordHash = await bcrypt.hash(String(next), 12);
    await user.save();
    res.json({ ok: true });
  }),
);

// Password reset needs email. When SMTP isn't configured we say so instead of
// pretending a link was sent.
router.post(
  '/forgot',
  authLimiter,
  asyncHandler(async (req, res) => {
    if (!isMailConfigured)
      throw new HttpError(503, 'Password reset by email is not available yet. Please contact the studio to reset your password.');
    const email = clean(req.body?.email, 160).toLowerCase();
    validate({ email: { value: email, required: true, email: true } });
    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = hashToken(token);
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendMail({
        to: user.email,
        subject: 'RK FASHIONS — Reset your password',
        text: `Dear ${user.name},\n\nUse this link within one hour to choose a new password:\n${env.clientUrl}/account/reset-password?token=${token}\n\nIf you did not request this, you can ignore this email.\n\nRK FASHIONS`,
      });
    }
    // Same response whether or not the account exists.
    res.json({ ok: true });
  }),
);

router.post(
  '/reset',
  authLimiter,
  asyncHandler(async (req, res) => {
    const token = clean(req.body?.token, 100);
    const password = String(req.body?.password || '');
    const problem = passwordProblem(password);
    if (problem) throw new HttpError(422, problem, { password: problem });
    const user = await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } });
    if (!user) throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    setSession(res, user);
    res.json({ user: user.toPublic() });
  }),
);

export function cleanAddress(a = {}, required = true) {
  const addr = {
    fullName: clean(a.fullName, 120),
    phone: clean(a.phone, 20),
    line1: clean(a.line1, 200),
    line2: clean(a.line2, 200),
    city: clean(a.city, 80),
    state: clean(a.state, 80),
    pincode: clean(a.pincode, 6),
    country: 'India',
  };
  if (required || Object.values(addr).some((v) => v && v !== 'India')) {
    validate({
      fullName: { value: addr.fullName, required: true },
      phone: { value: addr.phone, required: true, phone: true },
      line1: { value: addr.line1, required: true },
      city: { value: addr.city, required: true },
      state: { value: addr.state, required: true },
      pincode: { value: addr.pincode, required: true },
    });
    if (!/^[1-9]\d{5}$/.test(addr.pincode)) throw new HttpError(422, 'Enter a valid 6-digit PIN code.', { pincode: 'Enter a valid 6-digit PIN code.' });
  }
  return addr;
}

export default router;
