-- Grant invitations table and RLS (v2)

-- Ensure pgcrypto for gen_random_uuid
create extension if not exists "pgcrypto";

-- Table definition (grants.grant_id is integer)
create table if not exists public.grant_invitations (
  id uuid primary key default gen_random_uuid(),
  grant_id integer not null references public.grants(grant_id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references public.users(uid),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz default (now() + interval '7 days')
);

-- Helpful indexes
create index if not exists grant_invitations_grant_id_idx on public.grant_invitations (grant_id);
create index if not exists grant_invitations_email_idx on public.grant_invitations (lower(invited_email));
create index if not exists grant_invitations_token_idx on public.grant_invitations (token);

-- Enable RLS
alter table public.grant_invitations enable row level security;

-- Policy: allow grant owners/admins to create invites
drop policy if exists invite_create_by_grant_managers on public.grant_invitations;
create policy invite_create_by_grant_managers
  on public.grant_invitations
  for insert
  to authenticated
  with check (
    public.is_admin_for_grant(grant_invitations.grant_id)
    or (select auth.role()) = 'service_role'
  );

-- Policy: allow owners/admins to read invites for their grant
drop policy if exists invite_read_by_grant_managers on public.grant_invitations;
create policy invite_read_by_grant_managers
  on public.grant_invitations
  for select
  to authenticated
  using (
    public.is_admin_for_grant(grant_invitations.grant_id)
    or (select auth.role()) = 'service_role'
  );

-- Policy: allow invitee to read their invite via email or token (for acceptance flows)
drop policy if exists invite_read_by_invited_email_or_token on public.grant_invitations;
create policy invite_read_by_invited_email_or_token
  on public.grant_invitations
  for select
  to anon, authenticated
  using (
    (lower(invited_email) = lower(current_setting('request.jwt.claim.email', true)))
    or (token = current_setting('request.headers.x-invite-token', true))
  );

-- Policy: allow invitee to mark accepted (status/accepted_at) when token matches and pending/not expired
drop policy if exists invite_update_accept on public.grant_invitations;
create policy invite_update_accept
  on public.grant_invitations
  for update
  to anon, authenticated
  using (
    token = current_setting('request.headers.x-invite-token', true)
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  )
  with check (status in ('accepted','expired'));
