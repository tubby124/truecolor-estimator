-- Harden audit_events before it is used as Google Ads activation evidence.
-- API roles must not be able to read, forge, update, or delete audit records.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.audit_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.audit_events FROM service_role;
GRANT SELECT, INSERT ON TABLE public.audit_events TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS audit_events_google_ads_monitor_heartbeat_uidx
  ON public.audit_events (event_type, entity_id)
  WHERE event_type = 'google_ads.monitor.heartbeat';

COMMENT ON INDEX public.audit_events_google_ads_monitor_heartbeat_uidx IS
  'Prevents replay or duplication of persisted Google Ads monitor heartbeat IDs.';
