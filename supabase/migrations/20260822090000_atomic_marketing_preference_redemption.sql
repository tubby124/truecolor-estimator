-- A preference token must be redeemed and the customer preference updated in
-- one transaction. Claiming a token first and writing the preference second can
-- strand a customer if the second write fails.
create or replace function public.redeem_marketing_preference_token(
  p_token text,
  p_choice text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  redeemed_customer_id uuid;
  redeemed_at timestamptz := now();
begin
  if p_choice not in ('accept', 'decline') then
    raise exception 'Invalid marketing preference choice';
  end if;

  with claimed as (
    update public.marketing_preference_tokens
    set used_at = redeemed_at
    where token = p_token
      and purpose = 'historical_repermission'
      and used_at is null
      and expires_at > redeemed_at
    returning customer_id
  )
  update public.customers as customer
  set
    marketing_consent = p_choice = 'accept',
    consent_at = redeemed_at,
    consent_source = 'historical_repermission',
    consent_version = 'marketing-v1-2026-08',
    consent_withdrawn_at = case when p_choice = 'accept' then null else redeemed_at end
  from claimed
  where customer.id = claimed.customer_id
  returning customer.id into redeemed_customer_id;

  return redeemed_customer_id is not null;
end;
$$;

revoke all on function public.redeem_marketing_preference_token(text, text)
  from public, anon, authenticated;
grant execute on function public.redeem_marketing_preference_token(text, text)
  to service_role;
