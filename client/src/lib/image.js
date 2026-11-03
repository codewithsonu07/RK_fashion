import { assetUrl } from './config';

// Builds responsive image URLs. Unsplash and Cloudinary URLs are resized on the
// CDN; any other URL (e.g. local uploads) is returned unchanged.
export function img(src, width = 800, height) {
  if (!src) return '';
  if (src.includes('images.unsplash.com')) {
    const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: String(width), q: '80' });
    if (height) params.set('h', String(height));
    return `${src}?${params}`;
  }
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    return src.replace('/upload/', `/upload/f_auto,q_auto,c_fill,w_${width}${height ? `,h_${height}` : ''}/`);
  }
  return assetUrl(src);
}

export const srcSet = (src, widths = [400, 700, 1000, 1400]) =>
  src && (src.includes('images.unsplash.com') || src.includes('res.cloudinary.com'))
    ? widths.map((w) => `${img(src, w)} ${w}w`).join(', ')
    : undefined;
