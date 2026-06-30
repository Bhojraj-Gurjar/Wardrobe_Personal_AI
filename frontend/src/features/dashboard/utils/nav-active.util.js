export function isNavItemActive(pathname, href, options = {}) {
  if (!pathname || !href) {
    return false;
  }

  const { exact = false } = options;

  if (pathname === href) {
    return true;
  }

  if (exact) {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}
