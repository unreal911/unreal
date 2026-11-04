# Rediseño del portafolio Nubicore

Implementado en el proyecto local el 2 de noviembre de 2026.

## Decisiones aplicadas

- **Una propuesta estable en la portada.** El mensaje «Tu negocio, en su mejor versión digital» permanece visible junto al contacto. Las muestras Trama, Senda y Nodo PC cambian únicamente al pulsar sus botones.
- **Mostrar el trabajo y explicar la oferta.** La galería aparece después de la portada. Trama y Nodo PC tienen mayor tamaño; los otros tres casos completan la variedad de sectores. Todos se identifican como conceptos, sin atribuirles clientes o resultados reales.
- **Servicios fáciles de comparar.** Tres filas explican propósito, alcance orientativo, ejemplo y contacto. La oferta para mayoristas conecta directamente con Trama y con una consulta específica.
- **Jerarquía visual.** Tipografía amplia, espacio, contraste entre verde oscuro, crema y lima, y menos elementos que compiten con el mensaje principal. El cambio de fondo separa la galería del resto del recorrido.
- **Movimiento breve y opcional.** Entradas de secciones de 450 ms, cambio de muestra de 260 ms y entrada del contenido de página de 180 ms. No hay avance automático de las muestras ni desplazamiento forzado. La preferencia de movimiento reducido desactiva estos efectos.
- **Mejora progresiva.** El contenido no queda oculto esperando una animación. Sin JavaScript, la primera muestra y los enlaces siguen disponibles. La navegación entre documentos conserva el comportamiento habitual del navegador.

## Criterios profesionales consultados

Estas referencias orientan el diseño; no representan una revisión o certificación de Nubicore por sus autores.

- [Nielsen Norman Group: Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/). Tamaño, contraste y agrupación para ordenar qué se lee primero. Aplicado a propuesta, proyectos y llamadas de contacto.
- [W3C: Understanding SC 2.3.3, Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). Control del movimiento no esencial. Aplicado con `prefers-reduced-motion` y cancelación de animaciones activas cuando cambia la preferencia.
- [MDN: @view-transition](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition). Se consultó para evaluar las transiciones entre documentos. En la revisión del navegador integrado se observó una transición abortada; la implementación final usa una breve entrada CSS para evitar esa dependencia.

## Validación y límites

Se revisaron la portada y los controles en navegador, el menú móvil, las preguntas frecuentes y los enlaces de campaña. Se comprobaron anchos de 320, 390, 768 y 1440 px sin desbordamiento horizontal en la portada. Se ejecutan además compilación, auditoría SEO local y pruebas de atribución de campaña.

Esta revisión no equivale a una auditoría completa de accesibilidad ni a una medición de conversiones. La respuesta comercial se evaluará con consultas recibidas durante el piloto de 30 días. No se ha desplegado esta versión en producción.
