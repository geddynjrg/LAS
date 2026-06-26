const ALLOWED_LOANS_HOSTS = new Set([
  'loans-staging.uwezo.go.ke',
  'loans.uwezo.go.ke',
  'localhost',
  '127.0.0.1',
]);

/**
 * CMS blocks may store absolute staging URLs. Convert known app URLs to same-origin paths.
 */
export function normalizeInternalHref(
  href: string | undefined,
  fallback = '/apply',
): string {
  if (!href?.trim()) {
    return fallback;
  }

  const trimmed = href.trim();

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (ALLOWED_LOANS_HOSTS.has(url.hostname)) {
      return `${url.pathname}${url.search}${url.hash}` || fallback;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
