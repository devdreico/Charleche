# SQL a ejecutar en el Editor SQL de Supabase (https://supabase.com)

create table if not exists public.feedings (
  id uuid primary key default gen_random_uuid(),
  fed_at timestamptz not null default now(),
  amount numeric not null default 0,
  kind text not null default 'leche',
  note text default '',
  created_at timestamptz not null default now()
);

alter table public.feedings enable row level security;

-- Acceso anónimo sin login (adecuado para uso familiar).
create policy "anon insert" on public.feedings
  for insert to anon with check (true);

create policy "anon read" on public.feedings
  for select to anon using (true);

create policy "anon delete" on public.feedings
  for delete to anon using (true);

create index if not exists idx_feedings_fed_at on public.feedings (fed_at);