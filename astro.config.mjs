import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const env = loadEnv(process.env.NODE_ENV ?? 'production', projectRoot, '');
const configuredUrl = env.SITE_URL?.trim();
let siteUrl;

if (configuredUrl) {
  const url = new URL(configuredUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL debe contener el origen HTTP(S) del dominio, sin ruta, credenciales, parámetros ni fragmento.');
  }
  siteUrl = url.origin;
}

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  ...(siteUrl ? { site: siteUrl } : {}),
  integrations: [
    {
      name: 'inline-home-styles',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          // The landing page can paint without waiting for separate CSS requests.
          // Other routes keep their stylesheets available for normal browser caching.
          const home = new URL('index.html', dir);
          let html = await readFile(home, 'utf8');
          const links = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];
          for (const [tag] of links) {
            const href = tag.match(/\bhref="([^"]+)"/)?.[1];
            if (!href || !/^\/_astro\/[\w.-]+\.css$/.test(href)) continue;
            const css = await readFile(new URL(href.slice(1), dir), 'utf8');
            html = html.replace(tag, `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
          }
          await writeFile(home, html);
        },
      },
    },
    {
      name: 'exclude-portfolio-qa',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          // Keep the local QA tool available in development, outside published builds.
          await rm(new URL('__portfolio-qa.html', dir), { force: true });
        },
      },
    },
  ],
});
