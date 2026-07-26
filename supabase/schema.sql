create table if not exists public.dashboard_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  clocks jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_states enable row level security;

drop policy if exists "Users can read their dashboard" on public.dashboard_states;
create policy "Users can read their dashboard"
on public.dashboard_states for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their dashboard" on public.dashboard_states;
create policy "Users can create their dashboard"
on public.dashboard_states for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their dashboard" on public.dashboard_states;
create policy "Users can update their dashboard"
on public.dashboard_states for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their dashboard" on public.dashboard_states;
create policy "Users can delete their dashboard"
on public.dashboard_states for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.dashboard_states from anon;
grant select, insert, update, delete on table public.dashboard_states to authenticated;
