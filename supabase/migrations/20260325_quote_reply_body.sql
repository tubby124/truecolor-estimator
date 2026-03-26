-- Store what staff actually sent back to the customer
-- (plain text reply, or "[Price quote sent] ..." summary from the quote builder)
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS reply_body TEXT DEFAULT NULL;
