export const RETURN_PATH_COOKIE = 'uwezo_return_path';
export const RETURN_PATH_STORAGE_KEY = 'uwezo_return_path';

const EXCLUDED_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/reset',
  '/logout',
  '/apply/create',
  '/payment-success',
]);

const EXCLUDED_PREFIXES = [
  '/login/',
  '/signup/',
  '/reset/',
  '/logout/',
  '/ecitizen/',
];

const ALLOWED_PREFIXES = ['/dashboard', '/apply', '/admin'];

export function isValidReturnPath(
  path: string | null | undefined,
): path is string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return false;
  }

  const pathname = path.split('?')[0] ?? '';

  if (!pathname || EXCLUDED_PATHS.has(pathname)) {
    return false;
  }

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolveReturnPath(explicit?: string | null): string {
  if (explicit && isValidReturnPath(explicit)) {
    return explicit;
  }

  if (typeof window === 'undefined') {
    return '/dashboard';
  }

  const fromStorage = localStorage.getItem(RETURN_PATH_STORAGE_KEY);
  if (isValidReturnPath(fromStorage)) {
    return fromStorage;
  }

  const fromCookie = readCookie(RETURN_PATH_COOKIE);
  if (isValidReturnPath(fromCookie)) {
    return fromCookie;
  }

  return '/dashboard';
}

export function persistReturnPath(path: string): void {
  if (!isValidReturnPath(path) || typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(RETURN_PATH_STORAGE_KEY, path);
  document.cookie = `${RETURN_PATH_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match) {
    return null;
  }

  try {
    const value = match[1];
    return value ? decodeURIComponent(value) : null;
  } catch {
    return null;
  }
}

export function getReturnPathFromCookieValue(
  raw: string | undefined,
): string | null {
  if (!raw) {
    return null;
  }

  try {
    const path = decodeURIComponent(raw);
    return isValidReturnPath(path) ? path : null;
  } catch {
    return null;
  }
}
