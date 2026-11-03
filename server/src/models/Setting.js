import mongoose from 'mongoose';

// Small key/value store for studio settings managed from the admin dashboard
// (e.g. `studioHours`, `siteContent`).
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

export const Setting = mongoose.model('Setting', settingSchema);

export async function getSetting(key, fallback) {
  const doc = await Setting.findOne({ key }).lean();
  return doc ? doc.value : fallback;
}

export async function putSetting(key, value) {
  await Setting.updateOne({ key }, { $set: { value } }, { upsert: true });
  return value;
}
