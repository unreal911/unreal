/**
 * Proceso de los casos conceptuales. Las preguntas representan hipótesis de
 * descubrimiento; no describen entrevistas con clientes reales.
 */
export type ProcessProjectSlug = 'senda-cafe' | 'lume-beauty' | 'nexa-digital';

export interface ProjectProcess {
  brief: {
    context: string;
    goal: string;
    audience: string;
    primaryAction: string;
  };
  discovery: {
    label: string;
    questions: string[];
  };
  sitemap: string[];
  wireframe: {
    idea: string;
    decisions: string[];
  };
  visual: {
    direction: string;
    decisions: string[];
    figmaUrl?: string;
  };
  responsive: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  implementation: string[];
}

export const processBySlug = {
  'senda-cafe': {
    brief: {
      context: 'Escenario conceptual: una cafetería de especialidad quiere mostrar el carácter de su marca y su carta.',
      goal: 'Convertir la visita en una invitación clara a conocer el café y su historia.',
      audience: 'Personas que buscan una pausa, una bebida concreta o una marca con la que conectar.',
      primaryAction: 'Explorar la carta.',
    },
    discovery: {
      label: 'Preguntas guía para este escenario, sin entrevistas reales',
      questions: [
        '¿Qué necesita saber alguien antes de elegir su café?',
        '¿Cómo contar el origen sin esconder la carta?',
        '¿Qué tono hace sentir cercana a la marca?',
      ],
    },
    sitemap: ['Portada', 'Nuestro ritual', 'La carta', 'Historia'],
    wireframe: {
      idea: 'Un recorrido breve que primero transmite atmósfera y luego permite ir directo al menú.',
      decisions: [
        'Poner “Ver la carta” en la primera pantalla.',
        'Separar bebidas y relato de marca para facilitar la exploración.',
        'Usar navegación numerada como índice de la experiencia.',
      ],
    },
    visual: {
      direction: 'Un cartel editorial cálido inspirado en el café tostado.',
      decisions: [
        'Crema, cacao y terracota construyen una atmósfera reconocible.',
        'Titulares amplios y una taza ilustrada dan protagonismo al ritual.',
      ],
    },
    responsive: {
      mobile: 'La navegación se desplaza horizontalmente y la portada prioriza título, carta y lectura cómoda.',
      tablet: 'La composición conserva el cartel visual con menos espacio entre contenido e ilustración.',
      desktop: 'La portada ocupa todo el ancho y la carta se presenta en una cuadrícula amplia.',
    },
    implementation: [
      'Demo navegable desarrollada con Astro y estilos responsivos.',
      'Entradas con GSAP para revelar secciones y bebidas durante el recorrido.',
      'Enlaces claros a la carta y a las demás secciones.',
    ],
  },
  'lume-beauty': {
    brief: {
      context: 'Escenario conceptual: una marca de cuidado personal presenta un sérum y una rutina sencilla.',
      goal: 'Explicar el producto con calma y claridad, sin promesas clínicas no sustentadas.',
      audience: 'Personas que quieren entender el producto y cómo integrarlo a su rutina.',
      primaryAction: 'Conocer el sérum y su ritual.',
    },
    discovery: {
      label: 'Preguntas guía para este escenario, sin entrevistas reales',
      questions: [
        '¿Qué dudas aparecen antes de probar un producto de cuidado personal?',
        '¿Cómo mostrar el modo de uso sin saturar la página?',
        '¿Qué detalles transmiten una sensación de calma y confianza?',
      ],
    },
    sitemap: ['Portada', 'Filosofía', 'El sérum', 'Ritual'],
    wireframe: {
      idea: 'Una secuencia editorial centrada en el producto: emoción, explicación y uso.',
      decisions: [
        'Situar el frasco en el centro de la primera pantalla.',
        'Dar una sección propia a beneficios narrativos y otra al ritual.',
        'Mantener las llamadas a la acción cerca del producto.',
      ],
    },
    visual: {
      direction: 'Un lenguaje suave y luminoso que acompaña el cuidado personal.',
      decisions: [
        'Lavanda, marfil y ciruela crean una composición armónica.',
        'Tipografía editorial, luz difusa y espacio libre dejan respirar el contenido.',
      ],
    },
    responsive: {
      mobile: 'La cabecera compacta deja visible el contacto y el producto se apila con texto legible.',
      tablet: 'La sección de producto pasa a una columna para mantener una lectura continua.',
      desktop: 'El producto domina la portada y la información se distribuye en bloques amplios.',
    },
    implementation: [
      'Demo navegable desarrollada con Astro y composición CSS del producto.',
      'Animaciones de entrada con GSAP al llegar a cada sección.',
      'Enlaces internos a filosofía, sérum y ritual.',
    ],
  },
  'nexa-digital': {
    brief: {
      context: 'Escenario conceptual: un estudio digital necesita comunicar estrategia, diseño y desarrollo bajo una identidad común.',
      goal: 'Ordenar servicios y proyectos para que el visitante entienda la oferta y encuentre cómo contactar.',
      audience: 'Equipos y marcas que evalúan un socio para crear o mejorar su presencia digital.',
      primaryAction: 'Ir a contacto después de revisar servicios y proyectos.',
    },
    discovery: {
      label: 'Preguntas guía para este escenario, sin entrevistas reales',
      questions: [
        '¿Qué servicio necesita entender primero un cliente potencial?',
        '¿Cómo mostrar proyectos diferentes sin perder unidad visual?',
        '¿Dónde debe aparecer el contacto durante la exploración?',
      ],
    },
    sitemap: ['Inicio', 'Servicios', 'Enfoque', 'Proyectos', 'Contacto'],
    wireframe: {
      idea: 'Una grilla modular que separa la propuesta, las capacidades y las muestras de trabajo.',
      decisions: [
        'Usar navegación lateral en escritorio para mantener el índice a la vista.',
        'Dar un bloque propio a cada servicio.',
        'Cerrar el recorrido con una invitación directa a conversar.',
      ],
    },
    visual: {
      direction: 'Identidad digital de alto contraste con ritmo tipográfico y acentos eléctricos.',
      decisions: [
        'Azul eléctrico, negro y plata distinguen acciones y contenido.',
        'Titulares grandes y tarjetas modulares muestran energía sin perder orden.',
      ],
    },
    responsive: {
      mobile: 'El raíl se convierte en cabecera compacta con menú accesible y proyectos en una columna.',
      tablet: 'La navegación pasa a la parte superior y los bloques reducen columnas.',
      desktop: 'El raíl vertical permanece visible mientras el contenido se despliega en una grilla amplia.',
    },
    implementation: [
      'Demo navegable desarrollada con Astro y estilos responsivos.',
      'Entradas y revelados con GSAP para guiar la lectura.',
      'Controles de tema y acceso a contacto en la navegación.',
    ],
  },
} satisfies Record<ProcessProjectSlug, ProjectProcess>;

export function getProjectProcess(slug: string): ProjectProcess | undefined {
  return Object.prototype.hasOwnProperty.call(processBySlug, slug)
    ? processBySlug[slug as ProcessProjectSlug]
    : undefined;
}
