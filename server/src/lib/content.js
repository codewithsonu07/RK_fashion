import { getSetting, putSetting } from '../models/Setting.js';
import { HttpError } from './http.js';

// Site content edited in the admin dashboard is stored as overrides on top of
// the defaults in client/src/data/site.js. Only these top-level keys are accepted.
const KEYS = ['brand', 'announcement', 'home', 'testimonials', 'instagramGallery', 'collections', 'categories', 'about', 'infoPages'];
const MAX_BYTES = 200_000;

export const getContent = () => getSetting('siteContent', {});

export async function saveContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(422, 'Invalid content.');
  const content = Object.fromEntries(Object.entries(input).filter(([k]) => KEYS.includes(k)));
  if (JSON.stringify(content).length > MAX_BYTES) throw new HttpError(413, 'Content is too large.');

  if (content.collections) {
    if (!Array.isArray(content.collections)) throw new HttpError(422, 'Collections must be a list.');
    const slugs = new Set();
    for (const c of content.collections) {
      if (!c?.slug || !/^[a-z0-9-]+$/.test(c.slug) || !c.title) throw new HttpError(422, 'Each collection needs a title and a lowercase slug.');
      if (slugs.has(c.slug)) throw new HttpError(422, `Duplicate collection slug: ${c.slug}`);
      slugs.add(c.slug);
    }
  }
  if (content.categories) {
    for (const g of ['women', 'men']) {
      const list = content.categories[g];
      if (!Array.isArray(list)) throw new HttpError(422, 'Categories must be lists for women and men.');
      for (const c of list) if (!c?.slug || !/^[a-z0-9-]+$/.test(c.slug) || !c.label) throw new HttpError(422, 'Each category needs a label and a lowercase slug.');
    }
  }
  return putSetting('siteContent', content);
}
