# Código Impulso

Web de Código Impulso, estudio de diseño y desarrollo web dirigido por Milton Blaise Cañari Oscco. La propuesta atiende a emprendimientos, mypes, pymes y empresas que quieren lanzar o renovar su presencia digital: «La web para el siguiente paso de tu negocio».

Construida con Astro y GSAP. Incluye contacto por WhatsApp, modo claro/oscuro, cinco casos conceptuales con demos navegables y una integración opcional con Supabase para gestionar los proyectos.

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

- Identidad, descripción, fundador, WhatsApp y generador de enlaces de contacto: `src/data/site.ts`.
- Textos e información de los casos conceptuales: `src/data/site.ts`.
- Portada, servicios y estudio: `src/pages/index.astro` y `src/components/PortfolioHero.astro`.
- Diseño y estilos: `src/styles/portfolio-*.css` y `src/styles/global.css`.
- Movimiento: `src/scripts/animations.ts`.
- Tema claro/oscuro: `src/layouts/BaseLayout.astro` y `src/styles/refinements.css`.
- Demos completas: `src/pages/demos/` y sus hojas `src/styles/demo-*.css`.

Los cinco casos actuales son **conceptuales**: Senda Café, Lumé Beauty, Nexa Digital, Nodo PC y Trama Mayorista. Las demos conservan sus propias marcas ficticias y se atribuyen a Código Impulso. No representan encargos ni resultados comerciales de clientes reales.

## SEO y dominio

El dominio registrado es `nubicore.digital`, administrado en Hostinger. `netlify.toml` configura la compilación con Node.js 24, publica `dist/` y establece `SITE_URL=https://nubicore.digital` en producción. Las vistas previas mantienen `SITE_URL` vacío. Consulta `docs/seo.md` para los pasos de conexión y verificación del dominio.

La base SEO incluye títulos, descripciones, tarjetas sociales y generación de URLs del sitio. El archivo editable de la tarjeta social es `public/images/codigo-impulso-social.svg`; la versión compartida es el PNG del mismo nombre.

## Conectar Supabase

1. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` en el SQL Editor.
2. Copia `.env.example` a `.env` y coloca `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde la configuración del proyecto.
3. Añade filas a `portfolio_projects` y marca `published = true`. Si la tabla queda vacía, se muestran los casos de ejemplo.
4. Para imágenes, sube los archivos a un bucket **público** de Supabase Storage y copia la URL pública a `cover_url`.
5. Ejecuta `npm run build`. El sitio consulta Supabase durante la compilación y genera HTML estático; vuelve a desplegar cuando actualices los proyectos.

La clave `anon` solo puede leer filas publicadas mediante la política RLS del esquema. Nunca coloques una `service_role` key en este proyecto o en el navegador.

## Arquitectura

Astro genera la portada, una ruta `/proyectos/[slug]/` por caso y las demos en `/demos/`. GSAP anima letras, tarjetas y secciones al hacer scroll. Con la preferencia de movimiento reducido, las animaciones se omiten. El tema claro/oscuro recuerda la preferencia del visitante. Supabase es opcional: sin credenciales, el sitio sigue funcionando con los datos locales.
