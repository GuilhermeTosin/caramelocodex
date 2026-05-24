alter table public.community_find_messages
add column if not exists parent_message_id uuid references public.community_find_messages(id) on delete set null;

alter table public.community_find_messages
add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_set_updated_at_community_find_messages on public.community_find_messages;
create trigger trg_set_updated_at_community_find_messages
before update on public.community_find_messages
for each row
execute function public.set_updated_at();

drop policy if exists "community_find_messages_owner_update" on public.community_find_messages;
create policy "community_find_messages_owner_update"
on public.community_find_messages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
