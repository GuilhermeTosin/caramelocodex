create table if not exists public.community_find_reports (
  id uuid primary key default gen_random_uuid(),
  find_id uuid not null references public.community_finds(id) on delete cascade,
  reported_message_id uuid references public.community_find_messages(id) on delete set null,
  reporter_user_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('spam','abuso','fraude','ofensivo','desinformacao','outro')),
  details text,
  status text not null default 'pending' check (status in ('pending','reviewing','resolved','rejected')),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_find_reports_created_at
  on public.community_find_reports (created_at desc);
create index if not exists idx_community_find_reports_find_id
  on public.community_find_reports (find_id);
create index if not exists idx_community_find_reports_archived_at
  on public.community_find_reports (archived_at);

alter table public.community_find_reports enable row level security;

drop policy if exists "community_find_reports_auth_insert" on public.community_find_reports;
create policy "community_find_reports_auth_insert"
on public.community_find_reports
for insert
to authenticated
with check (auth.uid() = reporter_user_id);

drop policy if exists "community_find_reports_admin_select" on public.community_find_reports;
create policy "community_find_reports_admin_select"
on public.community_find_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "community_find_reports_admin_update" on public.community_find_reports;
create policy "community_find_reports_admin_update"
on public.community_find_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
