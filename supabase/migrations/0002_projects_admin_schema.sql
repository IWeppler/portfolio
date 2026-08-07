-- Extiende "Projects" para soportar el CMS multilingue del panel admin.
-- Aditiva unicamente: no borra ni renombra columnas existentes (title,
-- description, tags, imageUrl quedan sin uso pero se conservan por si algo
-- mas las lee). Aplicar con `supabase db push` o pegando esto en el SQL
-- editor del proyecto.

alter table "Projects"
  add column if not exists slug text,
  add column if not exists client text,
  add column if not exists "techStack" text[] not null default '{}',
  add column if not exists "isPublished" boolean not null default false,
  add column if not exists "isFeatured" boolean not null default false,
  add column if not exists translations jsonb not null default '{}'::jsonb,
  add column if not exists images jsonb not null default '[]'::jsonb;

create unique index if not exists projects_slug_key
  on "Projects" (slug)
  where slug is not null;
