create table public.edge_journal_versions (
  user_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id,revision)
);
alter table public.edge_journal_versions enable row level security;
create policy version_owner_read on public.edge_journal_versions for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.edge_journal_versions from anon,authenticated;
grant select on public.edge_journal_versions to authenticated;
create function public.edge_snapshot_journal() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.edge_journal_versions(user_id,revision,data) values(old.user_id,old.revision,old.data) on conflict do nothing;
  delete from public.edge_journal_versions where user_id=old.user_id and revision < old.revision-19;
  return new;
end $$;
revoke all on function public.edge_snapshot_journal() from public,anon,authenticated;
create trigger journal_history before update on public.edge_journals for each row execute function public.edge_snapshot_journal();

-- Import préparé côté administration ; aucune ligne ni adresse n'est lisible par les clients.
create table public.edge_legacy_imports (
  email text primary key,
  data jsonb not null,
  source_revision bigint not null,
  imported_at timestamptz not null default now(),
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz
);
alter table public.edge_legacy_imports enable row level security;
revoke all on public.edge_legacy_imports from anon,authenticated;
create function public.edge_claim_legacy_journal() returns boolean language plpgsql security definer set search_path='' as $$
declare owner_id uuid := auth.uid(); owner_email text; confirmed timestamptz; legacy jsonb; inserted uuid;
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED'; end if;
  select lower(email),email_confirmed_at into owner_email,confirmed from auth.users where id=owner_id;
  if confirmed is null then return false; end if;
  select data into legacy from public.edge_legacy_imports where email=owner_email and claimed_by is null for update;
  if legacy is null then return false; end if;
  insert into public.edge_journals(user_id,data,revision) values(owner_id,legacy,1) on conflict do nothing returning user_id into inserted;
  if inserted is null then return false; end if;
  update public.edge_legacy_imports set claimed_by=owner_id,claimed_at=now() where email=owner_email;
  return true;
end $$;
revoke all on function public.edge_claim_legacy_journal() from public,anon;
grant execute on function public.edge_claim_legacy_journal() to authenticated;
