-- Le journal portable v2 conserve les historiques, y compris leurs nouvelles propriétés.
create table public.edge_journals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  constraint document_version check (data ->> 'version' = '2'),
  constraint document_size check (octet_length(data::text) <= 32000000)
);
alter table public.edge_journals enable row level security;
create policy journal_owner_read on public.edge_journals for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.edge_journals from anon, authenticated;
grant select on public.edge_journals to authenticated;

-- Une seule transaction compare la révision et écrit le journal. Aucun identifiant utilisateur fourni par le client.
create function public.edge_save_journal(expected_revision bigint, document jsonb)
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
  if next_revision is null then raise exception 'CONFLICT' using errcode = '40001'; end if;
  return next_revision;
end $$;
revoke all on function public.edge_save_journal(bigint, jsonb) from public, anon;
grant execute on function public.edge_save_journal(bigint, jsonb) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('edge-captures', 'edge-captures', false, 3000000, array['image/png','image/jpeg','image/webp']);
create policy capture_owner_read on storage.objects for select to authenticated
using (bucket_id = 'edge-captures' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy capture_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'edge-captures' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Objets immuables : pas d'écrasement ; la suppression sera explicite après vérification des références.
