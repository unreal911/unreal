# Panel administrativo de Nodo PC

El panel está disponible en `/demos/nodo-pc/admin/`. Permite iniciar sesión, revisar el inventario, buscar y filtrar productos, editar sus fichas y controlar si se publican. La autenticación usa Supabase Auth y las escrituras se limitan en la base de datos a usuarios con `app_metadata.role = 'admin'`.

## Activar el acceso

1. En el proyecto de Supabase que usa Nodo PC, ejecuta `admin_policies.sql` en **SQL Editor**.
2. En **Authentication → Users**, crea una cuenta para cada administrador y confirma su correo.
3. En **SQL Editor**, asigna el rol confiable a la cuenta. Reemplaza el correo por el de la cuenta creada:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@tudominio.com';
   ```

4. Confirma que la consulta actualizó una fila. Cierra sesión y vuelve a entrar al panel para recibir un JWT con el rol actualizado.
5. Asegúrate de tener `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` configuradas con los valores públicos del mismo proyecto. El panel nunca requiere una clave `service_role` en el navegador.

El rol se guarda en `app_metadata`, que el usuario no puede cambiar desde el cliente. Las políticas RLS verifican ese rol en cada lectura y escritura; ocultar la interfaz no es la barrera de seguridad.

## Qué se puede editar

Nombre, marca, categoría, tipo, precio, existencias, detalles, descripción, datos del fabricante, etiquetas y visibilidad. Los productos y sus códigos de origen se conservan; la carga completa del catálogo sigue haciéndose desde el proceso de importación documentado en `README.md`.
