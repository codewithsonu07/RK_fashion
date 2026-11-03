import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { Product } from './models/Product.js';
import { products } from './data/products.js';

/** Upserts the seed catalogue (safe to re-run; does not delete admin-created products). */
export async function seedProducts() {
  const ops = products.map((p) => ({ updateOne: { filter: { slug: p.slug }, update: { $set: p }, upsert: true } }));
  const res = await Product.bulkWrite(ops);
  console.log(`[seed] products upserted: ${res.upsertedCount} new, ${res.modifiedCount} updated`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDb } = await import('./config/db.js');
  await connectDb();
  await seedProducts();
  await mongoose.disconnect();
}
