import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

function notificationsBase(isAdmin) {
  return isAdmin ? API_ENDPOINTS.ADMIN.NOTIFICATIONS.BASE : API_ENDPOINTS.NOTIFICATIONS.BASE;
}

export function fetchNotifications(token, params = {}, isAdmin = false) {
  const search = new URLSearchParams();

  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.category && params.category !== 'ALL') search.set('category', params.category);
  if (params.search) search.set('search', params.search);
  if (params.unreadOnly) search.set('unreadOnly', 'true');

  const query = search.toString();
  const path = `${notificationsBase(isAdmin)}${query ? `?${query}` : ''}`;

  return apiClient(path, { token });
}

export function fetchUnreadNotificationCount(token, isAdmin = false) {
  return apiClient(`${notificationsBase(isAdmin)}/unread-count`, { token });
}

export function markNotificationsRead(token, ids, isAdmin = false) {
  return apiClient(`${notificationsBase(isAdmin)}/read`, {
    method: 'PATCH',
    token,
    body: { ids },
  });
}

export function markAllNotificationsRead(token, isAdmin = false) {
  return apiClient(`${notificationsBase(isAdmin)}/read-all`, {
    method: 'PATCH',
    token,
  });
}
