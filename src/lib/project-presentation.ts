import { site, type Project } from '../data/site';

const examples: Record<string, { category: string; shortCategory: string; description: string; seoTitle: string; seoDescription: string; features: string[] }> = {
  'senda-cafe': {
    category: 'Página para una cafetería',
    shortCategory: 'Cafetería',
    seoTitle: 'Senda Café: diseño web para cafetería',
    description: 'Una cafetería conceptual con carta filtrable, historia del café, galería del espacio y reserva de demostración.',
    seoDescription: `Diseño web conceptual para Senda Café: carta por categorías, galería y reserva de muestra. Un proyecto de ${site.name}.`,
    features: ['Carta por categorías y favoritos', 'Historia, origen y galería del espacio', 'Horarios y reserva de demostración'],
  },
  'lume-beauty': {
    category: 'Página para un producto de belleza',
    shortCategory: 'Belleza',
    seoTitle: 'Lumé Beauty: landing page de belleza',
    description: 'Un sérum presentado con sus beneficios, uso y rutina de cuidado.',
    seoDescription: `Landing page conceptual de Lumé Beauty: presentación del sérum, beneficios y rutina de cuidado. Diseño y desarrollo de ${site.name}.`,
    features: ['Presentación del producto', 'Beneficios y uso', 'Rutina de cuidado'],
  },
  'nexa-digital': {
    category: 'Página para un estudio creativo',
    shortCategory: 'Estudio creativo',
    seoTitle: 'Nexa Digital: web para estudio creativo',
    description: 'Servicios, trabajos y contacto para un estudio creativo.',
    seoDescription: `Web conceptual de Nexa Digital: servicios, proyectos y contacto para un estudio creativo. Diseño y desarrollo web de ${site.name}.`,
    features: ['Servicios del estudio', 'Galería de trabajos', 'Acceso al contacto'],
  },
  'nodo-pc': {
    category: 'Tienda de piezas para computadoras',
    shortCategory: 'Tienda de tecnología',
    seoTitle: 'Nodo PC: catálogo y configurador web',
    description: 'Una tienda para explorar componentes, armar tu PC y revisar el pedido.',
    seoDescription: `Catálogo conceptual de Nodo PC con filtros, configurador de computadoras y selección por WhatsApp. Un proyecto web de ${site.name}.`,
    features: ['Catálogo con filtros', 'Armado de una computadora', 'Resumen del pedido'],
  },
  'trama-mayorista': {
    category: 'Tienda de ropa al por mayor',
    shortCategory: 'Ropa al por mayor',
    seoTitle: 'Trama Mayorista: catálogo de ropa',
    description: 'Una tienda de ejemplo para explorar prendas, comparar precios por volumen y preparar un pedido desde seis unidades.',
    seoDescription: `Catálogo conceptual de Trama Mayorista: prendas, precios por volumen y pedidos de muestra desde seis unidades. Un proyecto de ${site.name}.`,
    features: ['Catálogo de prendas con filtros', 'Precios por volumen y cantidades editables', 'Resumen de pedido de demostración'],
  },
};

export function getProjectPresentation(project: Project) {
  const example = examples[project.slug];

  return {
    category: example?.category ?? 'Página web',
    shortCategory: example?.shortCategory ?? 'Página web',
    seoTitle: example?.seoTitle ?? `${project.title}: página web`,
    description: example?.description ?? project.summary,
    seoDescription: example?.seoDescription ?? project.summary,
    features: example?.features ?? [],
    demoUrl: example ? `/demos/${project.slug}/` : project.externalUrl,
    isExample: Boolean(example),
  };
}
