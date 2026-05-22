create table if not exists sessions (
  id     text primary key,
  pin    text not null,
  status text not null default 'waiting',
  data   jsonb not null,
  created_at timestamptz default now()
);

create index if not exists sessions_pin_status_idx on sessions(pin, status);

alter table sessions enable row level security;

create policy "Public read" on sessions for select using (true);

alter publication supabase_realtime add table sessions;
