import { categories, collectionBySlug } from '../data/site';

export const categoryLabel = (gender, slug) =>
  categories[gender]?.find((c) => c.slug === slug)?.label ??
  slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

/** Products that belong to a gender/category page (garment categories or occasion edits). */
export function inCategory(product, gender, slug) {
  if (gender && product.gender !== gender) return false;
  if (!slug) return true;
  const cat = categories[gender]?.find((c) => c.slug === slug);
  if (cat?.occasion) return product.occasions?.includes(cat.occasion);
  return product.category === slug;
}

export function inCollection(product, slug) {
  const col = collectionBySlug(slug);
  if (!col) return false;
  const { match } = col;
  if (match.collection) return product.collections?.includes(match.collection);
  return Object.entries(match).every(([k, v]) => product[k] === v);
}

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'bestsellers', label: 'Best Sellers' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export function sortProducts(list, sort) {
  const arr = [...list];
  const byDate = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt);
  switch (sort) {
    case 'newest':
      return arr.sort(byDate);
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'bestsellers':
      return arr.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || byDate(a, b));
    default:
      return arr.sort((a, b) => Number(b.newArrival) - Number(a.newArrival) || Number(b.bestSeller) - Number(a.bestSeller) || byDate(a, b));
  }
}

export const PRICE_BANDS = [
  { value: '0-20000', label: 'Under ₹20,000', min: 0, max: 20000 },
  { value: '20000-60000', label: '₹20,000 – ₹60,000', min: 20000, max: 60000 },
  { value: '60000-150000', label: '₹60,000 – ₹1,50,000', min: 60000, max: 150000 },
  { value: '150000-', label: 'Above ₹1,50,000', min: 150000, max: Infinity },
];

export const OCCASION_LABELS = {
  bridal: 'Bridal',
  groom: 'Groom',
  wedding: 'Wedding',
  reception: 'Reception',
  sangeet: 'Sangeet',
  mehendi: 'Mehendi',
  festive: 'Festive',
  casual: 'Casual',
};
