create table if not exists public.caracois_spot_requests (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid references public.caracois_spots(id) on delete set null,
  spot_name text not null check (char_length(spot_name) between 1 and 200),
  spot_address text,
  request_type text not null check (request_type in ('edit', 'delete')),
  note text not null check (char_length(note) between 5 and 1000),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists caracois_spot_requests_status_idx
  on public.caracois_spot_requests (status);

create index if not exists caracois_spot_requests_created_at_idx
  on public.caracois_spot_requests (created_at desc);

create index if not exists caracois_spot_requests_spot_id_idx
  on public.caracois_spot_requests (spot_id);

create or replace function public.set_caracois_spot_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_caracois_spot_requests_updated_at
  on public.caracois_spot_requests;

create trigger set_caracois_spot_requests_updated_at
  before update on public.caracois_spot_requests
  for each row
  execute function public.set_caracois_spot_requests_updated_at();

alter table public.caracois_spot_requests enable row level security;

revoke all on table public.caracois_spot_requests from anon, authenticated;

do $$
declare
  policy record;
begin
  for policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'caracois_spots'
      and cmd in ('UPDATE', 'DELETE', 'ALL')
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

drop policy if exists caracois_spots_public_insert on public.caracois_spots;
create policy caracois_spots_public_insert
  on public.caracois_spots
  for insert
  to anon
  with check (true);
