const ROLE_COOKIE = 'wardrobe-auth-role';
const USER_ID_COOKIE = 'wardrobe-auth-uid';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function buildCookie(name, value, maxAge = COOKIE_MAX_AGE_SECONDS) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '; Secure'
    : '';

  return `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function syncSessionCookies(user) {
  if (typeof document === 'undefined' || !user?.id) {
    return;
  }

  document.cookie = buildCookie(ROLE_COOKIE, user.role || '');
  document.cookie = buildCookie(USER_ID_COOKIE, user.id);
}

export function clearSessionCookies() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${USER_ID_COOKIE}=; path=/; max-age=0`;
}

export function readSessionRoleCookie() {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${ROLE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
