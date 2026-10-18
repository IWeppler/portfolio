-- Modulo Content del panel: piezas para Instagram de varias marcas. Las crea
-- el panel (como idea) y las diseña Claude Code via el MCP de /api/mcp.
-- Los kits de marca viven en codigo (lib/content/kits); aca solo se guarda a
-- que marca pertenece cada pieza. Aditiva.

create table if not exists content_posts (
  id uuid primary key default gen_random_uuid(),
  brand text not null default 'portfolio'
    check (brand in ('portfolio', 'comerz')),
  idea text not null default '',
  -- Formato principal; los diseños de cada formato van en `designs`.
  format text not null default 'portrait'
    check (format in ('square', 'portrait', 'grid', 'story', 'landscape')),
  -- idea: pendiente de diseño; borrador: Claude ya armo slides; listo /
  -- rechazado: revisado por Ignacio (con review_note, que Claude usa de ejemplo).
  status text not null default 'idea'
    check (status in ('idea', 'borrador', 'listo', 'rechazado')),
  review_note text not null default '',
  -- Lo que dice la pieza: objective, audience, title, subtitle, body, cta, points, caption.
  content jsonb not null default '{}'::jsonb,
  -- Como se ve, por formato: { "portrait": { "slides": [...] }, ... }.
  designs jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  -- Quien hizo el ultimo cambio (panel o claude); queda en cada version.
  edited_by text not null default 'panel'
    check (edited_by in ('panel', 'claude')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_posts_brand_idx on content_posts (brand, created_at desc);
create index if not exists content_posts_status_idx on content_posts (status);

-- Historial: antes de cada cambio de contenido o diseño se guarda como estaba,
-- para poder volver atras.
create table if not exists content_post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references content_posts (id) on delete cascade,
  content jsonb not null,
  designs jsonb not null,
  format text not null,
  status text not null,
  edited_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists content_post_versions_post_idx
  on content_post_versions (post_id, created_at desc);

create or replace function content_posts_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  if new.content is distinct from old.content
    or new.designs is distinct from old.designs
    or new.format is distinct from old.format then
    insert into content_post_versions (post_id, content, designs, format, status, edited_by, created_at)
    values (old.id, old.content, old.designs, old.format, old.status, old.edited_by, old.updated_at);

    -- Se guardan las ultimas 50 por pieza.
    delete from content_post_versions
    where post_id = old.id
      and id not in (
        select id from content_post_versions
        where post_id = old.id
        order by created_at desc
        limit 50
      );
  end if;

  return new;
end;
$$;

drop trigger if exists content_posts_before_update on content_posts;
create trigger content_posts_before_update
  before update on content_posts
  for each row execute function content_posts_before_update();

-- Mismo criterio que leads: solo via API propia con service_role.
alter table content_posts enable row level security;
alter table content_post_versions enable row level security;
