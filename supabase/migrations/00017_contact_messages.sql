create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_insert_public on public.contact_messages;
create policy contact_messages_insert_public
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (
    length(trim(name)) > 0 and
    length(trim(email)) > 3 and
    length(trim(subject)) > 0 and
    length(trim(message)) > 0
  );

drop policy if exists contact_messages_admin_select on public.contact_messages;
create policy contact_messages_admin_select
  on public.contact_messages
  for select
  to authenticated
  using (exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ));

