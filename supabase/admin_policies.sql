-- Ejecuta este archivo en el SQL Editor del proyecto Supabase de Nodo PC.
-- Solo usuarios cuyo JWT contenga app_metadata.role = 'admin' pueden gestionar el inventario.

drop policy if exists "Admin users can manage Nodo PC products" on public.nodo_pc_products;
create policy "Admin users can manage Nodo PC products"
  on public.nodo_pc_products
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.nodo_pc_products to authenticated;
