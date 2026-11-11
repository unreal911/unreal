-- Ejecuta este archivo en el SQL Editor del proyecto Supabase de Trama.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trama-product-images',
  'trama-product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Trama admins can upload product images" on storage.objects;
create policy "Trama admins can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'trama-product-images'
    and (select auth.jwt() -> 'app_metadata' -> 'trama_admin') = 'true'::jsonb
  );

commit;
