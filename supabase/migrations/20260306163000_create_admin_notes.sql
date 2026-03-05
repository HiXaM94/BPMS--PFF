-- Admin / HR evaluation notes visible to managers & employees
create table if not exists public.admin_notes (
  id                uuid primary key default gen_random_uuid(),
  entreprise_id     uuid not null references entreprises(id) on delete cascade,
  target_user_id    uuid not null references users(id) on delete cascade,
  audience          text not null check (audience in ('TEAM_MANAGER','EMPLOYEE')),
  author_id         uuid not null references users(id) on delete set null,
  author_role       text not null check (author_role in ('ADMIN','HR')),
  title             text not null,
  body              text not null,
  severity          text default 'info' check (severity in ('info','warning','critical')),
  is_acknowledged   boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '60 days')
);

create index if not exists idx_admin_notes_target_user on public.admin_notes(target_user_id, is_acknowledged);
create index if not exists idx_admin_notes_expires_at on public.admin_notes(expires_at);

alter table public.admin_notes enable row level security;

create policy if not exists admin_notes_admin_write
  on public.admin_notes
  for all
  using (is_admin_or_hr())
  with check (is_admin_or_hr());

create policy if not exists admin_notes_target_read
  on public.admin_notes
  for select
  using (
    target_user_id = auth.uid()
    or (audience = 'TEAM_MANAGER' and is_manager())
  );

create or replace function public.purge_expired_admin_notes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.admin_notes where expires_at < now();
  return null;
end;
$$;

drop trigger if exists trg_admin_notes_autopurge on public.admin_notes;

create trigger trg_admin_notes_autopurge
  before insert or update or delete on public.admin_notes
  for each statement execute function public.purge_expired_admin_notes();
