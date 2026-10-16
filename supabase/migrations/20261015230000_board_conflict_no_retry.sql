-- board_conflict usaba errcode 40001 (serialization_failure). PostgREST
-- reintenta las transacciones que fallan con 40001 sin limite, y como un
-- tablero viejo falla siempre igual, un solo guardado quedaba en loop infinito
-- dentro de Postgres (cientos de millones de llamadas, CPU al maximo).
-- PT409 no se reintenta y PostgREST lo devuelve directo como HTTP 409.
create or replace function public.save_projects_board(board jsonb, expected jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  project_count bigint;
begin
  if jsonb_typeof(board) is distinct from 'array'
     or jsonb_typeof(expected) is distinct from 'array' then
    raise exception 'invalid_board' using errcode = '22023';
  end if;

  -- The portfolio is small. A short table lock also serializes inserts/deletes,
  -- preventing a stale board from overwriting another administrator's changes.
  lock table public.projects in share row exclusive mode;
  select count(*) into project_count from public.projects;

  if jsonb_array_length(board) <> project_count
     or jsonb_array_length(expected) <> project_count
     or (select count(distinct (item->>'id')::uuid) from jsonb_array_elements(board) item) <> project_count
     or (select count(distinct (item->>'id')::uuid) from jsonb_array_elements(expected) item) <> project_count
     or exists (
       select 1 from jsonb_array_elements(board) item
       left join public.projects p on p.id = (item->>'id')::uuid
       where p.id is null or jsonb_typeof(item->'isPublished') is distinct from 'boolean'
     )
     or exists (
       select 1 from jsonb_array_elements(expected) item
       left join public.projects p on p.id = (item->>'id')::uuid
       where p.id is null
          or not (item ? 'order')
          or jsonb_typeof(item->'isPublished') is distinct from 'boolean'
          or p.orden is distinct from (item->>'order')::integer
          or coalesce(p.is_published, false) is distinct from (item->>'isPublished')::boolean
     ) then
    raise exception 'board_conflict' using errcode = 'PT409';
  end if;

  update public.projects p
  set orden = (entry.position - 1)::integer,
      is_published = (entry.item->>'isPublished')::boolean
  from jsonb_array_elements(board) with ordinality as entry(item, position)
  where p.id = (entry.item->>'id')::uuid;
end;
$function$;

revoke all on function public.save_projects_board(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_projects_board(jsonb, jsonb) to service_role;
