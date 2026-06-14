-- Supabase schema for community discussions
-- Run this in your Supabase SQL editor or migration tool.

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  name text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.discussions enable row level security;

create policy "Allow public select" on public.discussions
  for select
  using (true);

create policy "Allow public insert" on public.discussions
  for insert
  with check (true);
