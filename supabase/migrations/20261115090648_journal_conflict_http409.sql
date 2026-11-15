-- Un conflit métier doit répondre immédiatement, sans boucle de retry PostgREST.
create or replace function public.edge_save_journal(expected_revision bigint, document jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); next_revision bigint;
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if expected_revision < 0 or document ->> 'version' is distinct from '2' then raise exception 'INVALID_DOCUMENT'; end if;
  if octet_length(document::text) > 32000000 then raise exception 'DOCUMENT_TOO_LARGE'; end if;
  if expected_revision = 0 then
    insert into public.edge_journals(user_id, data, revision) values(owner_id, document, 1)
      on conflict (user_id) do nothing returning revision into next_revision;
    if next_revision is not null then return next_revision; end if;
  end if;
  update public.edge_journals set data = document, revision = revision + 1, updated_at = now()
    where user_id = owner_id and revision = expected_revision returning revision into next_revision;
  if next_revision is null then raise sqlstate 'PT409' using message = 'CONFLICT'; end if;
  return next_revision;
end $$;
revoke all on function public.edge_save_journal(bigint,jsonb) from public,anon;
grant execute on function public.edge_save_journal(bigint,jsonb) to authenticated;
