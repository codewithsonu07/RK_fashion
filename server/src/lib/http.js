import { env } from '../config/env.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-\s\d]{8,20}$/;

export const clean = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Collects field errors; throws a 422 if any. */
export function validate(rules) {
  const errors = {};
  for (const [field, { value, required, email, phone, oneOf }] of Object.entries(rules)) {
    if (required && !value) errors[field] = 'This field is required.';
    else if (value && email && !EMAIL_RE.test(value)) errors[field] = 'Enter a valid email address.';
    else if (value && phone && !PHONE_RE.test(value)) errors[field] = 'Enter a valid phone number.';
    else if (value && oneOf && !oneOf.includes(value)) errors[field] = 'Choose a valid option.';
  }
  if (Object.keys(errors).length) throw new HttpError(422, 'Please check the highlighted fields.', errors);
}

/**
 * Admin routes: allowed for a signed-in user with role `admin` (the dashboard),
 * or a server-to-server call with `Authorization: Bearer <ADMIN_TOKEN>`.
 */
export function requireAdmin(req, _res, next) {
  if (req.user?.role === 'admin') return next();
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (env.adminToken && token === env.adminToken) return next();
  next(new HttpError(req.user ? 403 : 401, 'Admin access required.'));
}
