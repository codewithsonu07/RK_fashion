import { useEffect } from 'react';
import { img } from './image';

const SITE = 'RK FASHIONS';
const DEFAULT_TITLE = 'RK FASHIONS — Designer Indian Couture & Bespoke Clothing by Rohit Kumar';
const DEFAULT_DESCRIPTION =
  'RK FASHIONS by Rohit Kumar — premium Indian designer clothing for men and women. Bridal lehengas, sarees, sherwanis, ready-to-wear and bespoke couture. Elegance, designed around you.';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets the page title, description, canonical URL and social-share tags, and
 * optional JSON-LD structured data. The server also writes these into the HTML
 * for product pages, for crawlers that don't run JavaScript.
 */
export function usePageTitle(title, description, { image, type = 'website', jsonLd, noindex = false } = {}) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : DEFAULT_TITLE;
    const desc = (description || DEFAULT_DESCRIPTION).slice(0, 300);
    const url = window.location.origin + window.location.pathname;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex' : 'index,follow');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    if (image) setMeta('property', 'og:image', img(image, 1200));

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    let script = document.getElementById('page-jsonld');
    if (ld) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'page-jsonld';
        document.head.appendChild(script);
      }
      script.textContent = ld;
    } else script?.remove();
  }, [title, description, image, type, ld, noindex]);
}
