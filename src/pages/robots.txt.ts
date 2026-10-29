import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  // Crawlers must be able to read the noindex tags on previews and demo pages.
  const lines = ['User-agent: *', 'Allow: /'];
  if (site) lines.push('', `Sitemap: ${new URL('/sitemap.xml', site).href}`);
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
