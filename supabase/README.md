# Catálogo de Nodo PC

El inventario se toma de las doce familias indicadas de [Caleta](https://www.caleta.pe/): nombre, ID, categoría, precio y stock. `ref` se importa una sola vez. La captura inicial es del 15 de octubre de 2026; cada archivo guarda su fecha en `captured_at`. Estos precios y existencias son referenciales y pueden cambiar en la tienda de origen.

Las descripciones, especificaciones ampliadas y URLs de imágenes se agregan solo tras cotejar el modelo exacto con una ficha oficial de la marca. El catálogo no copia imágenes de Caleta ni guarda binarios en Supabase. Si no hay imagen oficial verificada, la web muestra su arte pixel. Seis precios de S/ 9,999 o S/ 99,999 quedan sin publicar hasta su revisión. Cuatro artículos que aparecen fuera de la familia que les corresponde (hub USB, cargador, micrófono y lectora DVD) también quedan sin publicar; un audífono y un kit de ventiladores se reasignan a su familia correcta.

## Archivos

- `data/caleta-core.json` y `data/caleta-peripherals.json`: capturas de la tienda.
- `data/official-core.json` y `data/official-peripherals.json`: fichas oficiales verificadas.
- `src/data/nodoPcCatalog.json`: catálogo local para mostrar la demo aunque Supabase no esté configurado.
- `schema.sql`: tablas y políticas de lectura pública.
- `seed_nodo_pc.sql`: carga inicial idempotente de los productos.

Regenera el catálogo y la carga SQL con:

```sh
node scripts/build-nodo-pc-catalog.mjs
```

Para limitar la publicación a fichas con descripción e imagen oficiales, usa `--verified-only`. Los productos no publicados permanecen en el SQL para completar su ficha posteriormente.

## Reproducir la conexión en otro entorno

1. Abre el proyecto **Nodo PC** en la organización «Portafolio» o crea otro proyecto si necesitas un entorno distinto.
2. Ejecuta `schema.sql` en SQL Editor y luego `seed_nodo_pc.sql`.
3. Copia la URL del proyecto y su clave pública (`anon`/publishable) a las variables `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`. Las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` siguen siendo usadas por los proyectos del portafolio durante el build.
4. No pongas la contraseña de Postgres ni la clave `service_role` en archivos del cliente. La tabla usa RLS para permitir solo lectura de filas publicadas desde el navegador.

Al refrescar Caleta, revisa cambios de precio/stock y ejecuta otra vez el generador antes de importar el nuevo SQL. Las URLs de imágenes externas pueden cambiar; el componente visual vuelve al arte pixel si una deja de cargar.

## Estado de la carga inicial

El proyecto de Supabase **Nodo PC** en la organización «Portafolio» ya contiene 518 registros. La web muestra 508; diez quedan sin publicar por precio sospechoso o categoría errónea. Veintisiete fichas tienen imagen y descripción cotejadas con la página oficial de su marca. La conexión pública del proyecto está configurada en el archivo local `.env`, excluido de Git.

Cada producto publicado tiene una URL de detalle en `/demos/nodo-pc/producto/<id>/`. Astro genera esas rutas desde el catálogo local; al abrir una ficha, el navegador actualiza precio, stock y datos oficiales desde Supabase. Si se añade un ID nuevo, hay que regenerar el catálogo y desplegar de nuevo para crear su ruta.
