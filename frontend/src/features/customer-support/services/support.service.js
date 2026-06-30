import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

function buildSupportQuery(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.category) query.set('category', params.category);
  if (params.priority) query.set('priority', params.priority);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  return query.toString();
}

export function fetchAdminSupportTickets(token, params = {}) {
  const qs = buildSupportQuery(params);
  return apiClient(`${API_ENDPOINTS.ADMIN.SUPPORT_TICKETS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchAdminSupportTicket(token, ticketId) {
  return apiClient(API_ENDPOINTS.ADMIN.SUPPORT_TICKET_BY_ID(ticketId), { token });
}

export function fetchAdminSupportAnalytics(token) {
  return apiClient(API_ENDPOINTS.ADMIN.SUPPORT_ANALYTICS, { token });
}

export function fetchAdminSupportAssignees(token) {
  return apiClient(API_ENDPOINTS.ADMIN.SUPPORT_ASSIGNEES, { token });
}

export function updateAdminSupportTicket(token, ticketId, body) {
  return apiClient(API_ENDPOINTS.ADMIN.SUPPORT_TICKET_BY_ID(ticketId), {
    method: 'PATCH',
    body,
    token,
  });
}

export function replyAdminSupportTicket(token, ticketId, formData) {
  return apiClient(`${API_ENDPOINTS.ADMIN.SUPPORT_TICKET_BY_ID(ticketId)}/messages`, {
    method: 'POST',
    body: formData,
    token,
  });
}

export function deleteAdminSupportTicket(token, ticketId) {
  return apiClient(API_ENDPOINTS.ADMIN.SUPPORT_TICKET_BY_ID(ticketId), {
    method: 'DELETE',
    token,
  });
}

export async function exportAdminSupportTickets(token, params = {}) {
  const qs = buildSupportQuery(params);
  const { API_BASE_URL } = await import('@/constants/api');
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.ADMIN.SUPPORT_EXPORT}${qs ? `?${qs}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to export support tickets');
  }

  return response.text();
}

export function fetchSupportTickets(token, params = {}) {
  const qs = buildSupportQuery(params);
  return apiClient(`${API_ENDPOINTS.SUPPORT.TICKETS}${qs ? `?${qs}` : ''}`, { token });
}

export function fetchSupportTicket(token, ticketId) {
  return apiClient(API_ENDPOINTS.SUPPORT.TICKET_BY_ID(ticketId), { token });
}

export function createSupportTicket(token, formData) {
  return apiClient(API_ENDPOINTS.SUPPORT.TICKETS, {
    method: 'POST',
    body: formData,
    token,
  });
}

export function replyToSupportTicket(token, ticketId, formData) {
  return apiClient(`${API_ENDPOINTS.SUPPORT.TICKET_BY_ID(ticketId)}/messages`, {
    method: 'POST',
    body: formData,
    token,
  });
}

export function closeSupportTicket(token, ticketId) {
  return apiClient(`${API_ENDPOINTS.SUPPORT.TICKET_BY_ID(ticketId)}/close`, {
    method: 'POST',
    token,
  });
}

export function reopenSupportTicket(token, ticketId) {
  return apiClient(`${API_ENDPOINTS.SUPPORT.TICKET_BY_ID(ticketId)}/reopen`, {
    method: 'POST',
    token,
  });
}

export function fetchSupportNotifications(token, params = {}) {
  const query = new URLSearchParams();
  if (params.unreadOnly != null) query.set('unreadOnly', String(params.unreadOnly));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiClient(`${API_ENDPOINTS.SUPPORT.NOTIFICATIONS}${qs ? `?${qs}` : ''}`, { token });
}

export function markSupportNotificationsRead(token, ids) {
  return apiClient(`${API_ENDPOINTS.SUPPORT.NOTIFICATIONS}/read`, {
    method: 'PATCH',
    body: { ids },
    token,
  });
}
