import { NextResponse } from 'next/server';

const AUTH_PAGES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/face/login',
]);

function isAdminPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isPublicPath(pathname) {
  return pathname === '/' || AUTH_PAGES.has(pathname);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next')
    || pathname.startsWith('/api')
    || pathname.startsWith('/uploads')
    || pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const adminRole = request.cookies.get('wardrobe-admin-auth-role')?.value;
  const userRole = request.cookies.get('wardrobe-user-auth-role')?.value;
  const legacyRole = request.cookies.get('wardrobe-auth-role')?.value;

  if (isAdminPath(pathname)) {
    const effectiveAdminRole = adminRole || legacyRole;

    if (effectiveAdminRole && effectiveAdminRole !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
      url.searchParams.set('reason', 'forbidden');
      url.searchParams.set('loginType', 'admin');
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (!isPublicPath(pathname) && userRole === 'ADMIN' && !adminRole) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
