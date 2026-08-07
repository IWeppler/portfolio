-- Reemplaza el tech stack por una categoria de proyecto.
--
-- El front mostraba `tech_stack[0]` como etiqueta debajo del titulo y la grilla
-- de /projects filtraba con una heuristica de strings sobre esa etiqueta. Ahora
-- cada proyecto tiene una categoria explicita y los labels se traducen en los
-- locales (clave `project_categories`), asi que la columna no guarda texto
-- visible.
--
-- Aplicar con `supabase db push` o pegando esto en el SQL editor.

alter table projects
  add column if not exists category text not null default 'web';

alter table projects
  drop constraint if exists projects_category_check;
alter table projects
  add constraint projects_category_check
  check (category in ('web', 'app-saas', 'diseno'));

alter table projects
  drop column if exists tech_stack;
