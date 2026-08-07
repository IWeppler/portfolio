
alter table "Projects" enable row level security;

-- "page_views": alimentada por app/api/track/route.ts usando la anon key
-- para poder trackear visitas de publico no autenticado. Necesita permitir
-- INSERT anonimo, pero nunca SELECT/UPDATE/DELETE anonimo (esos datos solo
-- los debe poder leer el panel, autenticado, via service_role o una policy
-- de SELECT para "authenticated").
alter table page_views enable row level security;

drop policy if exists "page_views anon insert" on page_views;
create policy "page_views anon insert"
  on page_views
  for insert
  to anon
  with check (true);

drop policy if exists "page_views authenticated select" on page_views;
create policy "page_views authenticated select"
  on page_views
  for select
  to authenticated
  using (true);
