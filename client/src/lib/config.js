// Where the backend lives. Leave VITE_API_URL empty when the API serves this
// site (the default Render setup, and local dev through the Vite proxy). Set it
// when the frontend is hosted separately, e.g. on Vercel or Netlify.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/** Absolute URL for an API path such as `/api/products`. */
export const apiUrl = (path) => `${API_BASE}${path}`;

/** Uploaded files (`/uploads/...`) are served by the API, not the frontend host. */
export const assetUrl = (src) => (src && src.startsWith('/uploads/') ? `${API_BASE}${src}` : src);
