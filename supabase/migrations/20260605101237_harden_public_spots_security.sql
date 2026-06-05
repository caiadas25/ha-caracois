alter table public.caracois_spots enable row level security;
alter table public.caracois_spots force row level security;

revoke all on table public.caracois_spots from anon, authenticated;
grant select on table public.caracois_spots to anon;

do $$
declare
  policy record;
begin
  for policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'caracois_spots'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy if exists %I on public.caracois_spots', policy.policyname);
  end loop;
end;
$$;

drop policy if exists caracois_spots_public_read on public.caracois_spots;
create policy caracois_spots_public_read
  on public.caracois_spots
  for select
  to anon
  using (true);

alter table public.caracois_spots
  drop constraint if exists caracois_spots_name_length_check,
  drop constraint if exists caracois_spots_lat_check,
  drop constraint if exists caracois_spots_lng_check,
  drop constraint if exists caracois_spots_address_length_check,
  drop constraint if exists caracois_spots_price_check,
  drop constraint if exists caracois_spots_price_imperial_check,
  drop constraint if exists caracois_spots_service_type_check,
  drop constraint if exists caracois_spots_serving_size_check,
  drop constraint if exists caracois_spots_rating_check,
  drop constraint if exists caracois_spots_notes_length_check,
  drop constraint if exists caracois_spots_osm_id_length_check;

alter table public.caracois_spots
  add constraint caracois_spots_name_length_check
    check (name is not null and char_length(btrim(name)) between 1 and 200) not valid,
  add constraint caracois_spots_lat_check
    check (lat is not null and lat between -90 and 90) not valid,
  add constraint caracois_spots_lng_check
    check (lng is not null and lng between -180 and 180) not valid,
  add constraint caracois_spots_address_length_check
    check (address is null or char_length(address) <= 1000) not valid,
  add constraint caracois_spots_price_check
    check (price is null or (price >= 0 and price <= 999)) not valid,
  add constraint caracois_spots_price_imperial_check
    check (
      price_imperial is null
      or (price_imperial >= 0 and price_imperial <= 999)
    ) not valid,
  add constraint caracois_spots_service_type_check
    check (
      service_type is not null
      and service_type in ('restaurante', 'takeaway')
    ) not valid,
  add constraint caracois_spots_serving_size_check
    check (
      service_type is not null
      and serving_size is not null
      and (
        (
          service_type = 'restaurante'
          and serving_size in ('pires', 'prato', 'travessa')
        )
        or (
          service_type = 'takeaway'
          and serving_size in ('pequena', 'media', 'grande')
        )
      )
    ) not valid,
  add constraint caracois_spots_rating_check
    check (rating is not null and rating between 0 and 5) not valid,
  add constraint caracois_spots_notes_length_check
    check (notes is null or char_length(notes) <= 2000) not valid,
  add constraint caracois_spots_osm_id_length_check
    check (osm_id is null or char_length(osm_id) <= 100) not valid;
