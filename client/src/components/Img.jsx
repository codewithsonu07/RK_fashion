import { useState } from 'react';
import { img, srcSet } from '../lib/image';

/** Responsive, lazy image that fades in once loaded. Fills its (relative) parent by default. */
export default function Img({ src, alt = '', width = 900, sizes = '100vw', position, eager = false, className = '', fill = true }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) {
    return (
      <div className={`${fill ? 'absolute inset-0' : ''} flex items-center justify-center bg-beige ${className}`}>
        <span className="label-caps text-muted">Image coming soon</span>
      </div>
    );
  }
  return (
    <img
      src={img(src, width)}
      srcSet={srcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      style={position ? { objectPosition: position } : undefined}
      className={`${fill ? 'absolute inset-0 h-full w-full' : ''} object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
