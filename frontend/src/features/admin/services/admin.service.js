import { API_ENDPOINTS, FACE_AI_TIMEOUT_MS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

const FACE_FIELD = 'frontFace';

function buildFaceFormData(imageFile) {
  const formData = new FormData();
  formData.append(FACE_FIELD, imageFile, imageFile.name || 'front-face.jpg');
  return formData;
}

export function adminLogin(payload) {
  return apiClient(API_ENDPOINTS.ADMIN.LOGIN, {
    method: 'POST',
    body: payload,
  });
}

export function adminFaceLogin(imageFile) {
  return apiClient(API_ENDPOINTS.ADMIN.FACE_LOGIN, {
    method: 'POST',
    body: buildFaceFormData(imageFile),
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}

export function adminRegisterFace(imageFile, token) {
  return apiClient(API_ENDPOINTS.ADMIN.REGISTER_FACE, {
    method: 'POST',
    body: buildFaceFormData(imageFile),
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}

export function fetchAdminDashboard(token) {
  return apiClient(API_ENDPOINTS.ADMIN.DASHBOARD, { token });
}

export function fetchAdminAnalytics(token, params = {}) {
  const query = new URLSearchParams();
  if (params?.period) query.set('period', params.period);
  const qs = query.toString();
  return apiClient(`${API_ENDPOINTS.ADMIN.ANALYTICS}${qs ? `?${qs}` : ''}`, { token });
}

function buildDetailAnalyticsQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

export function fetchAdminAnalyticsUserGrowth(params, token) {
  const qs = buildDetailAnalyticsQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.ANALYTICS_USER_GROWTH}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminAnalyticsDevices(params, token) {
  const qs = buildDetailAnalyticsQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.ANALYTICS_DEVICES}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminAnalyticsOrdersDetail(params, token) {
  const qs = buildDetailAnalyticsQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.ANALYTICS_ORDERS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminAnalyticsCategories(params, token) {
  const qs = buildDetailAnalyticsQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.ANALYTICS_CATEGORIES}${qs ? `?${qs}` : ''}`, { token });
}

function buildAnalyticsQuery(params = {}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.filter) query.set('filter', params.filter);
  if (params?.category) query.set('category', params.category);
  if (params?.stock) query.set('stock', params.stock);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return query.toString();
}

export function fetchAdminAnalyticsCustomers(params, token) {
  const qs = buildAnalyticsQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.ANALYTICS_CUSTOMERS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminAnalyticsProducts(params, token) {
  const qs = buildAnalyticsQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.ANALYTICS_PRODUCTS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminUsers(params, token) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.plan) query.set('plan', params.plan);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiClient(`${API_ENDPOINTS.ADMIN.USERS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminUser(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.USER_BY_ID(id), { token });
}

export function updateAdminUser(id, payload, token) {
  return apiClient(API_ENDPOINTS.ADMIN.USER_BY_ID(id), {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export function deactivateAdminUser(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.DEACTIVATE_USER(id), {
    method: 'POST',
    token,
  });
}

export function deleteAdminUser(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.USER_BY_ID(id), {
    method: 'DELETE',
    token,
  });
}

export function fetchAdminProducts(params, token) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.category) query.set('category', params.category);
  if (params?.productType) query.set('productType', params.productType);
  if (params?.brand) query.set('brand', params.brand);
  if (params?.gender) query.set('gender', params.gender);
  if (params?.status) query.set('status', params.status);
  if (params?.visibility) query.set('visibility', params.visibility);
  if (params?.stock) query.set('stock', params.stock);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  const qs = query.toString();
  return apiClient(`${API_ENDPOINTS.ADMIN.PRODUCTS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminProductById(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_BY_ID(id), { token });
}

export function createAdminCmsProduct(payload, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_CMS, {
    method: 'POST',
    body: payload,
    token,
  });
}

export function uploadAdminProductImages(productId, files, token) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file, file.name));
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_IMAGES(productId), {
    method: 'POST',
    body: formData,
    token,
  });
}

export function adjustAdminProductInventory(productId, payload, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_INVENTORY(productId), {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export function validateAdminBulkProducts(rows, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_BULK_VALIDATE, {
    method: 'POST',
    body: { rows },
    token,
  });
}

export function importAdminBulkProducts(rows, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_BULK_IMPORT, {
    method: 'POST',
    body: { rows },
    token,
  });
}

export function createAdminProduct(payload, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCTS, {
    method: 'POST',
    body: payload,
    token,
  });
}

export function updateAdminProduct(id, payload, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_BY_ID(id), {
    method: 'PUT',
    body: payload,
    token,
  });
}

export function deleteAdminProduct(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PRODUCT_BY_ID(id), {
    method: 'DELETE',
    token,
  });
}

export function toggleAdminProductStatus(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.TOGGLE_PRODUCT(id), {
    method: 'PATCH',
    token,
  });
}

export function fetchAdminProfile(token) {
  return apiClient(API_ENDPOINTS.ADMIN.PROFILE, { token });
}

export function updateAdminProfile(payload, token) {
  return apiClient(API_ENDPOINTS.ADMIN.PROFILE, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export function changeAdminPassword(payload, token) {
  return apiClient(API_ENDPOINTS.ADMIN.CHANGE_PASSWORD, {
    method: 'POST',
    body: payload,
    token,
  });
}

function buildAdminOrdersQuery(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sort) query.set('sort', params.sort);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.payment_method) query.set('payment_method', params.payment_method);
  if (params.priority) query.set('priority', params.priority);
  return query.toString();
}

export function fetchAdminOrdersSummary(token) {
  return apiClient(API_ENDPOINTS.ADMIN.ORDERS_SUMMARY, { token });
}

export function fetchAdminOrders(params, token) {
  const qs = buildAdminOrdersQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.ORDERS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminOrderById(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.ORDER_BY_ID(id), { token });
}

export function fetchAdminOrdersByUser(params, token) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return apiClient(`${API_ENDPOINTS.ADMIN.ORDERS_USERS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminOrdersAnalytics(token) {
  return apiClient(API_ENDPOINTS.ADMIN.ORDERS_ANALYTICS, { token });
}

export function updateAdminOrderStatus(id, status, token) {
  return apiClient(API_ENDPOINTS.ADMIN.ORDER_STATUS(id), {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export function cancelAdminOrder(id, token) {
  return apiClient(API_ENDPOINTS.ADMIN.ORDER_CANCEL(id), {
    method: 'POST',
    token,
  });
}

export async function exportAdminOrdersCsv(params, token) {
  const qs = buildAdminOrdersQuery(params);
  const { API_BASE_URL } = await import('@/constants/api');
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.ADMIN.ORDER_EXPORT}${qs ? `?${qs}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to export orders');
  }

  return response.text();
}

export function fetchAdminOmsSummary(token) {
  return apiClient(API_ENDPOINTS.ADMIN.OMS_SUMMARY, { token });
}

export function bulkAcceptAdminOrders(orderIds, token) {
  return apiClient(API_ENDPOINTS.ADMIN.OMS_BULK_ACCEPT, {
    method: 'POST',
    body: { orderIds },
    token,
  });
}

function omsAction(path, token, body = {}) {
  return apiClient(path, { method: 'POST', body, token });
}

export const adminOmsActions = {
  accept: (id, token, notes) => omsAction(API_ENDPOINTS.ADMIN.OMS_ACCEPT(id), token, { notes }),
  hold: (id, token, notes) => omsAction(API_ENDPOINTS.ADMIN.OMS_HOLD(id), token, { notes }),
  generateInvoice: (id, token, regenerate = false) =>
    omsAction(API_ENDPOINTS.ADMIN.OMS_INVOICE(id), token, { regenerate }),
  generateLabel: (id, token, regenerate = false) =>
    omsAction(API_ENDPOINTS.ADMIN.OMS_LABEL(id), token, { regenerate }),
  moveToPacking: (id, token) => omsAction(API_ENDPOINTS.ADMIN.OMS_PACKING(id), token),
  updatePackingChecklist: (id, token, checklist) =>
    apiClient(API_ENDPOINTS.ADMIN.OMS_PACKING_CHECKLIST(id), { method: 'PATCH', body: checklist, token }),
  markPacked: (id, token, notes) => omsAction(API_ENDPOINTS.ADMIN.OMS_PACKED(id), token, { notes }),
  markRtd: (id, token, payload) => omsAction(API_ENDPOINTS.ADMIN.OMS_RTD(id), token, payload),
  quickMarkRtd: (id, token) => omsAction(API_ENDPOINTS.ADMIN.OMS_QUICK_RTD(id), token),
  dispatchOrder: (id, token, payload) => omsAction(API_ENDPOINTS.ADMIN.OMS_DISPATCH(id), token, payload),
  markHandover: (id, token, payload) => omsAction(API_ENDPOINTS.ADMIN.OMS_HANDOVER(id), token, payload),
  markShipped: (id, token, payload) => omsAction(API_ENDPOINTS.ADMIN.OMS_SHIPPED(id), token, payload),
  markDelivered: (id, token, notes) => omsAction(API_ENDPOINTS.ADMIN.OMS_DELIVERED(id), token, { notes }),
  markCompleted: (id, token) => omsAction(API_ENDPOINTS.ADMIN.OMS_COMPLETED(id), token),
};
