import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { env, isCloudinaryConfigured } from '../config/env.js';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export const UPLOAD_DIR = path.resolve('uploads');

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic' };

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) =>
    IMAGE_TYPES[file.mimetype] ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP or HEIC images are allowed.')),
});

/** Stores an uploaded image in Cloudinary when configured, otherwise on local disk. */
export async function storeImage(file, folder) {
  if (isCloudinaryConfigured) {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `rk-fashions/${folder}`, resource_type: 'image' }, (err, res) =>
          err ? reject(err) : resolve(res),
        )
        .end(file.buffer);
    });
    return { url: result.secure_url, name: file.originalname };
  }
  const filename = `${folder}-${crypto.randomUUID()}${IMAGE_TYPES[file.mimetype]}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return { url: `/uploads/${filename}`, name: file.originalname };
}
