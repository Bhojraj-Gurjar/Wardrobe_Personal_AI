import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';

const LEGACY_ROLE_COOKIE = 'wardrobe-auth-role';
const LEGACY_USER_ID_COOKIE = 'wardrobe-auth-uid';

const USER_ROLE_COOKIE = 'wardrobe-user-auth-role';
const USER_ID_COOKIE = 'wardrobe-user-auth-uid';
const ADMIN_ROLE_COOKIE = 'wardrobe-admin-auth-role';
const ADMIN_ID_COOKIE = 'wardrobe-admin-auth-uid';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function buildCookie(name, value, maxAge = COOKIE_MAX_AGE_SECONDS) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '; Secure'
    : '';

  return `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookieNames(context) {
  if (context === AUTH_CONTEXT.ADMIN) {
    return {
      role: ADMIN_ROLE_COOKIE,
      userId: ADMIN_ID_COOKIE,
    };
  }

  return {
    role: USER_ROLE_COOKIE,
    userId: USER_ID_COOKIE,
  };
}

export function syncSessionCookies(context, user) {
  if (typeof document === 'undefined' || !user?.id || !context) {
    return;
  }

  const cookies = getCookieNames(context);
  document.cookie = buildCookie(cookies.role, user.role || '');
  document.cookie = buildCookie(cookies.userId, user.id);
}

export function clearSessionCookies(context) {
  if (typeof document === 'undefined') {
    return;
  }

  if (!context) {
    clearSessionCookies(AUTH_CONTEXT.USER);
    clearSessionCookies(AUTH_CONTEXT.ADMIN);
    clearLegacySessionCookies();
    return;
  }

  const cookies = getCookieNames(context);
  document.cookie = `${cookies.role}=; path=/; max-age=0`;
  document.cookie = `${cookies.userId}=; path=/; max-age=0`;
}

export function clearLegacySessionCookies() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${LEGACY_ROLE_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${LEGACY_USER_ID_COOKIE}=; path=/; max-age=0`;
}

export function readSessionRoleCookie(context = AUTH_CONTEXT.USER) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieName = getCookieNames(context).role;
  const match = document.cookie.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
