import * as site from '../data/site';
import { apiUrl } from './config';

// Content edited in the admin dashboard is stored as overrides in the database.
// Before the first render we fetch it and apply it onto the defaults in
// data/site.js *in place*, so every component that imports those objects sees
// the live content without needing a context. Visitors always get fresh content
// on page load; the admin's "Save" reloads the preview.

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function mergeInto(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (isObj(v) && isObj(target[k])) mergeInto(target[k], v);
    else target[k] = v;
  }
}
const replaceArray = (target, next) => Array.isArray(next) && target.splice(0, target.length, ...next);

export function applyContent(content = {}) {
  if (content.brand) mergeInto(site.brand, content.brand);
  if (typeof content.announcement === 'string' && content.announcement) site.brand.announcement = content.announcement;
  if (content.home) mergeInto(site.home, content.home);
  if (content.about) mergeInto(site.about, content.about);
  if (content.infoPages) mergeInto(site.infoPages, content.infoPages);
  replaceArray(site.testimonials, content.testimonials);
  replaceArray(site.instagramGallery, content.instagramGallery);
  replaceArray(site.collections, content.collections);
  if (content.categories) {
    replaceArray(site.categories.women, content.categories.women);
    replaceArray(site.categories.men, content.categories.men);
  }
  site.buildMegaMenus();
}

/** Loads saved content; never blocks the site for more than `timeoutMs`. */
export async function loadContent(timeoutMs = 2500) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(apiUrl('/api/content'), { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) applyContent((await res.json()).content);
  } catch {
    /* fall back to built-in defaults */
  }
}

/** A snapshot of the current (default + saved) content, used by the admin editor. */
export const currentContent = () =>
  structuredClone({
    brand: site.brand,
    home: site.home,
    about: site.about,
    testimonials: site.testimonials,
    instagramGallery: site.instagramGallery,
    collections: site.collections,
    categories: site.categories,
    infoPages: site.infoPages,
  });
