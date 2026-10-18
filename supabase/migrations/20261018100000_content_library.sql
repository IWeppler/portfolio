-- Biblioteca del modulo Content, por marca:
-- - referencia: inspiracion (posts de Instagram, Behance...). Nunca va dentro
--   de una pieza; `note` dice que tomar de ella.
-- - recurso: imagen que si va dentro de las piezas (capturas, fotos); `note`
--   la describe para elegir la correcta.
-- Los archivos van al bucket publico, en content/<marca>/. Aditiva.

create table if not exists content_library (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('portfolio', 'comerz')),
  kind text not null check (kind in ('referencia', 'recurso')),
  url text not null,
  storage_path text not null,
  width integer not null,
  height integer not null,
  title text not null default '',
  note text not null default '',
  source_url text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists content_library_brand_idx
  on content_library (brand, kind, created_at desc);

-- Mismo criterio que el resto del modulo: solo via API propia con service_role.
alter table content_library enable row level security;
