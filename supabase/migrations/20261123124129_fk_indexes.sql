-- Cover the actor foreign keys flagged by the performance advisor.
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists companies_created_by_idx on public.companies (created_by);
create index if not exists companies_verified_by_idx on public.companies (verified_by);
create index if not exists invites_company_idx on public.invites (company_id);
create index if not exists invites_invited_by_idx on public.invites (invited_by);
create index if not exists time_logs_approved_by_idx on public.time_logs (approved_by);
