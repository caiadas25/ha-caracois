drop policy if exists caracois_public_read on public.caracois_spots;

alter table public.caracois_spots
  validate constraint caracois_spots_name_length_check,
  validate constraint caracois_spots_lat_check,
  validate constraint caracois_spots_lng_check,
  validate constraint caracois_spots_address_length_check,
  validate constraint caracois_spots_price_check,
  validate constraint caracois_spots_price_imperial_check,
  validate constraint caracois_spots_service_type_check,
  validate constraint caracois_spots_serving_size_check,
  validate constraint caracois_spots_rating_check,
  validate constraint caracois_spots_notes_length_check,
  validate constraint caracois_spots_osm_id_length_check;
