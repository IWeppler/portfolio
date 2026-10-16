-- Texto alternativo por imagen y por idioma: {"es": "...", "en": "...", "pt": "..."}.
-- Describe que muestra la imagen (SEO de imagenes y lectores de pantalla); si
-- falta en un idioma, el sitio usa el espanol y despues el nombre del proyecto.
alter table public.project_images
  add column if not exists alt jsonb not null default '{}'::jsonb;

alter table public.project_images
  drop constraint if exists project_images_alt_is_object;
alter table public.project_images
  add constraint project_images_alt_is_object check (jsonb_typeof(alt) = 'object');

-- De paso: El Tolar se llama "Plataforma Agropecuaria" en todos los idiomas.
update public.project_translations t
set titulo = 'Plataforma Agropecuaria'
from public.projects p
where p.id = t.project_id
  and p.slug = 'el-tolar-plataforma-agropecuaria'
  and t.titulo is distinct from 'Plataforma Agropecuaria';
