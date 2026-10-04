-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table if not exists public.readings (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  filename    text,
  machine     text not null,
  machine_id  text not null,
  score       double precision not null,
  threshold   double precision,
  ratio       double precision,
  decision    text not null,
  duration_s  double precision,
  frame_scores jsonb
);
create index if not exists readings_created_at_idx on public.readings (created_at desc);
-- Row Level Security ON with no policies = the public/anon key can NOT read or write.
-- Only the server (service/secret key, kept in Vercel env vars) can.
alter table public.readings enable row level security;
