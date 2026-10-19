-- Catalogo de assets del modulo Content, sobre content_library. Aditiva.
--
-- - Alcance: brand null es un recurso global (texturas, objetos 3D, iconos,
--   marcos de dispositivo) que pueden usar todas las marcas. Capturas, logos
--   y lo que es identidad quedan atados a su marca.
-- - Clasificacion para buscar: category, origin, viewport, proyecto.
-- - storage_path null: la fila describe un archivo que ya vive en Storage (las
--   imagenes de proyectos del portfolio) sin copiarlo; borrar la fila no
--   borra el archivo.
-- - demo_data: la imagen muestra cifras, precios o testimonios inventados de
--   una demo. Se puede usar como interfaz, nunca como dato.

alter table content_library alter column brand drop not null;
alter table content_library drop constraint if exists content_library_brand_check;
alter table content_library
  add constraint content_library_brand_check check (brand is null or brand in ('portfolio', 'comerz'));

alter table content_library alter column storage_path drop not null;

alter table content_library
  add column if not exists category text not null default 'other'
    check (category in (
      'capture', 'mockup', 'device-frame', 'logo', 'icon', 'illustration',
      'object3d', 'texture', 'background', 'photo', 'other'
    )),
  add column if not exists origin text not null default 'own'
    check (origin in ('real', 'own', 'procedural', 'stock', 'ai')),
  add column if not exists viewport text
    check (viewport is null or viewport in ('mobile', 'tablet', 'desktop')),
  add column if not exists project_slug text,
  add column if not exists has_alpha boolean not null default false,
  add column if not exists dominant_color text not null default '',
  add column if not exists demo_data boolean not null default false,
  -- Imagenes generadas: con que se hicieron, para poder rehacerlas.
  add column if not exists ai_prompt text not null default '';

-- Una captura es interfaz real; lo generado por IA nunca lo es.
alter table content_library drop constraint if exists content_library_capture_real;
alter table content_library
  add constraint content_library_capture_real check (category <> 'capture' or origin = 'real');

-- Una URL se describe una sola vez (annotate_asset hace upsert por url).
create unique index if not exists content_library_url_idx on content_library (url);
create index if not exists content_library_category_idx on content_library (kind, category);
