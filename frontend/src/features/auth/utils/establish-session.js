import { useAuthStore } from '@/stores/auth-store';
import { clearAuthSession } from '@/features/auth/utils/clear-auth-session';
import { syncSessionCookies } from '@/features/auth/utils/session-cookie';

export function establishSession({ accessToken, refreshToken, user }) {
  clearAuthSession();
  useAuthStore.getState().setSession({ accessToken, refreshToken, user });
  syncSessionCookies(user);
}
