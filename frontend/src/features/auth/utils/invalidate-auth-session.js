import { clearAuthSession } from '@/features/auth/utils/clear-auth-session';
import { ROUTES } from '@/constants/routes';
import { isAdminRoute } from '@/features/auth/utils/auth-routing';

const PUBLIC_PATHS = new Set([
  ROUTES.HOME,
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.FACE.LOGIN,
]);

export function invalidateAuthSession({
  redirect = true,
  preserveReturnPath = true,
  reason = 'session_expired',
} = {}) {
  clearAuthSession();

  if (!redirect || typeof window === 'undefined') {
    return;
  }

  const { pathname, search } = window.location;

  if (PUBLIC_PATHS.has(pathname)) {
    const params = new URLSearchParams();
    if (reason) {
      params.set('reason', reason);
    }
    const qs = params.toString();
    window.location.replace(`${ROUTES.AUTH.LOGIN}${qs ? `?${qs}` : ''}`);
    return;
  }

  const params = new URLSearchParams();

  if (preserveReturnPath) {
    params.set('redirect', `${pathname}${search}`);
  }

  if (reason) {
    params.set('reason', reason);
  }

  if (isAdminRoute(pathname)) {
    params.set('loginType', 'admin');
  }

  const qs = params.toString();
  window.location.replace(`${ROUTES.AUTH.LOGIN}${qs ? `?${qs}` : ''}`);
}
