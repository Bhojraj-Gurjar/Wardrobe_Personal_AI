import { useAuthStore } from '@/stores/auth-store';
import { useVirtualTryOnSessionStore } from '@/stores/virtual-try-on-session-store';
import { clearSessionCookies } from '@/features/auth/utils/session-cookie';

let queryClientRef = null;

export function bindAuthSessionQueryClient(queryClient) {
  queryClientRef = queryClient;
}

export function clearAuthSession() {
  useAuthStore.getState().clearSession();
  useAuthStore.persist.clearStorage();
  useVirtualTryOnSessionStore.getState().clearUserSessions();
  clearSessionCookies();

  if (useVirtualTryOnSessionStore.persist?.clearStorage) {
    useVirtualTryOnSessionStore.persist.clearStorage();
  }

  queryClientRef?.clear();
}
