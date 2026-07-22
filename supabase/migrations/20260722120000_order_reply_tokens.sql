-- 2026-07-22 — Opaque order email reply tokens
--
-- Keep tokens in a new one-to-one table instead of rewriting or indexing the
-- live orders table. A trigger covers new orders; the next migration backfills
-- existing order IDs without locking them against normal writes.

create extension if not exists pgcrypto with schema extensions;

set lock_timeout = '5s';

create table if not exists public.order_reply_tokens (
  order_id    uuid primary key references public.orders(id) on delete cascade,
  reply_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at  timestamptz not null default now(),
  constraint order_reply_tokens_token_unique unique (reply_token),
  constraint order_reply_tokens_token_format_check
    check (reply_token ~ '^[0-9a-f]{32}$')
);

comment on table public.order_reply_tokens is
  'Service-only opaque tokens for associating inbound email replies with orders.';

alter table public.order_reply_tokens enable row level security;

create or replace function public.create_order_reply_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.order_reply_tokens (order_id)
  values (new.id)
  on conflict (order_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_order_reply_token() from public, anon, authenticated;

drop trigger if exists orders_create_reply_token on public.orders;
create trigger orders_create_reply_token
  after insert on public.orders
  for each row execute function public.create_order_reply_token();
