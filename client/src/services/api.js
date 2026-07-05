const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : import.meta.env.DEV
    ? '/api'
    : 'https://inventry-management-e1cp.onrender.com/api';

function getToken() {
  return localStorage.getItem('ims_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name, email, password) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  requestOtp: (email) => request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  getProfile: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? '?' + query : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  getCategories: () => request('/products/meta/categories'),
  addCategory: (name) => request('/products/meta/categories', { method: 'POST', body: JSON.stringify({ name }) }),

  // Warehouses
  getWarehouses: () => request('/warehouses'),
  getWarehouse: (id) => request(`/warehouses/${id}`),
  createWarehouse: (data) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id, data) => request(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWarehouse: (id) => request(`/warehouses/${id}`, { method: 'DELETE' }),
  addLocation: (whId, name) => request(`/warehouses/${whId}/locations`, { method: 'POST', body: JSON.stringify({ name }) }),
  deleteLocation: (locId) => request(`/warehouses/locations/${locId}`, { method: 'DELETE' }),

  // Receipts
  getReceipts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/receipts${query ? '?' + query : ''}`);
  },
  getReceipt: (id) => request(`/receipts/${id}`),
  createReceipt: (data) => request('/receipts', { method: 'POST', body: JSON.stringify(data) }),
  updateReceipt: (id, data) => request(`/receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  validateReceipt: (id, received_items) => request(`/receipts/${id}/validate`, { method: 'POST', body: JSON.stringify({ received_items }) }),
  deleteReceipt: (id) => request(`/receipts/${id}`, { method: 'DELETE' }),

  // Deliveries
  getDeliveries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/deliveries${query ? '?' + query : ''}`);
  },
  getDelivery: (id) => request(`/deliveries/${id}`),
  createDelivery: (data) => request('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  updateDelivery: (id, data) => request(`/deliveries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  validateDelivery: (id) => request(`/deliveries/${id}/validate`, { method: 'POST', body: JSON.stringify({}) }),
  deleteDelivery: (id) => request(`/deliveries/${id}`, { method: 'DELETE' }),

  // Transfers
  getTransfers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transfers${query ? '?' + query : ''}`);
  },
  getTransfer: (id) => request(`/transfers/${id}`),
  createTransfer: (data) => request('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  validateTransfer: (id) => request(`/transfers/${id}/validate`, { method: 'POST', body: JSON.stringify({}) }),
  deleteTransfer: (id) => request(`/transfers/${id}`, { method: 'DELETE' }),

  // Adjustments
  getAdjustments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/adjustments${query ? '?' + query : ''}`);
  },
  getAdjustment: (id) => request(`/adjustments/${id}`),
  createAdjustment: (data) => request('/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  validateAdjustment: (id) => request(`/adjustments/${id}/validate`, { method: 'POST', body: JSON.stringify({}) }),
  deleteAdjustment: (id) => request(`/adjustments/${id}`, { method: 'DELETE' }),

  // Stock
  getStockLedger: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/stock/ledger${query ? '?' + query : ''}`);
  },
  getStockSummary: () => request('/stock/summary'),
  getStockByProduct: (productId) => request(`/stock/by-product/${productId}`),
};
