create table if not exists public.community_find_messages (
  id uuid primary key default gen_random_uuid(),
  find_id uuid not null references public.community_finds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 800),
  created_at timestamptz not null default now()
);

create index if not exists idx_community_find_messages_find_id_created_at
  on public.community_find_messages (find_id, created_at asc);

alter table public.community_find_messages enable row level security;

drop policy if exists "community_find_messages_public_read" on public.community_find_messages;
create policy "community_find_messages_public_read"
on public.community_find_messages
for select
to anon, authenticated
using (true);

drop policy if exists "community_find_messages_auth_insert_own" on public.community_find_messages;
create policy "community_find_messages_auth_insert_own"
on public.community_find_messages
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community_find_messages_owner_delete" on public.community_find_messages;
create policy "community_find_messages_owner_delete"
on public.community_find_messages
for delete
to authenticated
using (auth.uid() = user_id);
