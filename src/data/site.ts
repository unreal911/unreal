export const site = {
  name: 'Milton Blaise',
  fullName: 'Milton Blaise Cañari Oscco',
  role: 'Diseñador y desarrollador web',
  location: 'Perú · Disponible en remoto',
  whatsapp: 'https://wa.me/51980904787',
  whatsappLabel: '+51 980 904 787',
  description:
    'Diseño y desarrollo sitios web con identidad, intención y movimiento. Portafolio de Milton Blaise Cañari Oscco.',
};

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
  artwork: 'cafe' | 'beauty' | 'digital';
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
      'Una experiencia digital para una marca de café de especialidad que convierte cada visita en una pausa sensorial.',
    challenge:
      'Construir una presencia digital cálida y reconocible para un café que quería mostrar su origen, su producto y su forma de ver las pequeñas pausas.',
    approach:
      'Combiné una estructura editorial, una paleta inspirada en el café tostado y una navegación sencilla. La tipografía y el ritmo visual hacen que el producto sea protagonista.',
    outcome:
      'Un concepto de sitio que presenta la marca, el menú y su historia con una identidad consistente en cada pantalla.',
    services: ['Dirección visual', 'Diseño web', 'Desarrollo front-end'],
    palette: 'Cacao / Crema / Terracota',
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
      'Diseñé un universo visual suave pero expresivo: titulares elegantes, producto en primer plano, espacios amplios y llamadas a la acción precisas.',
    outcome:
      'Un concepto de landing page preparado para contar el producto desde la primera impresión hasta el contacto final.',
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
      'Usé una grilla modular, contrastes fuertes y movimiento funcional para ordenar el contenido y hacer tangible la energía del estudio.',
    outcome:
      'Un concepto de plataforma que deja crecer el portafolio y los servicios dentro de un mismo lenguaje visual.',
    services: ['Estrategia visual', 'Diseño web', 'Desarrollo front-end'],
    palette: 'Azul eléctrico / Negro / Plata',
    artwork: 'digital',
    sortOrder: 3,
  },
];
