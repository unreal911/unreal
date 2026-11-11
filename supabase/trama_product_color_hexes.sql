-- Ejecuta este archivo después de trama_products.sql.
begin;

alter table public.trama_products
  add column if not exists color_hexes jsonb not null default '{}'::jsonb;

alter table public.trama_products
  drop constraint if exists trama_products_color_hexes_check;

alter table public.trama_products
  add constraint trama_products_color_hexes_check check (
    jsonb_typeof(color_hexes) = 'object'
    and not jsonb_path_exists(
      color_hexes,
      '$.* ? (@.type() != "string" || !(@ like_regex "^#[0-9A-Fa-f]{6}$"))'
    )
  );

commit;
