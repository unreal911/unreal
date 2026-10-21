import type { Project } from '../data/site';

const examples: Record<string, { category: string; shortCategory: string; description: string; features: string[] }> = {
  'senda-cafe': {
    category: 'Página para una cafetería',
    shortCategory: 'Cafetería',
    description: 'Una cafetería conceptual con carta filtrable, historia del café, galería del espacio y reserva de demostración.',
    features: ['Carta por categorías y favoritos', 'Historia, origen y galería del espacio', 'Horarios y reserva de demostración'],
  },
  'lume-beauty': {
    category: 'Página para un producto de belleza',
    shortCategory: 'Belleza',
    description: 'Un sérum presentado con sus beneficios, uso y rutina de cuidado.',
    features: ['Presentación del producto', 'Beneficios y uso', 'Rutina de cuidado'],
  },
  'nexa-digital': {
    category: 'Página para un estudio creativo',
    shortCategory: 'Estudio creativo',
    description: 'Servicios, trabajos y contacto para un estudio creativo.',
    features: ['Servicios del estudio', 'Galería de trabajos', 'Acceso al contacto'],
  },
  'nodo-pc': {
    category: 'Tienda de piezas para computadoras',
    shortCategory: 'Tienda de tecnología',
    description: 'Una tienda para explorar componentes, armar tu PC y revisar el pedido.',
    features: ['Catálogo con filtros', 'Armado de una computadora', 'Resumen del pedido'],
  },
  'trama-mayorista': {
    category: 'Tienda de ropa al por mayor',
    shortCategory: 'Ropa al por mayor',
    description: 'Una tienda de ejemplo para explorar prendas, comparar precios por volumen y preparar un pedido desde seis unidades.',
    features: ['Catálogo de prendas con filtros', 'Precios por volumen y cantidades editables', 'Resumen de pedido de demostración'],
  },
};

export function getProjectPresentation(project: Project) {
  const example = examples[project.slug];

  return {
    category: example?.category ?? 'Página web',
    shortCategory: example?.shortCategory ?? 'Página web',
    description: example?.description ?? project.summary,
    features: example?.features ?? [],
    demoUrl: example ? `/demos/${project.slug}/` : project.externalUrl,
    isExample: Boolean(example),
  };
}
