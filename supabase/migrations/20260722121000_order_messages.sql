-- Durable order-linked email message ledger. This table is intentionally
-- service-role-only: staff access is mediated by authenticated server routes,
-- while crons and signed webhooks use createServiceClient().

set lock_timeout = '5s';
create table if not exists public.order_messages (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references public.orders(id) on delete restrict,
  customer_id              uuid references public.customers(id) on delete set null,
  direction                text not null check (direction in ('outbound', 'inbound')),
  status                   text not null check (
    status in (
      'sending',
      'pending_confirmation',
      'sent',
      'delivered',
      'delivery_delayed',
      'bounced',
      'complained',
      'failed',
      'received'
    )
  ),
  from_address             text not null,
  to_address               text not null,
  subject                  text not null,
  body_text                text not null,
  staff_actor              text,
  client_request_id        uuid,
  provider_message_id      text,
  gmail_mailbox            text,
  gmail_message_id         text,
  gmail_thread_id          text,
  rfc_message_id           text,
  in_reply_to              text,
  references_header        text,
  recipient_header         text,
  sender_matches_customer  boolean,
  is_auto_reply            boolean not null default false,
  sent_at                  timestamptz,
  received_at              timestamptz,
  delivered_at             timestamptz,
  opened_at                timestamptz,
  bounced_at               timestamptz,
  complained_at            timestamptz,
  delivery_delayed_at      timestamptz,
  replied_at               timestamptz,
  processing_started_at    timestamptz,
  notification_started_at  timestamptz,
  processed_at             timestamptz,
  notified_at              timestamptz,
  last_event_detail        text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint order_messages_direction_status_check check (
    (direction = 'outbound' and status <> 'received')
    or (direction = 'inbound' and status = 'received')
  ),
  constraint order_messages_direction_identifiers_check check (
    (direction = 'outbound' and client_request_id is not null)
    or (
      direction = 'inbound'
      and gmail_mailbox is not null
      and gmail_message_id is not null
    )
  )
);
create unique index if not exists order_messages_client_request_unique_idx
  on public.order_messages (client_request_id);
create unique index if not exists order_messages_provider_message_unique_idx
  on public.order_messages (provider_message_id);
create unique index if not exists order_messages_gmail_message_unique_idx
  on public.order_messages (gmail_mailbox, gmail_message_id);
create index if not exists order_messages_order_created_idx
  on public.order_messages (order_id, created_at desc);
create index if not exists order_messages_customer_created_idx
  on public.order_messages (customer_id, created_at desc);
create index if not exists order_messages_status_created_idx
  on public.order_messages (status, created_at desc);
comment on table public.order_messages is
  'Service-only ledger for outbound order emails, Resend delivery events, and inbound Gmail replies.';
alter table public.order_messages enable row level security;
-- Claim one post-ingestion stage at a time. A short lease prevents concurrent
-- cron/manual runs from duplicating side effects while allowing recovery after
-- a worker crash. Only the service role may call this RPC.
create or replace function public.claim_order_message_stage(
  p_message_id uuid,
  p_stage text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_id uuid;
begin
  if p_stage = 'process' then
    update public.order_messages
    set processing_started_at = now(), updated_at = now()
    where id = p_message_id
      and direction = 'inbound'
      and processed_at is null
      and (
        processing_started_at is null
        or processing_started_at < now() - interval '10 minutes'
      )
    returning id into claimed_id;
  elsif p_stage = 'notify' then
    update public.order_messages
    set notification_started_at = now(), updated_at = now()
    where id = p_message_id
      and direction = 'inbound'
      and processed_at is not null
      and notified_at is null
      and (
        notification_started_at is null
        or notification_started_at < now() - interval '10 minutes'
      )
    returning id into claimed_id;
  else
    raise exception 'Invalid order message stage';
  end if;

  return claimed_id is not null;
end;
$$;
revoke all on function public.claim_order_message_stage(uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_order_message_stage(uuid, text)
  to service_role;
