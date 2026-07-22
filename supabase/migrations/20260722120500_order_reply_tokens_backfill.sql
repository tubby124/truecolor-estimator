-- The trigger installed in the preceding migration covers orders created while
-- this statement runs. FK checks may briefly contend with deletion of the same
-- order, but normal inserts and non-key updates remain available.

set lock_timeout = '5s';

insert into public.order_reply_tokens (order_id)
select id
from public.orders
on conflict (order_id) do nothing;
