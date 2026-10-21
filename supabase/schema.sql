-- Ejecuta este archivo en el SQL Editor de tu proyecto Supabase.
-- La clave anon solo puede leer proyectos publicados; la escritura queda privada.

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  category text not null default 'Diseño y desarrollo web',
  year text not null default '2026',
  number text not null default '',
  summary text not null default '',
  challenge text not null default '',
  approach text not null default '',
  outcome text not null default '',
  services text[] not null default '{}',
  palette text not null default '',
  artwork text not null default 'digital' check (artwork in ('cafe', 'beauty', 'digital', 'pc')),
  cover_url text,
  external_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Permite el nuevo arte de Nodo PC también si la tabla ya existía.
alter table public.portfolio_projects
  drop constraint if exists portfolio_projects_artwork_check;

alter table public.portfolio_projects
  add constraint portfolio_projects_artwork_check
  check (artwork in ('cafe', 'beauty', 'digital', 'pc'));

alter table public.portfolio_projects enable row level security;

drop policy if exists "Public projects are readable" on public.portfolio_projects;
create policy "Public projects are readable"
  on public.portfolio_projects
  for select
  to anon
  using (published = true);

grant usage on schema public to anon;
grant select on public.portfolio_projects to anon;

-- Inventario de Nodo PC. Caleta es la fuente del precio; la descripción y la
-- imagen, cuando existen, deben proceder de la página oficial del fabricante.
create table if not exists public.nodo_pc_products (
  id text primary key,
  source_sku text,
  source_category text not null check (source_category in (
    'cpu', 'mbb', 'ram', 'disco', 'video', 'case', 'fuente', 'ref',
    'teclado', 'mouse', 'audi', 'parlante'
  )),
  category text not null check (category in (
    'cpu', 'board', 'ram', 'ssd', 'gpu', 'case', 'power', 'cooling',
    'keyboard', 'mouse', 'headset', 'speaker'
  )),
  name text not null,
  brand text,
  type text not null default '',
  detail text,
  description text,
  price_pen numeric(12, 2) check (price_pen is null or price_pen >= 0),
  price_needs_review boolean not null default false,
  stock_text text,
  stock_quantity integer check (stock_quantity >= 0),
  source_url text not null check (source_url ~ '^https://(www\.)?caleta\.pe/'),
  official_url text,
  official_image_url text,
  specs jsonb not null default '{}'::jsonb,
  tag text,
  label text,
  published boolean not null default false,
  sort_order integer not null default 0,
  captured_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists nodo_pc_products_public_order_idx
  on public.nodo_pc_products (published, sort_order, name);
create index if not exists nodo_pc_products_source_sku_idx
  on public.nodo_pc_products (source_sku);

alter table public.nodo_pc_products enable row level security;
drop policy if exists "Published Nodo PC products are readable" on public.nodo_pc_products;
create policy "Published Nodo PC products are readable"
  on public.nodo_pc_products for select to anon
  using (published = true);

revoke insert, update, delete on public.nodo_pc_products from anon, authenticated;
grant select on public.nodo_pc_products to anon;
