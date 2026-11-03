import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError } from './http.js';

const COOKIE = 'rk_session';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// In development a random secret is generated when JWT_SECRET is missing —
// sessions then reset whenever the server restarts.
const secret =
  env.jwtSecret ||
  (() => {
    if (env.isProduction) throw new Error('JWT_SECRET must be set in production.');
    console.warn('[auth] JWT_SECRET not set — using a temporary secret (sessions reset on restart).');
    return crypto.randomBytes(32).toString('hex');
  })();

export function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id) }, secret, { expiresIn: '30d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.isProduction || env.cookieSameSite === 'none', // browsers require Secure with SameSite=None
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/', sameSite: env.cookieSameSite, secure: env.isProduction || env.cookieSameSite === 'none' });
}

/** Attaches req.user when a valid session cookie is present. Never fails the request. */
export async function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return next();
  try {
    const { sub } = jwt.verify(token, secret);
    req.user = await User.findById(sub);
  } catch {
    /* invalid or expired token — treat as signed out */
  }
  next();
}

export function requireUser(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue.'));
  next();
}

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
