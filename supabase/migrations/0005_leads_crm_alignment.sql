-- Alinea la tabla "leads" real con el CRM del panel.
--
-- Contexto: la migracion 0003 crea "leads" con `create table if not exists`,
-- pero la tabla ya existia con el formato del formulario publico (nombre,
-- tipo_proyecto, estado_idea, presupuesto, mensaje...). Por eso el create fue
-- un no-op y ninguna de las columnas del CRM llego a existir: ni el alta desde
-- el panel ni el insert del formulario publico funcionaban.
--
-- Aplicar con `supabase db push` o pegando esto en el SQL editor.

alter table leads
  add column if not exists company text,
  add column if not exists budget_estimate numeric,
  add column if not exists source text not null default 'Otro',
  add column if not exists industry text,
  add column if not exists status text not null default 'nuevo',
  add column if not exists notes text,
  add column if not exists last_contact_at timestamptz not null default now();

alter table leads
  drop constraint if exists leads_status_check;
alter table leads
  add constraint leads_status_check
  check (status in ('nuevo', 'contactado', 'propuesta_enviada', 'ganado', 'perdido'));

-- Un lead cargado a mano en el panel solo tiene nombre: el resto de los campos
-- vienen del formulario publico y no siempre existen.
alter table leads alter column email drop not null;
alter table leads alter column tipo_proyecto drop not null;
alter table leads alter column estado_idea drop not null;

-- Los enums de la DB no coinciden con los valores que manda el modal de
-- contacto (web_inmobiliaria, app_gestion, agencia / tengo_disenos, tengo_web).
-- Pasan a text: el vocabulario lo valida zod en el server action, y agregar una
-- opcion nueva no requiere tocar la DB.
alter table leads alter column tipo_proyecto type text using tipo_proyecto::text;
alter table leads alter column estado_idea type text using estado_idea::text;

alter table leads enable row level security;
