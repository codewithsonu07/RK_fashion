import { apiUrl } from './config';

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(apiUrl(`/api${path}`), { credentials: 'include', ...options });
  } catch {
    throw new ApiError('We could not reach the RK FASHIONS server. Please check your connection and try again.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data.fields);
  return data;
}

export const api = {
  products: () => request('/products'),
  product: (slug) => request(`/products/${encodeURIComponent(slug)}`),
  appointmentConfig: () => request('/appointments/config'),
  slots: (date) => request(`/appointments/slots?date=${encodeURIComponent(date)}`),
  bookAppointment: (body) =>
    request('/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  submitEnquiry: (formData) => request('/enquiries', { method: 'POST', body: formData }),
  // Auth & account
  me: () => request('/auth/me'),
  register: (body) => request('/auth/register', json('POST', body)),
  login: (body) => request('/auth/login', json('POST', body)),
  logout: () => request('/auth/logout', json('POST')),
  updateProfile: (body) => request('/auth/me', json('PATCH', body)),
  changePassword: (body) => request('/auth/change-password', json('POST', body)),
  forgotPassword: (email) => request('/auth/forgot', json('POST', { email })),
  resetPassword: (body) => request('/auth/reset', json('POST', body)),
  saveWishlist: (wishlist) => request('/account/wishlist', json('PUT', { wishlist })),
  saveBag: (bag) => request('/account/bag', json('PUT', { bag })),
  activity: () => request('/account/activity'),
  // Orders
  checkoutOptions: () => request('/orders/options'),
  createOrder: (body) => request('/orders', json('POST', body)),
  retryPayment: (number) => request(`/orders/${encodeURIComponent(number)}/pay`, json('POST')),
  verifyPayment: (number, body) => request(`/orders/${encodeURIComponent(number)}/verify`, json('POST', body)),
  myOrders: () => request('/orders'),
  myOrder: (number) => request(`/orders/mine/${encodeURIComponent(number)}`),
  trackOrder: (body) => request('/orders/track', json('POST', body)),
  subscribe: (email) =>
    request('/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }),
};
