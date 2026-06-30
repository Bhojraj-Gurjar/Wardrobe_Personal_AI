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

  const role = request.cookies.get('wardrobe-auth-role')?.value;

  if (isAdminPath(pathname) && role && role !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    url.searchParams.set('reason', 'forbidden');
    url.searchParams.set('loginType', 'admin');
    return NextResponse.redirect(url);
  }

  if (!isPublicPath(pathname) && !isAdminPath(pathname) && role === 'ADMIN') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
