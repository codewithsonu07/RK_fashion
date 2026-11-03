import { Router } from 'express';
import { Subscriber } from '../models/Subscriber.js';
import { asyncHandler, clean, validate } from '../lib/http.js';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const email = clean(req.body?.email, 160).toLowerCase();
    validate({ email: { value: email, required: true, email: true } });
    await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    res.status(201).json({ subscribed: true });
  }),
);

export default router;
