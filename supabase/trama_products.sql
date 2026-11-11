-- Ejecuta este archivo en el SQL Editor del proyecto Supabase de Trama.
begin;

create table if not exists public.trama_products (
  id text primary key check (char_length(id) <= 80 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  category text not null check (category in ('polos', 'camisas', 'abrigos', 'pantalones')),
  label text not null check (btrim(label) <> ''),
  material text not null check (btrim(material) <> ''),
  image text not null check (image ~ '^(https://|/images/trama/)[^[:space:][:cntrl:]]+$'),
  price numeric(10, 2) not null check (price between 0.01 and 99999999.99),
  colors text[] not null check (
    cardinality(colors) > 0 and array_position(colors, null) is null and array_position(colors, '') is null
  ),
  sizes text[] not null check (
    cardinality(sizes) > 0 and array_position(sizes, null) is null and array_position(sizes, '') is null
  ),
  published boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists trama_products_public_order_idx
  on public.trama_products (published, sort_order, id);

alter table public.trama_products enable row level security;

revoke all on table public.trama_products from public, anon, authenticated;
grant select on table public.trama_products to anon, authenticated;
grant insert, update on table public.trama_products to authenticated;

drop policy if exists "Published Trama products are readable" on public.trama_products;
create policy "Published Trama products are readable"
  on public.trama_products for select to anon, authenticated
  using (published);

drop policy if exists "Trama admins can read all products" on public.trama_products;
create policy "Trama admins can read all products"
  on public.trama_products for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' -> 'trama_admin') = 'true'::jsonb);

drop policy if exists "Trama admins can create products" on public.trama_products;
create policy "Trama admins can create products"
  on public.trama_products for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' -> 'trama_admin') = 'true'::jsonb);

drop policy if exists "Trama admins can edit products" on public.trama_products;
create policy "Trama admins can edit products"
  on public.trama_products for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' -> 'trama_admin') = 'true'::jsonb)
  with check ((select auth.jwt() -> 'app_metadata' -> 'trama_admin') = 'true'::jsonb);

insert into public.trama_products
  (id, name, category, label, material, image, price, colors, sizes, published, sort_order)
values
  ('polo-esencial', 'Polo esencial', 'polos', 'BÁSICOS', 'Algodón jersey · 180 g/m²',
    '/images/trama/polo-basico.jpg', 24, array['Crudo', 'Negro', 'Oliva'], array['S', 'M', 'L', 'XL'], true, 10),
  ('camisa-lino', 'Camisa de lino', 'camisas', 'LÍNEA NATURAL', 'Mezcla de lino · corte relajado',
    '/images/trama/camisa-lino.jpg', 48, array['Arena', 'Blanco', 'Azul'], array['S', 'M', 'L', 'XL'], true, 20),
  ('sobrecamisa', 'Sobrecamisa utility', 'abrigos', 'NUEVA COLECCIÓN', 'Drill de algodón · textura suave',
    '/images/trama/sobrecamisa-tierra.jpg', 59, array['Tierra', 'Arena', 'Negro'], array['S', 'M', 'L', 'XL'], true, 30),
  ('hoodie', 'Polera essential', 'abrigos', 'URBAN ESSENTIALS', 'French terry · 320 g/m²',
    '/images/trama/polera-essential.jpg', 56, array['Crudo', 'Gris', 'Negro'], array['S', 'M', 'L', 'XL'], true, 40),
  ('pantalon-relaxed', 'Pantalón relaxed', 'pantalones', 'EVERYDAY WEAR', 'Gabardina de algodón · fit recto',
    '/images/trama/pantalon-arena.jpg', 52, array['Arena', 'Oliva', 'Negro'], array['28', '30', '32', '34', '36'], true, 50),
  ('denim-recto', 'Denim recto', 'pantalones', 'DENIM COLLECTION', 'Denim de algodón · 12 oz',
    '/images/trama/denim-clasico.jpg', 65, array['Azul lavado', 'Índigo', 'Negro'], array['28', '30', '32', '34', '36'], true, 60)
on conflict (id) do nothing;

commit;
