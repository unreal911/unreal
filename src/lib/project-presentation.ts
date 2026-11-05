import { site, type Project } from '../data/site';

const examples: Record<string, { category: string; shortCategory: string; description: string; overview: string; seoTitle: string; seoDescription: string; features: { title: string; description: string }[] }> = {
  'senda-cafe': {
    category: 'Página para una cafetería',
    shortCategory: 'Cafetería',
    seoTitle: 'Senda Café: diseño web para cafetería',
    description: 'Una cafetería conceptual con carta filtrable, historia del café, galería del espacio y reserva de demostración.',
    seoDescription: `Diseño web conceptual para Senda Café: carta por categorías, galería y reserva de muestra. Un proyecto de ${site.name}.`,
    overview: 'La carta, el ambiente y la información para una visita, reunidos en una misma página.',
    features: [
      { title: 'Elegir qué tomar', description: 'Especialidades y carta con precios, organizada en cafés, bebidas frías y opciones de cocina.' },
      { title: 'Conocer Senda', description: 'La historia, el origen del café y fotografías del espacio que se pueden ampliar.' },
      { title: 'Planear una visita', description: 'Horarios, ubicación de referencia y un formulario para probar cómo sería reservar una mesa.' },
    ],
  },
  'lume-beauty': {
    category: 'Página para un producto de belleza',
    shortCategory: 'Belleza',
    seoTitle: 'Lumé Beauty: landing page de belleza',
    description: 'Un sérum presentado con sus beneficios, uso y rutina de cuidado.',
    seoDescription: `Landing page conceptual de Lumé Beauty: presentación del sérum, beneficios y rutina de cuidado. Diseño y desarrollo de ${site.name}.`,
    overview: 'Una presentación que acompaña las preguntas que surgen al conocer un producto de cuidado personal.',
    features: [
      { title: 'Conocer el producto', description: 'El sérum ocupa el centro de la página, acompañado de su presentación y sus características.' },
      { title: 'Entender su propuesta', description: 'La información del producto se reparte en secciones breves para explorarla con calma.' },
      { title: 'Saber cómo usarlo', description: 'Una rutina de cuidado explica dónde encaja el producto y cómo incorporarlo.' },
    ],
  },
  'nexa-digital': {
    category: 'Página para un estudio creativo',
    shortCategory: 'Estudio creativo',
    seoTitle: 'Nexa Digital: web para estudio creativo',
    description: 'Servicios, trabajos y contacto para un estudio creativo.',
    seoDescription: `Web conceptual de Nexa Digital: servicios, proyectos y contacto para un estudio creativo. Diseño y desarrollo web de ${site.name}.`,
    overview: 'Servicios, ejemplos de trabajo y una forma de contactar con el estudio, en un recorrido fácil de seguir.',
    features: [
      { title: 'Encontrar un servicio', description: 'Las áreas de trabajo del estudio se presentan por separado para entender qué ofrece.' },
      { title: 'Ver su trabajo', description: 'Una selección de proyectos permite conocer el estilo y las propuestas del estudio.' },
      { title: 'Iniciar una conversación', description: 'El acceso a WhatsApp permite conversar con Nubicore sobre una web como esta.' },
    ],
  },
  'nodo-pc': {
    category: 'Tienda de piezas para computadoras',
    shortCategory: 'Tienda de tecnología',
    seoTitle: 'Nodo PC: catálogo y configurador web',
    description: 'Una tienda para explorar componentes, armar tu PC y revisar el pedido.',
    seoDescription: `Catálogo conceptual de Nodo PC con filtros, configurador de computadoras y selección por WhatsApp. Un proyecto web de ${site.name}.`,
    overview: 'Dos formas de empezar: buscar una pieza concreta o elegir los componentes de una computadora completa.',
    features: [
      { title: 'Encontrar una pieza', description: 'Búsqueda y filtros por categoría para revisar productos, sus características y precios de referencia.' },
      { title: 'Preparar un equipo', description: 'Un recorrido por componentes permite elegir las piezas y consultar el total estimado.' },
      { title: 'Revisar la selección', description: 'Los productos elegidos se reúnen en un resumen para ajustar cantidades antes de preparar una consulta.' },
    ],
  },
  'trama-mayorista': {
    category: 'Tienda de ropa al por mayor',
    shortCategory: 'Ropa al por mayor',
    seoTitle: 'Trama Mayorista: catálogo de ropa',
    description: 'Una tienda de ejemplo para explorar prendas, combinar tallas y colores y preparar un pedido desde seis unidades en total.',
    seoDescription: `Catálogo conceptual de Trama Mayorista: prendas, precios por volumen y pedidos de muestra desde seis unidades. Un proyecto de ${site.name}.`,
    overview: 'Un recorrido pensado para elegir prendas y entender las condiciones de compra al por mayor.',
    features: [
      { title: 'Explorar las prendas', description: 'Un catálogo con fotografías y filtros por categoría para encontrar los modelos.' },
      { title: 'Combinar tallas y colores', description: 'Elige un color e indica las cantidades por talla. Puedes reunir varias combinaciones antes de añadirlas al pedido.' },
      { title: 'Preparar el pedido', description: 'Ajusta cada variante por unidad y revisa el precio por volumen. Desde seis prendas en total, puedes copiar el resumen.' },
    ],
  },
};

export function getProjectPresentation(project: Project) {
  const example = examples[project.slug];

  return {
    category: example?.category ?? 'Página web',
    shortCategory: example?.shortCategory ?? 'Página web',
    seoTitle: example?.seoTitle ?? `${project.title}: página web`,
    description: example?.description ?? project.summary,
    overview: example?.overview ?? project.summary,
    seoDescription: example?.seoDescription ?? project.summary,
    features: example?.features ?? project.services.map((title) => ({ title, description: '' })),
    demoUrl: example ? `/demos/${project.slug}/` : project.externalUrl,
    isExample: Boolean(example),
  };
}
