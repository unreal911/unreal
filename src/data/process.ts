/**
 * Proceso de los casos conceptuales. Las preguntas representan hipótesis de
 * descubrimiento; no describen entrevistas con clientes reales.
 */
export type ProcessProjectSlug = 'senda-cafe' | 'lume-beauty' | 'nexa-digital' | 'nodo-pc';

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
      context: 'Proyecto conceptual para una cafetería de especialidad: presentar su café, su historia y la experiencia de visitar el espacio.',
      goal: 'Invitar a descubrir la carta, conocer el origen del café y explorar cómo sería una visita a Senda.',
      audience: 'Personas que quieren elegir una bebida, conocer el ambiente y consultar cómo visitar la cafetería.',
      primaryAction: 'Explorar la carta y probar una reserva de demostración.',
    },
    discovery: {
      label: 'Preguntas planteadas para este concepto; no se hicieron entrevistas a clientes',
      questions: [
        '¿Qué necesita saber alguien antes de elegir su café?',
        '¿Cómo mostrar el ambiente y contar el origen sin esconder la carta?',
        '¿Qué necesita consultar alguien antes de planear una visita?',
      ],
    },
    sitemap: ['Portada', 'Nuestra esencia', 'Favoritos', 'La carta', 'Origen y proceso', 'El espacio', 'Visítanos y reserva'],
    wireframe: {
      idea: 'Un recorrido fotográfico que presenta el carácter de Senda y conecta sus bebidas, su origen y el espacio.',
      decisions: [
        'Abrir con una fotografía amplia y un acceso directo a la carta.',
        'Presentar tres favoritos antes de la carta, que se puede filtrar por café, fríos y de la cocina.',
        'Alternar historia, origen y fotografías del ambiente antes de mostrar horarios y una reserva de demostración.',
      ],
    },
    visual: {
      direction: 'Una dirección editorial con fotografías protagonistas, fondos espresso y crema, acentos cobre y composiciones de distintos tamaños.',
      decisions: [
        'Los tonos espresso, crema y cobre acompañan la fotografía y dan continuidad a las secciones.',
        'Los títulos expresivos, las imágenes amplias y los detalles de producto construyen el ritmo de la página.',
      ],
    },
    responsive: {
      mobile: 'Las composiciones se ordenan en una columna, con navegación compacta y filtros de carta accesibles al tacto.',
      tablet: 'Las fotografías y el texto se reorganizan para mantener el protagonismo del producto y una lectura cómoda.',
      desktop: 'La portada fotográfica ocupa todo el ancho y las secciones combinan imágenes, texto y cuadrículas de distintos tamaños.',
    },
    implementation: [
      'Página de ejemplo que puedes recorrer en computadora, tablet y celular.',
      'Animaciones de entrada y de recorrido acompañan las fotografías y los textos, respetando la preferencia de movimiento reducido.',
      'Carta filtrable por categorías y galería del ambiente con fotografías que se pueden ampliar.',
      'Horarios de ejemplo y formulario de reserva de demostración, sin enviar solicitudes a una cafetería real.',
    ],
  },
  'lume-beauty': {
    brief: {
      context: 'Ejemplo: una marca de cuidado personal presenta un sérum y una rutina sencilla.',
      goal: 'Explicar el producto con calma y claridad, sin promesas clínicas no sustentadas.',
      audience: 'Personas que quieren entender el producto y cómo integrarlo a su rutina.',
      primaryAction: 'Conocer el sérum y su ritual.',
    },
    discovery: {
      label: 'Preguntas planteadas para este concepto; no se hicieron entrevistas a clientes',
      questions: [
        '¿Qué dudas aparecen antes de probar un producto de cuidado personal?',
        '¿Cómo mostrar el modo de uso sin saturar la página?',
        '¿Qué detalles transmiten una sensación de calma y confianza?',
      ],
    },
    sitemap: ['Portada', 'Filosofía', 'El sérum', 'Ritual'],
    wireframe: {
      idea: 'Presentar primero el producto, después explicar qué ofrece y por último mostrar cómo se usa.',
      decisions: [
        'Situar el frasco en el centro de la primera pantalla.',
        'Separar la presentación del producto de los pasos de la rutina para facilitar la lectura.',
        'Poner los botones cerca del producto para que sea fácil seguir explorándolo.',
      ],
    },
    visual: {
      direction: 'Colores suaves y una página luminosa que transmiten calma y cuidado.',
      decisions: [
        'Los colores lavanda, marfil y ciruela distinguen el producto y acompañan la lectura.',
        'Las letras elegidas, la luz suave y el espacio entre textos ayudan a leer sin sentirse abrumado.',
      ],
    },
    responsive: {
      mobile: 'El contacto queda visible arriba y el producto y los textos aparecen uno debajo de otro.',
      tablet: 'La sección de producto pasa a una columna para mantener una lectura continua.',
      desktop: 'El producto domina la portada y la información se distribuye en bloques amplios.',
    },
    implementation: [
      'Página de ejemplo que puedes recorrer, con una representación del frasco.',
      'Las secciones aparecen con una animación al bajar por la página.',
      'Enlaces internos a filosofía, sérum y ritual.',
    ],
  },
  'nexa-digital': {
    brief: {
      context: 'Ejemplo: un estudio que crea páginas web necesita presentar sus servicios y trabajos con un estilo reconocible.',
      goal: 'Ordenar servicios y proyectos para que el visitante entienda la oferta y encuentre cómo contactar.',
      audience: 'Empresas que buscan ayuda para crear o mejorar su página web.',
      primaryAction: 'Ir a contacto después de revisar servicios y proyectos.',
    },
    discovery: {
      label: 'Preguntas planteadas para este concepto; no se hicieron entrevistas a clientes',
      questions: [
        '¿Qué servicio necesita entender primero un cliente potencial?',
        '¿Cómo mostrar proyectos diferentes manteniendo un estilo reconocible?',
        '¿Dónde debe aparecer el contacto durante la exploración?',
      ],
    },
    sitemap: ['Inicio', 'Servicios', 'Enfoque', 'Proyectos', 'Contacto'],
    wireframe: {
      idea: 'Una distribución por bloques que permite distinguir qué ofrece el estudio, sus servicios y sus trabajos.',
      decisions: [
        'Dejar el menú en un lateral de la computadora para tener las secciones siempre a la vista.',
        'Dar un bloque propio a cada servicio.',
        'Cerrar el recorrido con una invitación directa a conversar.',
      ],
    },
    visual: {
      direction: 'Letras grandes y colores que se distinguen entre sí para encontrar servicios, trabajos y botones con facilidad.',
      decisions: [
        'El azul intenso destaca los botones sobre los fondos negros y plateados.',
        'Los títulos grandes y la información dividida en tarjetas permiten reconocer cada servicio rápidamente.',
      ],
    },
    responsive: {
      mobile: 'El menú pasa a la parte superior y los proyectos aparecen uno debajo de otro.',
      tablet: 'El menú aparece arriba y se muestran menos columnas para facilitar la lectura.',
      desktop: 'El menú lateral sigue visible y la información se reparte en bloques amplios.',
    },
    implementation: [
      'Página de ejemplo que puedes recorrer en computadora, tablet y celular.',
      'La información aparece con animaciones que acompañan la lectura.',
      'Botones para cambiar entre fondo claro y oscuro y para ir al contacto.',
    ],
  },
  'nodo-pc': {
    brief: {
      context: 'Ejemplo: una tienda de piezas para computadoras ofrece componentes sueltos y equipos armados a medida.',
      goal: 'Ayudar a elegir componentes y convertir esa selección en una solicitud de cotización clara.',
      audience: 'Personas que mejoran su computadora, buscan una pieza concreta o quieren preparar su primera PC.',
      primaryAction: 'Revisar la selección y solicitar una cotización por WhatsApp.',
    },
    discovery: {
      label: 'Preguntas planteadas para este concepto; no se hicieron entrevistas a clientes',
      questions: [
        '¿Qué datos ayudan a comparar dos componentes sin perderse entre especificaciones?',
        '¿Cómo dar un camino propio a quien compra una pieza y a quien necesita un equipo completo?',
        '¿Qué debe revisar una persona antes de enviar su pedido a la tienda?',
      ],
    },
    sitemap: ['Inicio', 'Componentes', 'Arma tu PC', 'Tu pedido'],
    wireframe: {
      idea: 'Dos recorridos en páginas propias que llegan al mismo pedido: explorar componentes o construir una PC paso a paso.',
      decisions: [
        'Ofrecer “Explorar componentes” y “Arma tu PC” desde la primera pantalla, con una página dedicada para cada tarea.',
        'Mostrar el tipo de pieza, su descripción, su precio y el botón en el mismo orden para comparar productos con facilidad.',
        'Mostrar el precio estimado y permitir revisar y cambiar la selección antes de enviar la solicitud.',
      ],
    },
    visual: {
      direction: 'Una tienda que muestra las piezas para computadoras con sus datos ordenados y botones fáciles de encontrar.',
      decisions: [
        'Los fondos blancos facilitan la lectura de los productos y el gris oscuro ayuda a destacar las piezas.',
        'El rojo destaca los botones del menú, los productos y la herramienta para armar tu PC.',
        'Las fotos oficiales permiten reconocer los productos; cuando no hay foto, se muestra el nombre del modelo con claridad.',
      ],
    },
    responsive: {
      mobile: 'La información aparece en una columna, puedes filtrar por tipo de pieza y el pedido sigue accesible desde arriba.',
      tablet: 'Se muestran menos columnas de productos y puedes ver las piezas elegidas y el total al armar tu PC.',
      desktop: 'La portada presenta la tienda y sus piezas; el catálogo y el armado tienen páginas propias para comparar y elegir.',
    },
    implementation: [
      'Catálogo filtrable con referencias de Caleta, descripciones basadas en sus fichas y fotos oficiales cuando están disponibles.',
      'Herramienta para elegir las piezas de tu PC, ver el precio estimado e incluir el servicio de armado.',
      'Pedido con cantidades, eliminación de artículos y resumen para WhatsApp.',
    ],
  },
} satisfies Record<ProcessProjectSlug, ProjectProcess>;

export function getProjectProcess(slug: string): ProjectProcess | undefined {
  return Object.prototype.hasOwnProperty.call(processBySlug, slug)
    ? processBySlug[slug as ProcessProjectSlug]
    : undefined;
}
