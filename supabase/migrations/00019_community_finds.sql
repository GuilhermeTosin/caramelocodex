-- Achadinhos da comunidade (posts temporários com votação)

do $$
begin
  if not exists (
    select 1
    from pg_type t
    where t.typname = 'community_find_category'
  ) then
    create type public.community_find_category as enum ('comida', 'beleza', 'casa', 'outros');
  end if;
end
$$;

create table if not exists public.community_finds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null check (char_length(trim(product_name)) between 2 and 140),
  location_name text not null check (char_length(trim(location_name)) between 2 and 180),
  category public.community_find_category not null default 'outros',
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  accuracy_meters double precision,
  upvotes integer not null default 0 check (upvotes >= 0),
  downvotes integer not null default 0 check (downvotes >= 0),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_community_finds_created_at on public.community_finds (created_at desc);
create index if not exists idx_community_finds_expires_at on public.community_finds (expires_at desc);
create index if not exists idx_community_finds_category on public.community_finds (category);
create index if not exists idx_community_finds_geo on public.community_finds (lat, lng);
create index if not exists idx_community_finds_user_id on public.community_finds (user_id);

create table if not exists public.community_find_votes (
  find_id uuid not null references public.community_finds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (find_id, user_id)
);

create index if not exists idx_community_find_votes_user on public.community_find_votes (user_id);
create index if not exists idx_community_find_votes_find on public.community_find_votes (find_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_community_finds on public.community_finds;
create trigger trg_set_updated_at_community_finds
before update on public.community_finds
for each row
execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_community_find_votes on public.community_find_votes;
create trigger trg_set_updated_at_community_find_votes
before update on public.community_find_votes
for each row
execute function public.set_updated_at();

create or replace function public.recompute_community_find_votes(p_find_id uuid)
returns void
language plpgsql
as $$
declare
  v_up integer := 0;
  v_down integer := 0;
begin
  select
    coalesce(sum(case when vote = 1 then 1 else 0 end), 0),
    coalesce(sum(case when vote = -1 then 1 else 0 end), 0)
  into v_up, v_down
  from public.community_find_votes
  where find_id = p_find_id;

  update public.community_finds
  set upvotes = v_up,
      downvotes = v_down
  where id = p_find_id;
end;
$$;

create or replace function public.on_community_find_vote_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_community_find_votes(old.find_id);
    return old;
  end if;

  perform public.recompute_community_find_votes(new.find_id);
  return new;
end;
$$;

drop trigger if exists trg_community_find_votes_changed on public.community_find_votes;
create trigger trg_community_find_votes_changed
after insert or update or delete on public.community_find_votes
for each row
execute function public.on_community_find_vote_change();

alter table public.community_finds enable row level security;
alter table public.community_find_votes enable row level security;

drop policy if exists "community_finds_public_read" on public.community_finds;
create policy "community_finds_public_read"
on public.community_finds
for select
to anon, authenticated
using (true);

drop policy if exists "community_finds_auth_insert" on public.community_finds;
create policy "community_finds_auth_insert"
on public.community_finds
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community_finds_owner_update" on public.community_finds;
create policy "community_finds_owner_update"
on public.community_finds
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_finds_owner_delete" on public.community_finds;
create policy "community_finds_owner_delete"
on public.community_finds
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "community_find_votes_public_read" on public.community_find_votes;
create policy "community_find_votes_public_read"
on public.community_find_votes
for select
to anon, authenticated
using (true);

drop policy if exists "community_find_votes_auth_upsert_own" on public.community_find_votes;
create policy "community_find_votes_auth_upsert_own"
on public.community_find_votes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community_find_votes_auth_update_own" on public.community_find_votes;
create policy "community_find_votes_auth_update_own"
on public.community_find_votes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_find_votes_auth_delete_own" on public.community_find_votes;
create policy "community_find_votes_auth_delete_own"
on public.community_find_votes
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.vote_community_find(
  p_find_id uuid,
  p_vote smallint
)
returns table (
  upvotes integer,
  downvotes integer,
  user_vote smallint
)
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_vote not in (-1, 0, 1) then
    raise exception 'Invalid vote. Use -1, 0 or 1.';
  end if;

  if not exists (select 1 from public.community_finds cf where cf.id = p_find_id) then
    raise exception 'Find not found';
  end if;

  if p_vote = 0 then
    delete from public.community_find_votes
    where find_id = p_find_id
      and user_id = v_user_id;
  else
    insert into public.community_find_votes (find_id, user_id, vote)
    values (p_find_id, v_user_id, p_vote)
    on conflict (find_id, user_id)
    do update set vote = excluded.vote;
  end if;

  return query
  select
    cf.upvotes,
    cf.downvotes,
    (
      select v.vote
      from public.community_find_votes v
      where v.find_id = cf.id
        and v.user_id = v_user_id
      limit 1
    )::smallint as user_vote
  from public.community_finds cf
  where cf.id = p_find_id;
end;
$$;

grant execute on function public.vote_community_find(uuid, smallint) to authenticated;
