import { ROUTES } from '@/constants/routes';
import { isAdminUser } from '@/features/admin/utils/is-admin-user';

export function isAdminRoute(pathname = '') {
  return pathname === ROUTES.ADMIN.HOME || pathname.startsWith(`${ROUTES.ADMIN.HOME}/`);
}

export function isSafeInternalPath(path) {
  return Boolean(path?.startsWith('/') && !path.startsWith('//'));
}

export function buildLoginRedirect(pathname = '/', search = '', options = {}) {
  const next = `${pathname}${search}`;
  const params = new URLSearchParams();
  params.set('redirect', next);

  if (options.loginType === 'admin') {
    params.set('loginType', 'admin');
  }

  return `${ROUTES.AUTH.LOGIN}?${params.toString()}`;
}

export function resolveAuthenticatedLanding(user, options = {}) {
  const { redirect, pathname } = options;

  if (isSafeInternalPath(redirect)) {
    if (isAdminUser(user) && !isAdminRoute(redirect)) {
      return ROUTES.ADMIN.DASHBOARD;
    }

    if (!isAdminUser(user) && isAdminRoute(redirect)) {
      return ROUTES.DASHBOARD.HOME;
    }

    return redirect;
  }

  if (isSafeInternalPath(pathname) && isAdminUser(user) && isAdminRoute(pathname)) {
    return pathname;
  }

  return isAdminUser(user) ? ROUTES.ADMIN.DASHBOARD : ROUTES.DASHBOARD.HOME;
}
