import crypto from 'node:crypto';

// Human-friendly references, e.g. RKB-2611-7K3QD (bespoke) or RKA-2611-M2X9P (appointment).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeReference(prefix) {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const bytes = crypto.randomBytes(5);
  const tail = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${prefix}-${yymm}-${tail}`;
}
