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
  artwork text not null default 'digital' check (artwork in ('cafe', 'beauty', 'digital')),
  cover_url text,
  external_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.portfolio_projects enable row level security;

create policy "Public projects are readable"
  on public.portfolio_projects
  for select
  to anon
  using (published = true);
