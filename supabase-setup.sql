-- Run this in your Supabase SQL editor (https://app.supabase.com → SQL Editor)

-- 1. Create the sessions table
create table if not exists sessions (
  id     text primary key,
  pin    text not null,
  status text not null default 'waiting',
  data   jsonb not null,
  created_at timestamptz default now()
);

create index if not exists sessions_pin_status_idx on sessions(pin, status);

-- 2. Enable Row Level Security
alter table sessions enable row level security;

-- Allow all reads (needed for Realtime subscriptions via anon key)
create policy "Public read" on sessions for select using (true);

-- 3. Add the table to the Realtime publication
-- (This enables Postgres Changes for Supabase Realtime)
alter publication supabase_realtime add table sessions;
