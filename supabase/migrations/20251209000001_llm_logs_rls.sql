-- Migration: Allow grant members to insert LLM logs for their own transactions
-- Previously only service_role could manage llm_logs; now authenticated users can insert
-- logs for transactions they entered in grants they belong to.

-- Drop the existing service-only policy
drop policy if exists llm_logs_manage_service on public.llm_logs;

-- Allow authenticated users to insert logs for transactions they own (via grant membership)
create policy llm_logs_insert_member
  on public.llm_logs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.transactions t
      join public.grant_memberships gm on gm.grant_id = t.grant_id
      where t.transaction_id = llm_logs.transaction_id
        and gm.user_id = auth.uid()
    )
  );

-- Allow authenticated users to read logs for transactions in their grants
create policy llm_logs_read_member
  on public.llm_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.transactions t
      join public.grant_memberships gm on gm.grant_id = t.grant_id
      where t.transaction_id = llm_logs.transaction_id
        and gm.user_id = auth.uid()
    )
  );

-- Service role retains full access (insert/update/delete)
create policy llm_logs_service_full
  on public.llm_logs
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');
