-- Run once in your own Supabase project. No service role key belongs in the app.
begin;
create or replace function public.valid_student_state(v jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog,public as $$
declare s jsonb;g jsonb;t jsonb;ids text[]:='{}';names text[]:='{}';grade_ids text[]:='{}';task_ids text[]:='{}';d date;start_date date;split_date date;end_date date;start_order int;split_order int;end_order int;
begin
 if v is null or jsonb_typeof(v) is distinct from 'object' or jsonb_typeof(v->'subjects') is distinct from 'array' or jsonb_typeof(v->'grades') is distinct from 'array' or jsonb_typeof(v->'tasks') is distinct from 'array' then return false;end if;
 if octet_length(v::text)>5000000 or jsonb_array_length(v->'subjects')>100 or jsonb_array_length(v->'grades')>10000 or jsonb_array_length(v->'tasks')>2000 then return false;end if;
 for s in select value from jsonb_array_elements(v->'subjects') loop
  if jsonb_typeof(s->'id') is distinct from 'string' or (s->>'id') !~ '^[a-zA-Z0-9-]{1,64}$' or (s->>'id')=any(ids) or jsonb_typeof(s->'name') is distinct from 'string' or char_length(s->>'name')>80 or char_length(btrim(s->>'name'))<1 or lower(btrim(s->>'name'))=any(names) or jsonb_typeof(s->'target') is distinct from 'number' or (s->>'target')::numeric not between 1 and 10 then return false;end if;
  ids:=array_append(ids,s->>'id');names:=array_append(names,lower(btrim(s->>'name')));
 end loop;
 for g in select value from jsonb_array_elements(v->'grades') loop
  if jsonb_typeof(g->'id') is distinct from 'string' or (g->>'id') !~ '^[a-zA-Z0-9-]{1,64}$' or (g->>'id')=any(grade_ids) or jsonb_typeof(g->'subjectId') is distinct from 'string' or not (g->>'subjectId')=any(ids) or jsonb_typeof(g->'value') is distinct from 'number' or (g->>'value')::numeric not between .25 and 10 or jsonb_typeof(g->'weight') is distinct from 'number' or (g->>'weight')::numeric<=0 or (g->>'weight')::numeric>10 or jsonb_typeof(g->'date') is distinct from 'string' or (g->>'date') !~ '^\d{4}-\d{2}-\d{2}$' or jsonb_typeof(g->'type') is distinct from 'string' or (g->>'type') not in ('Scritto','Orale','Pratico') or jsonb_typeof(g->'note') is distinct from 'string' or char_length(g->>'note')>160 then return false;end if;
  d:=(g->>'date')::date;if to_char(d,'YYYY-MM-DD')<>g->>'date' or extract(month from d) in(7,8) then return false;end if;
  grade_ids:=array_append(grade_ids,g->>'id');
 end loop;
 for t in select value from jsonb_array_elements(v->'tasks') loop
  if jsonb_typeof(t->'id') is distinct from 'string' or (t->>'id') !~ '^[a-zA-Z0-9-]{1,64}$' or (t->>'id')=any(task_ids) or jsonb_typeof(t->'title') is distinct from 'string' or char_length(t->>'title')>200 or char_length(btrim(t->>'title'))<1 or jsonb_typeof(t->'date') is distinct from 'string' or (t->>'date') !~ '^\d{4}-\d{2}-\d{2}$' or jsonb_typeof(t->'done') is distinct from 'boolean' or jsonb_typeof(t->'subjectId') is distinct from 'string' or ((t->>'subjectId')<>'' and not (t->>'subjectId')=any(ids)) then return false;end if;
  d:=(t->>'date')::date;if to_char(d,'YYYY-MM-DD')<>t->>'date' then return false;end if;task_ids:=array_append(task_ids,t->>'id');
 end loop;
 if v ? 'settings' then
  s:=v->'settings';if jsonb_typeof(s) is distinct from 'object' or coalesce(s->>'start','') !~ '^\d{2}-\d{2}$' or coalesce(s->>'split','') !~ '^\d{2}-\d{2}$' or coalesce(s->>'end','') !~ '^\d{2}-\d{2}$' then return false;end if;
  start_date:=('2027-'||(s->>'start'))::date;split_date:=('2027-'||(s->>'split'))::date;end_date:=('2027-'||(s->>'end'))::date;
  if extract(month from start_date)<9 or extract(month from end_date)>6 then return false;end if;
  start_order:=extract(month from start_date)*100+extract(day from start_date);split_order:=(extract(month from split_date)+case when extract(month from split_date)<9 then 12 else 0 end)*100+extract(day from split_date);end_order:=(extract(month from end_date)+12)*100+extract(day from end_date);
  if split_order<start_order or split_order>=end_order then return false;end if;
 end if;
 return true;
exception when others then return false;
end;$$;
create table if not exists public.student_states (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 60),
 data jsonb not null,
 revision bigint not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 constraint bounded_student_state check (
  octet_length(data::text)<=5000000 and jsonb_typeof(data)='object'
  and jsonb_typeof(data->'subjects')='array' and jsonb_array_length(data->'subjects')<=100
  and jsonb_typeof(data->'grades')='array' and jsonb_array_length(data->'grades')<=10000
  and jsonb_typeof(data->'tasks')='array' and jsonb_array_length(data->'tasks')<=2000
 )
);
alter table public.student_states enable row level security;
alter table public.student_states force row level security;
drop policy if exists own_student_state on public.student_states;
create policy own_student_state on public.student_states for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.student_states from anon,authenticated;
grant select on public.student_states to authenticated;
create or replace function public.save_student_state(expected_revision bigint,state_json jsonb,profile_name text)
returns table(revision bigint,display_name text,data jsonb)
language plpgsql security definer set search_path=pg_catalog,public
as $$
declare uid uuid:=auth.uid(); existing_revision bigint;
begin
 if uid is null or not exists(select 1 from auth.users u where u.id=uid and u.email_confirmed_at is not null) then raise exception 'AUTH_REQUIRED';end if;
 if expected_revision is null or expected_revision<0 or state_json is null or profile_name is null or char_length(btrim(profile_name)) not between 1 and 60 then raise exception 'INVALID_STATE';end if;
 if not public.valid_student_state(state_json) then raise exception 'INVALID_STATE';end if;
 if jsonb_typeof(state_json) is distinct from 'object' or jsonb_typeof(state_json->'subjects') is distinct from 'array' or jsonb_typeof(state_json->'grades') is distinct from 'array' or jsonb_typeof(state_json->'tasks') is distinct from 'array' then raise exception 'INVALID_STATE';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select s.revision into existing_revision from public.student_states s where s.user_id=uid for update;
 if existing_revision is null then
  if expected_revision<>0 then raise exception 'CONFLICT';end if;
  insert into public.student_states(user_id,display_name,data,revision) values(uid,btrim(profile_name),state_json,1);
 else
  if existing_revision<>expected_revision then raise exception 'CONFLICT';end if;
  update public.student_states s set data=state_json,display_name=btrim(profile_name),revision=s.revision+1,updated_at=now() where s.user_id=uid;
 end if;
 return query select s.revision,s.display_name,s.data from public.student_states s where s.user_id=uid;
end;$$;
revoke all on function public.save_student_state(bigint,jsonb,text) from public,anon;
grant execute on function public.save_student_state(bigint,jsonb,text) to authenticated;
commit;
