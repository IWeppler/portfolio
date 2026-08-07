-- Alinea el schema real (projects / project_translations / project_images)
-- con lo que necesita el CMS del panel admin.
--
-- Contexto: la migracion 0002 apuntaba a una tabla "Projects" (mayuscula) con
-- translations/images en jsonb que nunca existio en este proyecto. El schema
-- real es normalizado en 3 tablas, asi que el codigo se adapto a el y aca solo
-- se agregan las columnas que faltaban.
--
-- Aplicar con `supabase db push` o pegando esto en el SQL editor.

alter table projects
  add column if not exists client text,
  add column if not exists url_github text,
  add column if not exists tech_stack text[] not null default '{}',
  add column if not exists is_published boolean not null default false,
  add column if not exists is_featured boolean not null default false;

create unique index if not exists projects_slug_key
  on projects (slug)
  where slug is not null;

-- "contenido" guarda el caso de estudio largo (Markdown). "descripcion" queda
-- como el extracto corto que se usa en tarjetas y listados.
alter table project_translations
  add column if not exists contenido text;

create unique index if not exists project_translations_project_idioma_key
  on project_translations (project_id, idioma);

-- El borrado del proyecto tiene que arrastrar traducciones e imagenes.
alter table project_translations
  drop constraint if exists project_translations_project_id_fkey;
alter table project_translations
  add constraint project_translations_project_id_fkey
  foreign key (project_id) references projects (id) on delete cascade;

alter table project_images
  drop constraint if exists project_images_project_id_fkey;
alter table project_images
  add constraint project_images_project_id_fkey
  foreign key (project_id) references projects (id) on delete cascade;

-- Estas tablas solo se acceden desde /api/projects con la service role key,
-- que ignora RLS. Sin policies, ningun cliente anon/authenticated las lee.
alter table projects enable row level security;
alter table project_translations enable row level security;
alter table project_images enable row level security;
