import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourceFiles = ['data/caleta-core.json', 'data/caleta-peripherals.json'];
const officialFiles = ['data/official-core.json', 'data/official-peripherals.json'];
const caletaCopyFile = 'data/caleta-descriptions.json';
const catalogPath = resolve(root, 'src/data/nodoPcCatalog.json');
const seedPath = resolve(root, 'supabase/seed_nodo_pc.sql');
const verifiedOnly = process.argv.includes('--verified-only');
const categoryBySource = { cpu: 'cpu', mbb: 'board', ram: 'ram', disco: 'ssd', video: 'gpu', case: 'case', fuente: 'power', ref: 'cooling', teclado: 'keyboard', mouse: 'mouse', audi: 'headset', parlante: 'speaker' };
const typeByCategory = { cpu: 'Procesador', board: 'Placa madre', ram: 'Memoria RAM', ssd: 'Almacenamiento', gpu: 'Tarjeta gráfica', case: 'Case', power: 'Fuente de poder', cooling: 'Refrigeración', keyboard: 'Teclado', mouse: 'Mouse', headset: 'Audífonos', speaker: 'Parlante' };
const categoryOverrides = { 'caleta-9012': 'headset', 'caleta-9338': 'cooling' };
const offCategoryIds = new Set(['caleta-10023', 'caleta-7504', 'caleta-8669', 'caleta-10108']);
const featuredIds = [
  'caleta-8731', 'caleta-6718', 'caleta-9763', 'caleta-10635',
  'caleta-8145', 'caleta-8870', 'caleta-7903', 'caleta-7044',
  'caleta-8680', 'caleta-6506', 'caleta-9979', 'caleta-6080',
];
const showcaseCategories = ['gpu', 'cpu', 'board', 'ram', 'ssd', 'case', 'power', 'cooling', 'keyboard', 'mouse', 'headset', 'speaker'];
const officialImageHosts = new Set([
  'dlcdnwebimgs.asus.com', 'www.amd.com', 'webapi3.adata.com', 'lian-li.com',
  'cdn.deepcool.com', 'resource.logitechg.com', 'resource.logitech.com',
  'assets2.razerzone.com', 'assets3.razerzone.com', 'redragon.es', 'redragonshop.com',
]);

