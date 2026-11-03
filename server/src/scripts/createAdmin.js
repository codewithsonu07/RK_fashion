// Creates an admin account, or promotes an existing customer to admin.
// Usage: npm run create-admin -- <email> "<Full Name>"
// The password is read from ADMIN_PASSWORD or prompted for (min 10 characters).
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';

const [email, name = 'RK FASHIONS Admin'] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run create-admin -- <email> "<Full Name>"');
  process.exit(1);
}

await connectDb();
const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
  existing.role = 'admin';
  await existing.save();
  console.log(`✓ ${existing.email} is now an admin (password unchanged).`);
} else {
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question('Choose a password (min 10 characters): ');
    rl.close();
  }
  if (!password || password.length < 10) {
    console.error('Password must be at least 10 characters.');
    process.exit(1);
  }
  await User.create({ email: email.toLowerCase(), name, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
  console.log(`✓ Admin account created for ${email}. Sign in at /account/login, then open /admin.`);
}
await mongoose.disconnect();
