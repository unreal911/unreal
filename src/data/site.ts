export const site = {
  name: 'Código Impulso',
  fullName: 'Milton Blaise Cañari Oscco',
  founderName: 'Milton Blaise',
  monogram: 'ci',
  role: 'Estudio de diseño y desarrollo web',
  tagline: 'La web para el siguiente paso de tu negocio.',
  title: 'Diseño y desarrollo web para empresas | Código Impulso',
  location: 'Perú · Disponible en remoto',
  whatsapp: 'https://wa.me/51980904787',
  whatsappLabel: '+51 980 904 787',
  description:
    'Diseño y desarrollo web a medida para emprendimientos, mypes, pymes y empresas. Landing pages, webs corporativas y catálogos digitales desde Perú.',
  contactMessage: 'Hola, Código Impulso. Quiero conversar sobre una web para mi negocio.',
};

export function createContactUrl(message: string = site.contactMessage) {
  const url = new URL(site.whatsapp);
  url.searchParams.set('text', message);
  return url.toString();
}

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  number: string;
  summary: string;
  challenge: string;
  approach: string;
  outcome: string;
  services: string[];
  palette: string;
  artwork: 'cafe' | 'beauty' | 'digital' | 'pc' | 'fashion';
  coverUrl?: string | null;
  externalUrl?: string | null;
  sortOrder: number;
};

// Casos conceptuales para mostrar la dirección del portafolio hasta añadir proyectos reales.
export const sampleProjects: Project[] = [
  {
    slug: 'senda-cafe',
    title: 'Senda Café',
    subtitle: 'Un ritual con carácter.',
    category: 'Identidad & experiencia web',
    year: '2026',
    number: '01',
    summary:
      'Una experiencia web conceptual para una cafetería de especialidad, con fotografía, carta filtrable y una invitación a conocer su espacio.',
    challenge:
      'Imaginar una presencia digital cálida y reconocible que conecte el producto, el origen del café y la experiencia de visitar Senda.',
    approach:
      'Combinamos una portada fotográfica, composiciones editoriales y movimiento para presentar la esencia de Senda, sus favoritos y el proceso del café. La carta por categorías y la galería permiten explorar el producto y el ambiente.',
    outcome:
      'El visitante puede filtrar la carta, ampliar las fotografías del espacio, conocer el origen del café y probar una reserva de demostración desde cualquier pantalla.',
    services: ['Dirección visual', 'Diseño web', 'Desarrollo front-end'],
    palette: 'Espresso / Crema / Cobre',
    artwork: 'cafe',
    sortOrder: 1,
  },
  {
    slug: 'lume-beauty',
    title: 'Lumé Beauty',
    subtitle: 'Belleza en su propia luz.',
    category: 'Landing page & dirección de arte',
    year: '2026',
    number: '02',
    summary:
      'Una landing de belleza que equilibra una estética delicada con mensajes claros y una experiencia de compra fluida.',
    challenge:
      'Presentar una línea de cuidado personal con una personalidad contemporánea y un recorrido que explique sus beneficios con claridad.',
    approach:
      'Diseñamos un universo visual suave pero expresivo: titulares elegantes, producto en primer plano, espacios amplios y llamadas a la acción precisas.',
    outcome:
      'Una página de ejemplo que permite conocer el sérum, entender sus beneficios y consultar cómo usarlo.',
    services: ['Dirección de arte', 'UI/UX', 'Desarrollo front-end'],
    palette: 'Lavanda / Marfil / Ciruela',
    artwork: 'beauty',
    sortOrder: 2,
  },
  {
    slug: 'nexa-digital',
    title: 'Nexa Digital',
    subtitle: 'Ideas hechas para avanzar.',
    category: 'Sitio web & sistema visual',
    year: '2026',
    number: '03',
    summary:
      'Una identidad digital con presencia audaz para un estudio creativo que conecta estrategia, diseño y tecnología.',
    challenge:
      'Dar forma a una marca digital flexible, capaz de comunicar servicios distintos sin perder una voz visual clara.',
    approach:
      'Usamos una grilla modular, contrastes fuertes y movimiento funcional para ordenar el contenido y hacer tangible la energía del estudio.',
    outcome:
      'Una página que reúne los servicios y los trabajos del estudio, con un acceso claro al contacto.',
    services: ['Estrategia visual', 'Diseño web', 'Desarrollo front-end'],
    palette: 'Azul eléctrico / Negro / Plata',
    artwork: 'digital',
    sortOrder: 3,
  },
  {
    slug: 'nodo-pc',
    title: 'Nodo PC',
    subtitle: 'El siguiente nivel se arma pieza a pieza.',
    category: 'Tienda de pedidos & configurador de PC',
    year: '2026',
    number: '04',
    summary:
      'Una tienda de hardware diseñada alrededor de una decisión: elegir una pieza o construir el equipo completo. Catálogo, configurador y pedido comparten una misma experiencia.',
    challenge:
      'El hardware exige comparar modelos, entender qué falta y revisar el presupuesto. El reto era ordenar esa información para quien busca un componente y para quien empieza a armar su primera PC.',
    approach:
      'Separamos la exploración por pieza del armado completo, dimos prioridad a categoría, descripción y precio, y mantuvimos la selección a un paso. Una paleta de grafito, blanco y rojo pone el hardware en primer plano.',
    outcome:
      'Una tienda de ejemplo donde puedes buscar piezas, armar una computadora y revisar el pedido antes de pedir una cotización por WhatsApp. Los precios son de referencia: antes de comprar, la tienda tendría que confirmar que las piezas funcionan juntas, que están disponibles y cómo realizar el pago.',
    services: ['Arquitectura de catálogo', 'Diseño UI/UX', 'Desarrollo front-end'],
    palette: 'Grafito / Blanco / Rojo',
    artwork: 'pc',
    sortOrder: 4,
  },
  {
    slug: 'trama-mayorista',
    title: 'Trama Mayorista',
    subtitle: 'Buenas prendas. Grandes oportunidades.',
    category: 'Tienda de ropa al por mayor',
    year: '2026',
    number: '05',
    summary:
      'Una tienda conceptual de ropa al por mayor que reúne un catálogo por categorías, precios por volumen y un pedido fácil de revisar.',
    challenge:
      'Comprar para un negocio requiere elegir prendas, comparar precios según la cantidad y entender el mínimo de compra. El reto era hacer visible esa información sin interrumpir la exploración del catálogo.',
    approach:
      'Combinamos una dirección editorial en blanco y naranja, con detalles en carbón y temas claro y oscuro, filtros de catálogo y un pedido editable. Las prendas se agregan en bloques de seis unidades y el precio se ajusta al volumen total seleccionado.',
    outcome:
      'Una demo donde puedes filtrar prendas, preparar un pedido desde seis unidades, ajustar cantidades en bloques de seis y copiar su resumen. Los tramos de 6–23, 24–47 y 48 o más unidades permiten explorar los precios por volumen; el pedido es de demostración y no genera una compra real.',
    services: ['Arquitectura de catálogo', 'Diseño de tienda', 'Desarrollo front-end'],
    palette: 'Blanco / Naranja / Carbón',
    artwork: 'fashion',
    sortOrder: 5,
  },
];
