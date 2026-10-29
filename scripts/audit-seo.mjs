import fs from 'node:fs';
import path from 'node:path';

// Audit the built HTML; no network access or private environment values are needed.
const root = path.resolve(process.argv[2] || 'dist');
const origin = 'https://nubicore.digital';
const decode = (text) => text.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[\da-f]+|\d+);/gi, (entity) => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
  if (named[entity]) return named[entity];
  return String.fromCodePoint(parseInt(entity.slice(entity[2].toLowerCase() === 'x' ? 3 : 2, -1), entity[2].toLowerCase() === 'x' ? 16 : 10));
});
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((m) => [m[1], decode(m[2] ?? m[3])]));
const text = (html) => decode(html.replace(/<[^>]*>/g, '')).trim();
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const htmlFiles = walk(root).filter((file) => file.endsWith('.html'));
const cache = new Map(htmlFiles.map((file) => [file, fs.readFileSync(file, 'utf8')]));
const issues = [];
const pages = [];
let references = 0;
const issue = (url, message) => issues.push({ url, message });

for (const [file, html] of cache) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const pathname = `/${relative.replace(/index\.html$/, '')}`;
  const url = new URL(pathname, origin).href;
  const isIndexable = relative === 'index.html' || relative.startsWith('proyectos/');
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const meta = (name) => metaTags.filter((tag) => tag.name === name || tag.property === name);
  const titleMatches = [...html.matchAll(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/gi)];
  const title = text(titleMatches[0]?.[1] || '');
  const description = meta('description')[0]?.content;
  const robots = meta('robots')[0]?.content;
  const canonical = linkTags.filter((tag) => tag.rel === 'canonical');
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
  const graphs = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try { const data = JSON.parse(m[1]); return data['@graph'] || [data]; }
    catch { issue(url, 'JSON-LD inválido'); return []; }
  });
  if (titleMatches.length !== 1 || !title) issue(url, 'Debe haber un único título no vacío');
  if (meta('description').length !== 1 || !description) issue(url, 'Descripción ausente o duplicada');
  if (!/<html\b[^>]*lang="es(?:-PE)?"/i.test(html)) issue(url, 'Idioma español ausente');
  if (!meta('viewport').length) issue(url, 'Falta viewport');
  if (isIndexable) {
    if (robots !== 'index,follow') issue(url, 'La página principal debe permitir indexación');
    if (canonical.length !== 1 || canonical[0]?.href !== url) issue(url, 'Canonical ausente, duplicada o incorrecta');
    if (h1.length !== 1) issue(url, 'Debe haber un H1 en la página principal');
    if (!title.includes('Nubicore')) issue(url, 'Falta la marca Nubicore en el título');
    if (/Código Impulso|CÓDIGO IMPULSO|código impulso/.test(html)) issue(url, 'Queda la marca anterior');
    for (const name of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:image']) {
      if (meta(name).length !== 1 || !meta(name)[0].content) issue(url, `Metadato social ausente o duplicado: ${name}`);
    }
    if (meta('og:url')[0]?.content !== url) issue(url, 'og:url no coincide con canonical');
    for (const type of ['Organization', 'WebSite', 'WebPage']) if (!graphs.some((node) => node['@type'] === type)) issue(url, `Faltan datos estructurados ${type}`);
    if (relative.startsWith('proyectos/')) {
      const breadcrumb = graphs.find((node) => node['@type'] === 'BreadcrumbList');
      if (breadcrumb?.itemListElement?.at(-1)?.item !== url) issue(url, 'Breadcrumb no termina en esta URL');
    }
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    const seen = new Set();
    for (const id of ids) { if (seen.has(id)) issue(url, `ID duplicado: ${id}`); seen.add(id); }
  } else if (!robots?.includes('noindex')) issue(url, 'La demo debe mantener noindex');
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    const attributes = attrs(image[0]);
    if (!Object.hasOwn(attributes, 'alt')) issue(url, `Imagen sin alt: ${attributes.src}`);
  }
  for (const match of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)) {
    const raw = decode(match[1]);
    if (!raw || /^(?:data:|mailto:|tel:|javascript:)/.test(raw)) continue;
    const reference = new URL(raw, url);
    if (reference.origin !== origin) continue;
    references++;
    let target = path.join(root, decodeURIComponent(reference.pathname));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) { issue(url, `Recurso interno inexistente: ${raw}`); continue; }
    if (isIndexable && reference.hash && target.endsWith('.html')) {
      const targetHtml = cache.get(target) || fs.readFileSync(target, 'utf8');
      if (!targetHtml.includes(`id="${decodeURIComponent(reference.hash.slice(1))}"`)) issue(url, `Ancla interna inexistente: ${raw}`);
    }
  }
  if (isIndexable) pages.push({ url, title, titleLength: title.length, description, descriptionLength: description?.length, h1, robots, structuredData: graphs.map((node) => node['@type']) });
}

for (const key of ['title', 'description']) {
  const groups = new Map();
  for (const page of pages) groups.set(page[key], [...(groups.get(page[key]) || []), page.url]);
  for (const [value, urls] of groups) if (urls.length > 1) issue(urls.join(', '), `${key} duplicado: ${value}`);
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
if (sitemapUrls.length !== pages.length || sitemapUrls.some((url) => !pages.some((page) => page.url === url))) issue('/sitemap.xml', 'El sitemap no coincide con las páginas indexables');
if (!fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`)) issue('/robots.txt', 'Falta anunciar el sitemap de producción');
if (fs.existsSync(path.join(root, '__portfolio-qa.html'))) issue('/__portfolio-qa.html', 'La herramienta de QA no debe publicarse');
const report = { generatedAt: new Date().toISOString(), origin, htmlPages: htmlFiles.length, indexablePages: pages.length, localReferences: references, sitemapUrls, issues, pages };
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/nubicore-seo-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
