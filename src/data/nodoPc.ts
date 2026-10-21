import catalogRows from './nodoPcCatalog.json';

// The local inventory is the same Caleta snapshot used by the catalog and detail pages.
// Keeping this mapping shared prevents sample products from appearing before hydration.
export const products = catalogRows.filter((row) => row.published !== false).map((row) => ({
  id: row.id,
  name: row.name,
  brand: row.brand || '',
  type: row.type || 'Componente',
  category: row.category,
  detail: row.detail || row.description || '',
  description: row.description || '',
  price: row.price_pen == null ? null : Number(row.price_pen),
  priceNeedsReview: row.price_needs_review === true || row.price_pen == null || Number(row.price_pen) === 0,
  stockText: row.stock_text || '',
  stockQuantity: row.stock_quantity,
  tag: row.tag || '',
  label: row.label || row.brand || row.category.toUpperCase(),
  sourceUrl: row.source_url || null,
  officialUrl: row.official_url || null,
  officialImageUrl: row.official_image_url || null,
  specs: row.specs || {},
  sortOrder: row.sort_order || 0,
  capturedAt: row.captured_at || null,
}));
export const categories = [
  { id: 'all', label: 'Todo el hardware' }, { id: 'gpu', label: 'Gráficas' }, { id: 'cpu', label: 'Procesadores' },
  { id: 'ram', label: 'Memoria' }, { id: 'ssd', label: 'Almacenamiento' }, { id: 'board', label: 'Placas madre' },
  { id: 'power', label: 'Fuentes' }, { id: 'case', label: 'Cases' }, { id: 'cooling', label: 'Refrigeración' },
  { id: 'keyboard', label: 'Teclados' }, { id: 'mouse', label: 'Mouse' }, { id: 'headset', label: 'Audífonos y audio' },
  { id: 'speaker', label: 'Parlantes' },
];
export const caletaCategoryMap: Record<string, string> = {
  cpu: 'cpu', mbb: 'board', ram: 'ram', disco: 'ssd', video: 'gpu', case: 'case',
  fuente: 'power', ref: 'cooling', teclado: 'keyboard', mouse: 'mouse', audi: 'headset', parlante: 'speaker',
};
export const builderGroups = [
  { category: 'cpu', label: 'El cerebro', type: 'Procesador', tip: 'Define el ritmo de tu equipo.' },
  { category: 'gpu', label: 'Lo que ves', type: 'Tarjeta gráfica', tip: 'Elige según lo que juegas o creas.' },
  { category: 'ram', label: 'Sin pausas', type: 'Memoria RAM', tip: 'Más memoria para hacer más a la vez.' },
  { category: 'ssd', label: 'Tu espacio', type: 'Almacenamiento', tip: 'Guarda tus juegos y proyectos.' },
  { category: 'board', label: 'El punto de encuentro', type: 'Placa madre', tip: 'Base AM5 y DDR5 para esta selección.' },
  { category: 'power', label: 'Energía estable', type: 'Fuente de poder', tip: 'Dale a tus componentes el margen necesario.' },
  { category: 'case', label: 'Su personalidad', type: 'Case', tip: 'Elige el acabado que va contigo.' },
  { category: 'cooling', label: 'Mantén la calma', type: 'Refrigeración', tip: 'Aire o líquida, según tu armado.' },
];
export const presets = [
  { id: 'essential', name: 'Esencial', label: '01 / EL PUNTO DE PARTIDA', use: 'Una base para trabajo, estudio y juego.', note: 'Ryzen 5 8500G · RTX 5060 · DDR5', ids: ['caleta-6718', 'caleta-8731', 'caleta-10498', 'caleta-8145', 'caleta-9763', 'caleta-10398', 'caleta-8870', 'caleta-7044'] },
  { id: 'gaming', name: 'Gaming', label: '02 / SUBE DE NIVEL', use: 'Más rendimiento para tus juegos favoritos.', note: 'Ryzen 7 7800X3D · RTX 5070 · DDR5', ids: ['caleta-10357', 'caleta-8190', 'caleta-9971', 'caleta-8145', 'caleta-9763', 'caleta-9742', 'caleta-8870', 'caleta-7044'] },
  { id: 'creator', name: 'Creator', label: '03 / HAZ MÁS', use: 'Espacio para editar, diseñar y crear.', note: 'Ryzen 7 7800X3D · 32 GB · SSD 2 TB', ids: ['caleta-10357', 'caleta-8190', 'caleta-9971', 'caleta-10239', 'caleta-9763', 'caleta-9742', 'caleta-7365', 'caleta-8856'] },
];
export const money = (amount: number) => `S/ ${amount.toLocaleString('es-PE')}`;
export const presetTotal = (ids: string[]) => ids.reduce((total, id) => total + (products.find((product) => product.id === id)?.price || 0), 0);
export const defaultPreset = presets[1];
