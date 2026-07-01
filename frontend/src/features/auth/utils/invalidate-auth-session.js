import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
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

export function resolveAuthContextFromPathname(pathname = '') {
  return isAdminRoute(pathname) ? AUTH_CONTEXT.ADMIN : AUTH_CONTEXT.USER;
}

export function invalidateAuthSession({
  context,
  redirect = true,
  preserveReturnPath = true,
  reason = 'session_expired',
} = {}) {
  const resolvedContext = context
    ?? (typeof window !== 'undefined'
      ? resolveAuthContextFromPathname(window.location.pathname)
      : AUTH_CONTEXT.USER);

  clearAuthSession(resolvedContext);

  if (!redirect || typeof window === 'undefined') {
    return;
  }

  const { pathname, search } = window.location;

  if (PUBLIC_PATHS.has(pathname)) {
    const params = new URLSearchParams();
    if (reason) {
      params.set('reason', reason);
    }
    if (resolvedContext === AUTH_CONTEXT.ADMIN) {
      params.set('loginType', 'admin');
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

  if (resolvedContext === AUTH_CONTEXT.ADMIN) {
    params.set('loginType', 'admin');
  }

  const qs = params.toString();
  window.location.replace(`${ROUTES.AUTH.LOGIN}${qs ? `?${qs}` : ''}`);
}
