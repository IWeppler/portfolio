-- CRM de leads + tracking de clicks de conversion. Aditiva, no toca datos
-- existentes. Aplicar con `supabase db push` o pegando en el SQL editor.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  whatsapp text,
  budget_estimate numeric,
  source text not null default 'Otro',
  industry text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'propuesta_enviada', 'ganado', 'perdido')),
  notes text,
  last_contact_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Igual criterio que "Projects": solo se accede via API propia con
-- service_role key (que ya valida sesion de Supabase Auth, o el
-- server action publico de contacto). Nada de policies para anon/authenticated.
alter table leads enable row level security;

-- "kind" distingue una vista de pagina (view) de un click de conversion
-- (click, ej: boton "Ver Proyecto" o "Github" en el detalle de un proyecto).
alter table page_views
  add column if not exists kind text not null default 'view';

alter table page_views
  drop constraint if exists page_views_kind_check;

alter table page_views
  add constraint page_views_kind_check check (kind in ('view', 'click'));
