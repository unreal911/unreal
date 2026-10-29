/** Canonical page URLs match Astro's trailingSlash: 'always' setting. */
export function canonicalUrl(pathname: string, siteUrl: URL | undefined): string | undefined {
  if (!siteUrl) return undefined;
  const path = pathname.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '');
  return new URL(path ? `/${path}/` : '/', siteUrl).href;
}

export function socialImageUrl(image: string, siteUrl: URL | undefined): string | undefined {
  if (!siteUrl) return undefined;
  const url = new URL(image, siteUrl);
  return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
}

/** Prevent content from closing the JSON-LD script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[character]!);
}
