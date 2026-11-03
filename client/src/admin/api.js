import { ApiError } from '../lib/api';
import { apiUrl } from '../lib/config';

async function call(path, { method = 'GET', body, form } = {}) {
  let res;
  try {
    res = await fetch(apiUrl(path), {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Could not reach the server.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.', res.status, data.fields);
  return data;
}

export const admin = {
  stats: (days = 30) => call(`/api/admin/stats?days=${days}`),
  products: () => call('/api/admin/products'),
  createProduct: (body) => call('/api/admin/products', { method: 'POST', body }),
  updateProduct: (id, body) => call(`/api/admin/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id) => call(`/api/admin/products/${id}`, { method: 'DELETE' }),
  upload: (files) => {
    const form = new FormData();
    [...files].forEach((f) => form.append('images', f));
    return call('/api/admin/uploads', { method: 'POST', form });
  },
  customers: () => call('/api/admin/customers'),
  subscribers: () => call('/api/admin/subscribers'),
  deleteSubscriber: (id) => call(`/api/admin/subscribers/${id}`, { method: 'DELETE' }),
  orders: () => call('/api/orders/admin/all'),
  updateOrder: (number, body) => call(`/api/orders/admin/${encodeURIComponent(number)}`, { method: 'PATCH', body }),
  enquiries: () => call('/api/enquiries'),
  updateEnquiry: (id, body) => call(`/api/enquiries/${id}`, { method: 'PATCH', body }),
  appointments: () => call('/api/appointments'),
  updateAppointment: (id, body) => call(`/api/appointments/${id}`, { method: 'PATCH', body }),
  studioHours: () => call('/api/admin/studio-hours'),
  saveStudioHours: (body) => call('/api/admin/studio-hours', { method: 'PUT', body }),
  content: () => call('/api/admin/content'),
  saveContent: (content) => call('/api/admin/content', { method: 'PUT', body: { content } }),
};
