-- Consent provenance makes the customer's affirmative choice auditable without
-- treating a policy page visit, a purchase, or a pre-ticked box as consent.
alter table public.customers
  add column if not exists consent_source text,
  add column if not exists consent_version text,
  add column if not exists consent_withdrawn_at timestamptz;

comment on column public.customers.consent_source is
  'Where the affirmative marketing choice occurred: checkout, account_preferences, or historical_repermission.';
comment on column public.customers.consent_version is
  'Version of the customer-visible marketing-consent text accepted.';
