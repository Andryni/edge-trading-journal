-- Transaction synthétique annulée : aucun compte ni journal de test n'est conservé.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('a8296338-d214-444d-b631-b1a15ba49011','edge-qa-a@example.invalid',now()),
 ('a8296338-d214-444d-b631-b1a15ba49012','edge-qa-b@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','a8296338-d214-444d-b631-b1a15ba49011',true);
do $$ begin
  if public.edge_save_journal(0,'{"version":2,"trades":[]}'::jsonb) <> 1 then raise exception 'initial revision'; end if;
  if public.edge_save_journal(1,'{"version":2,"trades":[]}'::jsonb) <> 2 then raise exception 'next revision'; end if;
  if (select count(*) from public.edge_journal_versions) <> 1 then raise exception 'history snapshot'; end if;
  begin
    perform public.edge_save_journal(1,'{"version":2,"trades":[]}'::jsonb);
    raise exception 'stale revision accepted';
  exception when sqlstate 'PT409' then null; end;
end $$;
select set_config('request.jwt.claim.sub','a8296338-d214-444d-b631-b1a15ba49012',true);
do $$ begin
  if (select count(*) from public.edge_journals) <> 0 then raise exception 'journal isolation'; end if;
  if (select count(*) from public.edge_journal_versions) <> 0 then raise exception 'history isolation'; end if;
  if has_table_privilege(current_user,'public.edge_journals','UPDATE') then raise exception 'direct write grant'; end if;
  if has_table_privilege(current_user,'public.edge_legacy_imports','SELECT') then raise exception 'legacy leak'; end if;
  if public.edge_save_journal(0,'{"version":2,"trades":[]}'::jsonb) <> 1 then raise exception 'second owner'; end if;
end $$;
rollback;
select 'PASS: isolation, CAS conflict, history, no direct writes, no legacy disclosure; test transaction rolled back' as verification;
