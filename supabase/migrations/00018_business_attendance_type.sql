alter table public.businesses
add column if not exists attendance_type text not null default 'presencial';

alter table public.businesses
drop constraint if exists businesses_attendance_type_check;

alter table public.businesses
add constraint businesses_attendance_type_check
check (attendance_type in ('presencial', 'online', 'hibrido'));

create index if not exists idx_businesses_attendance_type
on public.businesses(attendance_type);
