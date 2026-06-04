-- Admin request queue for anonymous edit/delete suggestions.
create table if not exists public.caracois_spot_requests (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.caracois_spots(id) on delete cascade,
  request_type text not null check (request_type in ('edit', 'delete')),
  note text not null check (char_length(note) between 1 and 600),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.caracois_spot_requests enable row level security;

-- Public users can submit requests without signing in.
create policy "Anyone can submit spot admin requests"
on public.caracois_spot_requests
for insert
to anon, authenticated
with check (
  request_type in ('edit', 'delete')
  and char_length(note) between 1 and 600
);

-- Do not add anon/authenticated SELECT policies for this table. The /admin page
-- reads it with SUPABASE_SERVICE_ROLE_KEY on the server, which bypasses RLS.

create index if not exists caracois_spot_requests_created_at_idx
on public.caracois_spot_requests (created_at desc);

create index if not exists caracois_spot_requests_spot_id_idx
on public.caracois_spot_requests (spot_id);
