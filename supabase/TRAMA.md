# Panel de Trama Mayorista

1. En el proyecto de Supabase para Trama, ejecuta [trama_products.sql](trama_products.sql) desde SQL Editor. Crea la tabla del catálogo, aplica sus permisos y carga los seis productos de muestra. Puedes volver a ejecutarlo y se respetarán las fichas existentes. Ejecuta también [trama_product_images.sql](trama_product_images.sql) para crear el bucket público de fotos y dar permiso de subida a las cuentas administradoras de Trama.
2. En **Authentication → Users**, crea la cuenta con correo y contraseña, confirma el correo y copia su ID de usuario.
3. En SQL Editor, sustituye el UUID de ejemplo por el ID de esa cuenta y ejecuta esta consulta. Si la cuenta ya tiene una sesión abierta, cierra sesión y vuelve a entrar para que el permiso se incluya en el token.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"trama_admin": true}'::jsonb
   where id = '00000000-0000-0000-0000-000000000000'::uuid
   returning id;
   ```

4. Configura la URL y la clave pública `publishable` (o `anon`) de ese proyecto en `PUBLIC_TRAMA_SUPABASE_URL` y `PUBLIC_TRAMA_SUPABASE_ANON_KEY`, tanto en `.env` para desarrollo como en el entorno de compilación del hosting para producción. Reinicia Astro o vuelve a desplegar para aplicar esta configuración.
5. Entra a `/demos/trama-mayorista/admin/` con la cuenta administradora. Al crear una ficha, puedes subir una foto JPEG, PNG o WebP de hasta 5 MiB, usar una URL HTTPS pública o indicar la ruta de una imagen existente bajo `/images/trama/`. Puedes guardar la ficha como borrador o publicarla. Las fotos subidas se pueden abrir con su URL pública.

El navegador consulta las fichas publicadas en Supabase al abrir o recargar la colección. Los cambios que guardes desde el panel aparecen en la siguiente carga de la página. Las cuentas con el permiso de Trama pueden leer borradores y guardar cambios.
