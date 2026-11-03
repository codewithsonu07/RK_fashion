import { Router } from 'express';
import { Product } from '../models/Product.js';
import { asyncHandler, HttpError } from '../lib/http.js';

const router = Router();

const SORTS = {
  newest: { publishedAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  bestsellers: { bestSeller: -1, publishedAt: -1 },
};

const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);

// GET /api/products?gender=women&category=lehengas&collection=bridal&q=silk&sort=newest&limit=8
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { gender, q, sort, minPrice, maxPrice, limit } = req.query;
    const filter = { published: true };
    if (gender) filter.gender = gender === 'woman' ? 'women' : gender === 'man' ? 'men' : gender;
    if (list(req.query.category).length) filter.category = { $in: list(req.query.category) };
    if (list(req.query.collection).length) filter.collections = { $in: list(req.query.collection) };
    if (list(req.query.occasion).length) filter.occasions = { $in: list(req.query.occasion) };
    if (list(req.query.colour).length) filter['colours.name'] = { $in: list(req.query.colour) };
    if (list(req.query.size).length) filter.sizes = { $in: list(req.query.size) };
    if (req.query.newArrival === 'true') filter.newArrival = true;
    if (req.query.readyToShip === 'true') filter.readyToShip = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) {
      const qTrim = String(q).trim();
      const rx = new RegExp(qTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 60), 'i');
      const orConditions = [{ name: rx }, { category: rx }, { description: rx }, { 'colours.name': rx }, { fabric: rx }];
      if (/^wom[ae]n?$/i.test(qTrim)) orConditions.push({ gender: 'women' });
      else if (/^m[ae]n$/i.test(qTrim)) orConditions.push({ gender: 'men' });
      filter.$or = orConditions;
    }
    const products = await Product.find(filter)
      .sort(SORTS[sort] || { bestSeller: -1, publishedAt: -1 })
      .limit(Math.min(Number(limit) || 200, 200))
      .lean();
    res.json({ products });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, published: true }).lean();
    if (!product) throw new HttpError(404, 'Product not found.');
    res.json({ product });
  }),
);

export default router;
