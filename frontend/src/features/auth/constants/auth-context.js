export const AUTH_CONTEXT = {
  USER: 'user',
  ADMIN: 'admin',
};

export function isAuthContext(value) {
  return value === AUTH_CONTEXT.USER || value === AUTH_CONTEXT.ADMIN;
}
