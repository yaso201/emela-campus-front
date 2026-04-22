const PORTAL_BASE_PATH = '/app-emela';
const PORTAL_SPA_ROUTES = [
  '/',
  '/planning',
  '/results',
  '/evals',
  '/support',
  '/notifications',
  '/internship',
  '/insights',
];

function matchesPortalRoute(url, route) {
  if (route === '/') {
    return url === '/';
  }

  return (
    url === route ||
    url.startsWith(`${route}/`) ||
    url.startsWith(`${route}?`) ||
    url.startsWith(`${route}#`)
  );
}

function isPortalSpaUrl(url) {
  return PORTAL_SPA_ROUTES.some((route) => matchesPortalRoute(url, route));
}

export function isExternalUrl(url = '') {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function normalizePortalRoute(url = '') {
  if (!url || isExternalUrl(url)) {
    return url;
  }

  if (url === PORTAL_BASE_PATH) {
    return '/';
  }

  if (url.startsWith(`${PORTAL_BASE_PATH}/`)) {
    const stripped = url.slice(PORTAL_BASE_PATH.length) || '/';
    return isPortalSpaUrl(stripped) ? stripped : url;
  }

  return isPortalSpaUrl(url) ? url : url;
}

export function normalizePortalHref(url = '') {
  if (!url || isExternalUrl(url)) {
    return url;
  }

  if (url === PORTAL_BASE_PATH || url.startsWith(`${PORTAL_BASE_PATH}/`)) {
    return url;
  }

  if (url === '/') {
    return PORTAL_BASE_PATH;
  }

  return isPortalSpaUrl(url) ? `${PORTAL_BASE_PATH}${url}` : url;
}