async function readOptional(path) {
  try {
    return JSON.parse(await readFile(resolve(root, path), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

const sourceDocuments = (await Promise.all(sourceFiles.map(async (path) => {
  const document = await readOptional(path);
  if (!document) return null;
  if (!Array.isArray(document)) return document;
  const file = await stat(resolve(root, path));
  return { products: document, captured_at: file.mtime.toISOString() };
}))).filter(Boolean);
if (!sourceDocuments.length) throw new Error('No hay capturas de Caleta para preparar el catálogo.');
const caletaCopy = await readOptional(caletaCopyFile) ?? {};

const enrichments = new Map();
for (const document of (await Promise.all(officialFiles.map(readOptional))).filter(Boolean)) {
  const rows = Array.isArray(document) ? document : Array.isArray(document.products) ? document.products : Object.entries(document).map(([id, value]) => ({ id, ...value }));
  for (const row of rows) if (row?.id) enrichments.set(row.id, row);
}

const brandNames = [
  ['AMD', /\b(?:AMD|RYZEN|RADEON)\b/i], ['INTEL', /\b(?:INTEL|CORE ULTRA|CORE I[3579])\b/i],
  ['ASUS', /\b(?:ASUS|ROG|TUF GAMING)\b/i], ['MSI', /\bMSI\b/i], ['GIGABYTE', /\bGIGABYTE\b/i],
  ['ASROCK', /\bASROCK\b/i], ['KINGSTON', /\bKINGSTON\b/i], ['XPG', /\bXPG\b/i],
  ['ADATA', /\bADATA\b/i], ['CORSAIR', /\bCORSAIR\b/i], ['SAMSUNG', /\bSAMSUNG\b/i],
  ['WESTERN DIGITAL', /\b(?:WD|WESTERN DIGITAL|WESTER DIGITAL)\b/i], ['CRUCIAL', /\bCRUCIAL\b/i],
  ['PATRIOT', /\bPATRIOT\b/i], ['TEAMGROUP', /\b(?:TEAMGROUP|T-FORCE)\b/i],
  ['ZOTAC', /\bZOTAC\b/i], ['PALIT', /\bPALIT\b/i], ['GALAX', /\bGALAX\b/i],
  ['INNO3D', /\bINNO3D\b/i], ['SAPPHIRE', /\bSAPPHIRE\b/i], ['POWERCOLOR', /\bPOWERCOLOR\b/i],
  ['PNY', /\bPNY\b/i], ['XFX', /\bXFX\b/i], ['BIOSTAR', /\bBIOSTAR\b/i],
  ['HIKSEMI', /\bHIKSEMI\b/i], ['BIWIN', /\bBIWIN\b/i], ['DATO', /\bDATO\b/i],
  ['HYUNDAI', /\bHYUNDAI\b/i], ['HP', /\bHP\b/i], ['LG', /\bLG\b/i],
  ['DEEPCOOL', /\b(?:DEEPCOOL|DEEP COOL)\b/i], ['COOLER MASTER', /\bCOOLER\s*MASTER\b/i],
  ['THERMALTAKE', /\bTHERMALTAKE\b/i], ['LIAN LI', /\bLIAN\s*LI\b/i], ['MONTECH', /\bMONTECH\b/i],
  ['ANTEC', /\bANTEC\b/i], ['COUGAR', /\bCOUGAR\b/i], ['ENKORE', /\bENKORE\b/i],
  ['DATAONE', /\bDATAONE\b/i], ['CYBERTEL', /\bCYBERTEL\b/i], ['BOETEC', /\bBOETEC\b/i],
  ['LOGITECH', /\bLOGITECH\b/i], ['RAZER', /\bRAZER\b/i],
  ['REDRAGON', /\bREDRAGON\b/i], ['HYPERX', /\bHYPERX\b/i], ['FANTECH', /\bFANTECH\b/i],
  ['HAVIT', /\bHAVIT\b/i], ['TEROS', /\bTEROS\b/i], ['ANTRYX', /\bANTRYX\b/i],
  ['MICRONICS', /\bMICRONICS\b/i], ['HALION', /\bHALION\b/i], ['1STPLAYER', /\b1STPLAYER\b/i],
];

function inferBrand(name) {
  return brandNames.find(([, pattern]) => pattern.test(name))?.[0] ?? null;
}

function officialLink(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function officialImageLink(value) {
  const link = officialLink(value);
  return link && officialImageHosts.has(new URL(link).hostname) ? link : null;
}

const titleAcronyms = new Set([
  'AMD', 'ASUS', 'MSI', 'XPG', 'ADATA', 'HP', 'LG', 'WD', 'UE', 'ROG', 'TUF',
  'RGB', 'ARGB', 'DDR', 'GDDR', 'SSD', 'NVME', 'SATA', 'USB', 'PC', 'PCI', 'PCIE',
  'DPI', 'FPS', 'BT', 'OEM', 'OC', 'ATX', 'MATX', 'ITX', 'TKL', 'HDMI', 'DP',
  'AM', 'LGA', 'PS', 'RTX', 'GTX', 'RX', 'XT', 'MB', 'GB', 'TB', 'W', 'HZ', 'MHZ',
  'GHZ', 'SODIMM', 'M', 'AIO', 'LCD', 'LED', 'IPS', 'VA', 'PWM', 'IP', 'TBW',
]);
const titleLowercase = new Set([
  'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'E', 'CON', 'SIN', 'EN', 'PARA',
  'POR', 'HASTA', 'SOCKET', 'GAMER', 'OFICINA', 'MECANICO', 'MECÁNICO', 'OPTICO',
  'ÓPTICO', 'AIRE', 'LIQUIDA', 'LÍQUIDA', 'NEGRO', 'NEGRA', 'BLANCO', 'BLANCA',
  'AZUL', 'ROJO', 'ROJA', 'ROSADO', 'ROSADA', 'COOLER', 'VENTILADOR',
]);
const titleTranslations = { BLACK: 'negro', WHITE: 'blanco', BLUE: 'azul', PINK: 'rosado', WIRELESS: 'inalámbrico', WIRED: 'con cable' };

function readableCaletaName(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\b(?:RMA|GPR|GRP)\s*-?\s*\d+(?:\s*\/\s*\d+)?\b/gi, '')
    .replace(/\bSOLO(?:\s+EN)?\s+PC\b/gi, '')
    .replace(/\bS\/COOLER\b/gi, 'sin cooler')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:GB|TB|MB|MHZ|GHZ|DPI)\b/gi, (match) => match.replace(/(\d)(GB|TB|MB|MHZ|GHZ|DPI)$/i, '$1 $2'))
    .replace(/\b(GHZ|Ghz|ghz)\b/g, 'GHz')
    .replace(/\b(MHZ|Mhz|mhz)\b/g, 'MHz')
    .replace(/\b[\p{L}]+\b/gu, (word) => {
      if (word !== word.toUpperCase()) return word;
      const upper = word.toUpperCase();
      if (titleTranslations[upper]) return titleTranslations[upper];
      if (titleAcronyms.has(upper)) return upper;
      if (titleLowercase.has(upper)) return upper.toLocaleLowerCase('es');
      return upper[0] + upper.slice(1).toLocaleLowerCase('es');
    })
    .replace(/,(?!\d)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')
    .trim();
}

// Las fichas públicas de Caleta consultadas no incluyen un párrafo descriptivo.
// Conservamos únicamente los atributos que aparecen en el nombre de su ficha.
function caletaTitleDescription(item, category) {
  const name = String(item.name ?? '').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim().replace(/[.\s]+$/, '');
  if (!name) return null;
  const prefixes = {
    cpu: /^PROCESADOR\b[\s,.:;-]*/i,
    board: /^(?:MBB|PLACA(?:\s+MADRE)?)\b[\s,.:;-]*/i,
    ram: /^(?:MEMORIA(?:\s+RAM)?|RAM)\b[\s,.:;-]*/i,
    ssd: /^(?:SSD(?:\s+NVME)?|DISCO(?:\s+(?:DURO|SOLIDO|SÓLIDO))?)\b[\s,.:;-]*/i,
    gpu: /^(?:TARJETA(?:\s+DE)?\s+(?:VIDEO|GR[ÁA]FICA)|VGA)\b[\s,.:;-]*/i,
    case: /^(?:CASE|GABINETE)\b[\s,.:;-]*/i,
    power: /^(?:FUENTE(?:\s+DE\s+PODER)?)\b[\s,.:;-]*/i,
    cooling: /^(?:REFRIGERACI[ÓO]N|COOLER|FAN|VENTILADOR)\b[\s,.:;-]*/i,
    keyboard: /^(?:TECLADO(?:\s+(?:GAMER|MEC[ÁA]NICO|OFICINA))?)\b[\s,.:;-]*/i,
    mouse: /^(?:MOUSE(?:\s+(?:GAMER|GAMING))?)\b[\s,.:;-]*/i,
    headset: /^(?:AUD[IÍ]FONOS?(?:\s+(?:GAMER|C\/MICROF))?)\b[\s,.:;-]*/i,
    speaker: /^(?:PARLANTE(?:S)?)\b[\s,.:;-]*/i,
  };
  const tail = name.replace(prefixes[category] ?? /^$^/, '').replace(/^[\s,.:;-]+/, '');
  const title = readableCaletaName(tail);
  if (!title) return null;
  if (/^(?:KIT|COMBO)\b/i.test(title)) return `${title}.`;
  const subject = category === 'ssd' ? 'SSD' : typeByCategory[category] || 'Producto';
  return `${subject} ${title}.`;
}

const seen = new Set();
const catalog = sourceDocuments.flatMap((document) => (Array.isArray(document) ? document : document.products ?? []).map((item) => {
  if (seen.has(item.source_sku)) return null;
  seen.add(item.source_sku);
  const official = enrichments.get(item.id) ?? {};
  const officialUrl = officialLink(official.official_url);
  const imageUrl = officialUrl ? officialImageLink(official.official_image_url) : null;
  const price = Number(item.price_pen);
  const priceNeedsReview = Boolean(item.price_needs_review) || !Number.isFinite(price) || price <= 0;
  const category = categoryOverrides[item.id] || item.category || categoryBySource[item.source_category];
  const description = String(item.description || caletaCopy[item.id] || caletaTitleDescription(item, category) || '').trim() || null;
  const verified = Boolean(officialUrl && imageUrl && description);
  return {
    id: item.id,
    source_sku: String(item.source_sku),
    source_category: item.source_category,
    category,
    name: item.name,
    brand: official.brand || item.brand || inferBrand(item.name),
    type: categoryOverrides[item.id] ? typeByCategory[category] : item.type || typeByCategory[category] || 'Componente',
    detail: null,
    description,
    price_pen: priceNeedsReview ? null : price,
    stock_text: item.stock_text ?? item.stock_label ?? null,
    stock_quantity: Number.isInteger(item.stock_quantity) ? item.stock_quantity : /^\d+$/.test(item.stock_label ?? '') ? Number(item.stock_label) : null,
    source_url: item.source_url,
    official_url: officialUrl,
    official_image_url: imageUrl,
    specs: {},
    tag: item.tag ?? null,
    label: item.label ?? null,
    published: !priceNeedsReview && !offCategoryIds.has(item.id) && (!verifiedOnly || verified),
    sort_order: item.sort_order ?? 0,
    price_needs_review: priceNeedsReview,
    captured_at: document.captured_at ?? new Date().toISOString(),
  };
})).filter(Boolean);

const sourcePosition = new Map(catalog.map((row, index) => [row.id, index]));
const showcaseIds = [...featuredIds];
for (const category of showcaseCategories) {
  const second = catalog.filter((row) => row.published && row.category === category && !showcaseIds.includes(row.id))
    .sort((a, b) => Number(Boolean(b.official_image_url)) - Number(Boolean(a.official_image_url)) || sourcePosition.get(a.id) - sourcePosition.get(b.id))[0];
  if (second) showcaseIds.push(second.id);
}
const showcasePosition = new Map(showcaseIds.map((id, index) => [id, index]));
catalog.sort((a, b) => (showcasePosition.get(a.id) ?? showcaseIds.length) - (showcasePosition.get(b.id) ?? showcaseIds.length)
  || sourcePosition.get(a.id) - sourcePosition.get(b.id));
catalog.forEach((row, index) => { row.sort_order = index + 1; });

await mkdir(dirname(catalogPath), { recursive: true });
await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

const columns = [
  ['id', 'text'], ['source_sku', 'text'], ['source_category', 'text'], ['category', 'text'],
  ['name', 'text'], ['brand', 'text'], ['type', 'text'], ['detail', 'text'], ['description', 'text'],
  ['price_pen', 'numeric'], ['stock_text', 'text'], ['stock_quantity', 'integer'],
  ['source_url', 'text'], ['official_url', 'text'], ['official_image_url', 'text'],
  ['specs', 'jsonb'], ['tag', 'text'], ['label', 'text'], ['published', 'boolean'],
  ['sort_order', 'integer'], ['price_needs_review', 'boolean'], ['captured_at', 'timestamptz'],
];
const names = columns.map(([name]) => name).join(', ');
const types = columns.map(([name, type]) => `${name} ${type}`).join(', ');
const chunks = [];
for (let index = 0; index < catalog.length; index += 80) {
  const rows = catalog.slice(index, index + 80);
  const literal = JSON.stringify(rows);
  chunks.push(`insert into public.nodo_pc_products (${names})\nselect ${names}\nfrom jsonb_to_recordset($catalog$${literal}$catalog$::jsonb) as incoming(${types})\non conflict (id) do update set\n  ${columns.filter(([name]) => name !== 'id').map(([name]) => `${name} = excluded.${name}`).join(',\n  ')},\n  updated_at = now();`);
}
await writeFile(seedPath, `-- Catálogo de referencia Caleta con descripciones derivadas de sus fichas.\n-- Las imágenes enlazadas provienen solo de páginas oficiales de las marcas.\n-- Ejecuta primero schema.sql. Los precios sospechosos se conservan sin publicar.\n\n${chunks.join('\n\n')}\n`, 'utf8');

const published = catalog.filter((row) => row.published).length;
const verified = catalog.filter((row) => row.official_image_url && row.description).length;
console.log(`Catálogo: ${catalog.length} registros; ${published} publicables; ${catalog.filter((row) => row.description).length} con descripción de Caleta; ${verified} con imagen oficial.`);
console.log(`Archivos: ${catalogPath}, ${seedPath}`);
