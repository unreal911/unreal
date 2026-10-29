# SEO de Nubicore

El sitio está publicado en `https://nubicore.digital/`, con DNS administrado en Hostinger y alojamiento en Netlify. `www` redirige al dominio principal y Netlify gestiona el certificado HTTPS.

`netlify.toml` establece `SITE_URL=https://nubicore.digital` únicamente en el contexto de producción. En otros contextos usa una cadena vacía para mantener las vistas previas fuera de la indexación. Para compilar localmente con el dominio, configura `SITE_URL` en `.env` o en el entorno del proceso.

## Vistas previas y compilaciones locales sin dominio

Mantén `SITE_URL` vacío en `.env` y en el entorno del hosting. Las páginas que usan `SeoHead` incluyen `noindex,follow`; no generan canonical, `og:url`, imagen social absoluta ni URLs de identidad en JSON-LD. El sitemap contiene un conjunto vacío de URLs y `robots.txt` no lo anuncia.

`robots.txt` permite el rastreo también en esta etapa, para que los buscadores puedan leer `noindex`. Un bloqueo `Disallow: /` impediría leer esa instrucción y no garantiza que una URL desaparezca de los resultados. Esta configuración no sustituye autenticación si una vista previa debe ser privada.

## Al conectar el dominio

1. Configura `SITE_URL` con el origen público definitivo, incluido `https://`, sin rutas, parámetros ni fragmentos. Usa el dominio que realmente se haya registrado y conectado; no una URL de ejemplo.
2. Ejecuta `npm run build` y despliega el nuevo `dist/`. El sitio es estático: cambiar la variable en el hosting sin recompilar no actualiza el HTML.
3. Revisa que portada y casos tengan `index,follow`, canonical e imagen social del dominio correcto. Las URLs de páginas terminan en `/`.
4. Abre `/robots.txt` y `/sitemap.xml`. El sitemap debe incluir únicamente portada y casos publicados en `/proyectos/`; excluye demos, administración y herramientas de QA.
5. Verifica la propiedad real del dominio en Google Search Console, envía el sitemap e inspecciona la portada. Ninguna de estas verificaciones se ha realizado desde este proyecto.

`SITE_URL` se carga con `loadEnv` de Vite desde los archivos `.env` del proyecto, también durante la evaluación de `astro.config.mjs`. Una variable del proceso de compilación tiene prioridad. Déjala vacía en compilaciones de vista previa; solo la compilación destinada al dominio definitivo debe configurarla. Se usa el modo de `NODE_ENV` (`production` si no está definido).

## Contrato del componente

Dentro del `<head>` del layout, usa `SeoHead` una sola vez:

```astro
<SeoHead title={title} description={description} />
```

El componente produce `<title>`, descripción, robots, canonical cuando existe dominio, Open Graph, Twitter Card y JSON-LD. Retira del layout las etiquetas equivalentes para evitar duplicados. `image` es una propiedad opcional; por defecto usa `/images/nubicore-social.png`, de 1200 × 630 píxeles. Las imágenes compartidas se publican como URLs absolutas solo cuando existe `SITE_URL`.

Los datos estructurados describen `Organization`, `WebSite` y `WebPage`, con el fundador identificado mediante `site.fullName`, el teléfono de contacto público y el logotipo de Nubicore. Los casos incluyen `BreadcrumbList`. No se declaran dirección física, reseñas, premios, perfiles sociales ni datos comerciales sin confirmar. El JSON se escapa para impedir que el contenido cierre el elemento `script`.

Todas las demos conservan sus propias etiquetas `noindex`. `SeoHead` se reserva a la web de la empresa y los casos. El archivo local `public/__portfolio-qa.html` se conserva para desarrollo, pero un hook de Astro retira exclusivamente su copia del resultado de compilación.

## Comprobación reproducible

Después de una compilación con `SITE_URL=https://nubicore.digital`, ejecuta `node scripts/audit-seo.mjs`. Revisa títulos y descripciones únicos, idioma, viewport, H1, canonical, tarjetas sociales, JSON-LD, breadcrumbs, textos alternativos, recursos internos, exclusión de demos y correspondencia del sitemap. Guarda el informe detallado en `artifacts/nubicore-seo-audit.json` (carpeta excluida de Git).

La auditoría local comprueba la preparación técnica, no la presencia real en el índice de Google ni los Core Web Vitals de usuarios reales. Para esos datos se utiliza Google Search Console y PageSpeed Insights.

## Referencias

- [Astro: variables de entorno y carga en la configuración](https://docs.astro.build/en/guides/environment-variables/)
- [Google Search Central: alcance de robots.txt y noindex](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
