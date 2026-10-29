import type { APIRoute } from 'astro';
import { getProjects } from '../lib/projects';
import { canonicalUrl, escapeXml } from '../lib/seo';

export const GET: APIRoute = async ({ site }) => {
  // A preview without its final domain must not advertise provisional URLs.
  const urls = site
    ? ['/', ...(await getProjects()).map((project) => `/proyectos/${project.slug}/`)]
      .map((pathname) => canonicalUrl(pathname, site)!)
    : [];
  const entries = [...new Set(urls)].map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`);
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...entries, '</urlset>'].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
