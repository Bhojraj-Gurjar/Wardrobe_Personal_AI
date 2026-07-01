import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { clearSessionSlice, useAuthStore } from '@/stores/auth-store';
import { useVirtualTryOnSessionStore } from '@/stores/virtual-try-on-session-store';
import {
  clearLegacySessionCookies,
  clearSessionCookies,
} from '@/features/auth/utils/session-cookie';

let queryClientRef = null;

export function bindAuthSessionQueryClient(queryClient) {
  queryClientRef = queryClient;
}

export function clearAuthSession(context) {
  if (!context) {
    clearAuthSession(AUTH_CONTEXT.USER);
    clearAuthSession(AUTH_CONTEXT.ADMIN);
    clearLegacySessionCookies();
    queryClientRef?.clear();
    return;
  }

  clearSessionSlice(context);
  clearSessionCookies(context);

  if (context === AUTH_CONTEXT.USER) {
    useVirtualTryOnSessionStore.getState().clearUserSessions();

    if (useVirtualTryOnSessionStore.persist?.clearStorage) {
      useVirtualTryOnSessionStore.persist.clearStorage();
    }
  }

  if (!getOtherSessionHasCredentials(context)) {
    queryClientRef?.clear();
  }
}

function getOtherSessionHasCredentials(context) {
  const state = useAuthStore.getState();

  if (context === AUTH_CONTEXT.USER) {
    return Boolean(state.adminSession.accessToken);
  }

  return Boolean(state.userSession.accessToken);
}
