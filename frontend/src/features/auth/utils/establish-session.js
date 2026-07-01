import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { setSessionSlice } from '@/stores/auth-store';
import { syncSessionCookies } from '@/features/auth/utils/session-cookie';

export function establishSession({
  context = AUTH_CONTEXT.USER,
  accessToken,
  refreshToken,
  user,
}) {
  const session = { accessToken, refreshToken, user };
  setSessionSlice(context, session);
  syncSessionCookies(context, user);
}
