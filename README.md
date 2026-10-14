# Portafolio de Milton Blaise

Sitio para clientes construido con Astro y GSAP. Incluye contacto visible por WhatsApp, modo claro/oscuro, tres casos conceptuales con demos navegables y una integración opcional con Supabase para gestionar los proyectos.

## Iniciar

```bash
npm install
npm run dev
```

Abre la URL local que muestre Astro. Para generar la versión estática:

```bash
npm run build
```

El resultado queda en `dist/` y puede alojarse en cualquier hosting estático.

## Personalizar

- Nombre, descripción y WhatsApp: `src/data/site.ts`.
- Textos e información de los casos conceptuales: `src/data/site.ts`.
- Diseño y estilos: `src/styles/global.css`.
- Movimiento: `src/scripts/animations.ts`.
- Tema claro/oscuro: `src/scripts/theme.ts` y `src/styles/refinements.css`.
- Demos completas: `src/pages/demos/` y sus hojas `src/styles/demo-*.css`.

Los tres casos actuales son **conceptuales**. Sus demos muestran cómo podría funcionar una web de café, belleza o estudio digital. Sustituye textos e imágenes por proyectos reales antes de presentarlos como trabajo para clientes.

## Conectar Supabase

1. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` en el SQL Editor.
2. Copia `.env.example` a `.env` y coloca `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde la configuración del proyecto.
3. Añade filas a `portfolio_projects` y marca `published = true`. Si la tabla queda vacía, se muestran los casos de ejemplo.
4. Para imágenes, sube los archivos a un bucket **público** de Supabase Storage y copia la URL pública a `cover_url`.
5. Ejecuta `npm run build`. El sitio consulta Supabase durante la compilación y genera HTML estático; vuelve a desplegar cuando actualices los proyectos.

La clave `anon` solo puede leer filas publicadas mediante la política RLS del esquema. Nunca coloques una `service_role` key en este proyecto o en el navegador.

## Arquitectura

Astro genera la portada, una ruta `/proyectos/[slug]/` por caso y tres demos en `/demos/`. GSAP anima letras, tarjetas y secciones al hacer scroll. Con la preferencia de movimiento reducido, las animaciones se omiten. El tema claro/oscuro recuerda la preferencia del visitante. Supabase es opcional: sin credenciales, el sitio sigue funcionando con los datos locales.
