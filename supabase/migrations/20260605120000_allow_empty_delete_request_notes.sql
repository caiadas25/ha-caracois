alter table public.caracois_spot_requests
  drop constraint if exists caracois_spot_requests_note_check;

alter table public.caracois_spot_requests
  add constraint caracois_spot_requests_note_check
  check (
    char_length(note) <= 1000
    and (
      request_type = 'delete'
      or char_length(note) >= 5
    )
  );
