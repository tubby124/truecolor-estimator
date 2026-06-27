alter table order_items
  add column if not exists proof_url text;
