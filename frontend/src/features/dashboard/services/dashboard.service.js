import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchDashboardSummary(token) {
  return apiClient(API_ENDPOINTS.DASHBOARD.SUMMARY, { token });
}
