-- Busca geoespacial por raio com PostGIS (fase 1)

create extension if not exists postgis;

-- Índice geoespacial por expressão usando lat/lng existentes
create index if not exists idx_businesses_geog
  on public.businesses
  using gist ((st_setsrid(st_makepoint(lng, lat), 4326)::geography));

create or replace function public.search_businesses_radius(
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_radius_km double precision default 50,
  p_limit integer default 200,
  p_offset integer default 0,
  p_category_id text default null,
  p_country_code text default null,
  p_state_code text default null
)
returns table (
  business_id uuid,
  distance_km double precision
)
language sql
stable
set search_path = public
as $$
  with params as (
    select
      st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography as origin_geog,
      greatest(coalesce(p_radius_km, 50), 0) * 1000 as radius_m
  )
  select
    b.id as business_id,
    st_distance(
      st_setsrid(st_makepoint(b.lng, b.lat), 4326)::geography,
      p.origin_geog
    ) / 1000.0 as distance_km
  from public.businesses b
  cross join params p
  where
    b.lat is not null
    and b.lng is not null
    and st_dwithin(
      st_setsrid(st_makepoint(b.lng, b.lat), 4326)::geography,
      p.origin_geog,
      p.radius_m
    )
    and (p_category_id is null or b.category_id = p_category_id)
    and (p_country_code is null or lower(b.country_code) = lower(p_country_code))
    and (p_state_code is null or lower(b.state_code) = lower(p_state_code))
  order by distance_km asc
  limit least(greatest(coalesce(p_limit, 200), 1), 500)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.search_businesses_radius(
  double precision,
  double precision,
  double precision,
  integer,
  integer,
  text,
  text,
  text
) to anon, authenticated;
