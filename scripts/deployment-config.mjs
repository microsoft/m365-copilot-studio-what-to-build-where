/** Resolve Pages metadata without baking an owner or repository into the site. */
export function deploymentConfig(env) {
  const site = env.SITE_URL || undefined;
  const rawBase = env.BASE_PATH || '/';
  if (!rawBase.startsWith('/') || /[?#\\]/.test(rawBase)) {
    throw new Error('BASE_PATH must be an absolute URL path without a query or fragment.');
  }
  if (site) {
    const url = new URL(site);
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/') {
      throw new Error('SITE_URL must be an HTTP(S) origin; use BASE_PATH for the path.');
    }
  }
  return { site, base: rawBase === '/' ? '/' : `/${rawBase.split('/').filter(Boolean).join('/')}/` };
}
