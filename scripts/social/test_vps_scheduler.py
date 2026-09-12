import importlib.util
import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('runner', Path(__file__).with_name('vps-scheduler.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class RunnerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / 'state.json'
        self.config = {'ids': [f'00000000-0000-0000-0000-{n:012d}' for n in range(6)], 'enabled': True, 'notBefore': '2026-09-06T14:00:00Z', 'expiresAt': '2026-09-07T02:00:00Z'}
        self.now = r.instant('2026-09-06T15:00:00Z')
        self.waiting = {'ok': True, 'held': False, 'complete': False, 'total': 6, 'counts': {'ready': 6}, 'publishingEnabled': True, 'nextTimes': ['2026-09-06T15:00:00Z']}

    def run_case(self, send, **kw):
        return r.execute(self.config, self.path, now=self.now, send=send, notify=kw.pop("notify", Mock()), clock=kw.pop("clock", lambda: self.now), **kw)

    def test_check_crossing_expiry_never_dispatches(self):
        send = Mock(return_value=self.waiting)
        self.assertEqual(self.run_case(send, clock=lambda: r.instant(self.config['expiresAt'])), 0)
        send.assert_called_once_with(self.config, True)
        self.assertEqual(json.loads(self.path.read_text())['phase'], 'waiting')

    def test_uncertain_submission_is_never_retried(self):
        send = Mock(side_effect=[self.waiting, TimeoutError()])
        self.assertEqual(self.run_case(send), 1)
        self.assertEqual(self.run_case(send), 1)
        self.assertEqual(send.call_args_list[1].args, (self.config, False))
        self.assertTrue(all(call.args[1] for call in send.call_args_list[2:]))

    def test_journal_exists_before_request_and_crash_blocks(self):
        def crash(*args):
            self.assertEqual(json.loads(self.path.read_text())['phase'], 'in_flight')
            raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):
            self.run_case(crash)
        send = Mock(return_value=self.waiting)
        self.assertEqual(self.run_case(send), 1)
        send.assert_called_once_with(self.config, True)

    def test_expired_or_disabled_never_calls(self):
        send = Mock()
        self.config['expiresAt'] = '2026-09-06T15:00:00Z'
        self.assertEqual(self.run_case(send), 0)
        self.config['enabled'] = False
        self.assertEqual(self.run_case(send), 0)
        send.assert_not_called()

    def test_future_polls_read_only(self):
        self.waiting['nextTimes'] = ['2026-09-06T19:00:00Z']
        send = Mock(return_value=self.waiting)
        self.run_case(send)
        send.assert_called_once_with(self.config, True)

    def test_check_does_not_write_or_clear_hold(self):
        r.persist(self.path, {'fingerprint': 'old', 'phase': 'blocked'})
        before = self.path.read_bytes()
        send = Mock(return_value=self.waiting)
        self.run_case(send, check=True)
        self.assertEqual(self.path.read_bytes(), before)
        send.assert_called_once_with(self.config, True)

    def test_changed_config_does_not_clear_hold(self):
        r.persist(self.path, {'fingerprint': 'old', 'phase': 'waiting'})
        send = Mock()
        self.assertEqual(self.run_case(send), 1)
        send.assert_not_called()

    def test_held_and_complete_stop_calls(self):
        for held, complete in [(True, False), (False, True)]:
            self.path.unlink(missing_ok=True)
            send = Mock(return_value={**self.waiting, 'held': held, 'complete': complete})
            self.run_case(send)
            self.run_case(send)
            self.assertEqual(send.call_count, 1)
        self.assertTrue(all(call.args[1] for call in send.call_args_list))

    def test_notification_failure_retries_without_republishing(self):
        receipt = {'id': self.config['ids'][0], 'platform': 'facebook', 'status': 'posted', 'scheduleTime': '2026-09-06T15:00:00Z', 'publicUrl': 'https://www.facebook.com/123_456'}
        done = {**self.waiting, 'complete': True, 'receipts': [receipt]}
        send = Mock(side_effect=[self.waiting, done])
        notify = Mock(side_effect=[TimeoutError(), None])
        self.assertEqual(self.run_case(send, notify=notify), 0)
        self.assertEqual(json.loads(self.path.read_text())['phase'], 'complete')
        self.assertEqual(self.run_case(send, notify=notify), 0)
        self.run_case(send, notify=notify)
        self.assertEqual([call.args[1] for call in send.call_args_list], [True, False])
        self.assertEqual(notify.call_count, 2)
        self.assertIn(receipt['publicUrl'], notify.call_args.args[0])
        self.assertTrue(all(e['sent'] for e in json.loads(self.path.with_name('notifications.json').read_text()).values()))

    def test_rejects_non_slack_webhook_credential(self):
        credentials = Path(self.tmp.name) / 'credentials'
        credentials.mkdir()
        (credentials / 'slack-webhook').write_text('https://example.com/not-slack\n')
        with patch.dict(r.os.environ, {'CREDENTIALS_DIRECTORY': str(credentials)}):
            with self.assertRaisesRegex(ValueError, 'Invalid Slack credential'):
                r.slack('notification')

    def test_partial_success_notice_has_only_verified_link_and_hold(self):
        receipts = [
            {'id': self.config['ids'][0], 'platform': 'facebook', 'status': 'posted', 'scheduleTime': '2026-09-06T15:00:00Z', 'publicUrl': 'https://www.facebook.com/123_456'},
            {'id': self.config['ids'][1], 'platform': 'instagram', 'status': 'posting', 'scheduleTime': '2026-09-06T15:00:00Z', 'publicUrl': 'https://www.instagram.com/p/unconfirmed/'},
        ]
        notify = Mock()
        send = Mock(return_value={**self.waiting, 'held': True, 'receipts': receipts})
        self.run_case(send, notify=notify)
        self.run_case(send, notify=notify)
        self.assertEqual(notify.call_count, 2)  # one pair update and one deduplicated hold
        message = notify.call_args_list[0].args[0]
        self.assertIn('https://www.facebook.com/123_456', message)
        self.assertIn('Instagram: HELD', message)
        self.assertNotIn('unconfirmed', message)
        self.assertTrue(all(call.args[1] for call in send.call_args_list))

    def test_expiry_retries_notifications_without_endpoint_requests(self):
        self.config['expiresAt'] = '2026-09-06T15:00:00Z'
        send, notify = Mock(), Mock(side_effect=[TimeoutError(), None])
        self.run_case(send, notify=notify)
        self.run_case(send, notify=notify)
        send.assert_not_called()
        self.assertEqual(notify.call_count, 2)
        self.assertIn('expired', notify.call_args.args[0])

    def final_result(self):
        return {**self.waiting, 'complete': True, 'receipts': [{'id': self.config['ids'][0], 'platform': 'facebook', 'status': 'posted', 'scheduleTime': '2026-09-06T15:00:00Z', 'publicUrl': 'https://www.facebook.com/123_456'}]}

    def test_crash_after_complete_commit_recovers_notification_without_network(self):
        send, notify = Mock(side_effect=[self.waiting, self.final_result()]), Mock()
        original = r.notifications
        def crash(path, config, result=None, alert=None, notify=None):
            if result and result.get('complete'):
                raise KeyboardInterrupt()
            return original(path, config, result, alert, notify)
        from unittest.mock import patch
        with patch.object(r, 'notifications', side_effect=crash):
            with self.assertRaises(KeyboardInterrupt):
                self.run_case(send, notify=notify)
        self.assertEqual(json.loads(self.path.read_text())['phase'], 'complete')
        self.run_case(send, notify=notify)
        self.assertEqual(send.call_count, 2)
        notify.assert_called_once()
        self.assertIn('https://www.facebook.com/123_456', notify.call_args.args[0])

    def test_outbox_storage_failure_does_not_lose_terminal_receipt(self):
        from unittest.mock import patch
        send, notify = Mock(side_effect=[self.waiting, self.final_result()]), Mock()
        with patch.object(r, 'notifications', side_effect=OSError()):
            self.run_case(send, notify=notify)
        self.assertEqual(json.loads(self.path.read_text())['phase'], 'complete')
        self.run_case(send, notify=notify)
        self.assertEqual(send.call_count, 2)
        notify.assert_called_once()

    def test_uncertain_final_delivery_recovers_readonly_after_expiry(self):
        self.config['expiresAt'] = '2026-09-06T15:00:00Z'
        r.persist(self.path, {'fingerprint': r.fingerprint(self.config), 'phase': 'in_flight'})
        send, notify = Mock(return_value=self.final_result()), Mock()
        self.run_case(send, notify=notify)
        self.run_case(send, notify=notify)
        send.assert_called_once_with(self.config, True)
        self.assertEqual(json.loads(self.path.read_text())['phase'], 'complete')
        notify.assert_called_once()

    def test_local_crash_hold_notifies_when_remote_rows_are_still_ready(self):
        r.persist(self.path, {'fingerprint': r.fingerprint(self.config), 'phase': 'in_flight'})
        send, notify = Mock(return_value=self.waiting), Mock()
        self.run_case(send, notify=notify)
        self.run_case(send, notify=notify)
        send.assert_called_once_with(self.config, True)
        notify.assert_called_once()
        self.assertIn('HELD', notify.call_args.args[0])

    def test_config_rejects_missing_duplicate_or_extra_ids(self):
        for ids in [[], self.config['ids'][:5], self.config['ids'] + ['bad'], [self.config['ids'][0]] * 6]:
            cfg = Path(self.tmp.name) / 'config.json'
            cfg.write_text(json.dumps({**self.config, 'ids': ids}))
            with self.assertRaises(ValueError):
                r.config_read(cfg)



class OngoingRunnerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / 'ongoing-state.json'
        self.config = {'runner': 'ongoing', 'businessId': '00000000-0000-4000-8000-000000000001', 'enabled': True, 'pilotReconciled': True, 'postIds': ['00000000-0000-4000-8000-000000000002']}
        self.ready = {'ok': True, 'runner': 'ongoing', 'businessId': self.config['businessId'], 'publishingEnabled': True, 'held': False, 'pending': False, 'due': 1}

    def test_read_timeout_recovers_next_tick_without_hold(self):
        send = Mock(side_effect=[TimeoutError(), self.ready, self.ready])
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 1)
        self.assertFalse(self.path.exists())
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 0)
        self.assertEqual([c.args[1] for c in send.call_args_list], [True, True, False])

    def test_idle_never_dispatches_or_claims(self):
        send = Mock(return_value={**self.ready, 'due': 0})
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 0)
        send.assert_called_once_with(self.config, True)
        self.assertFalse(self.path.exists())

    def test_remote_hold_never_dispatches_or_permanently_locks(self):
        send = Mock(return_value={**self.ready, 'held': True})
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 1)
        self.assertFalse(self.path.exists())
        send.assert_called_once_with(self.config, True)

    def test_config_requires_explicit_pilot_reconciliation(self):
        path = Path(self.tmp.name) / 'config.json'
        path.write_text(json.dumps({**self.config, 'pilotReconciled': False}))
        with self.assertRaises(ValueError):
            r.config_read(path)
        path.write_text(json.dumps(self.config))
        self.assertEqual(r.config_read(path), self.config)

    def test_paused_and_disabled_never_dispatch(self):
        send = Mock(return_value={**self.ready, 'publishingEnabled': False})
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 0)
        send.assert_called_once_with(self.config, True)
        send.reset_mock()
        self.assertEqual(r.execute_ongoing({**self.config, 'enabled': False}, self.path, send=send), 0)
        send.assert_not_called()

    def test_unknown_dispatch_response_remains_read_only_after_restart(self):
        send = Mock(side_effect=[self.ready, TimeoutError(), self.ready])
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 1)
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 1)
        self.assertEqual([c.args[1] for c in send.call_args_list], [True, False, True])

    def test_crash_during_dispatch_leaves_durable_claim(self):
        def send(config, check):
            if not check:
                self.assertEqual(json.loads(self.path.read_text())['phase'], 'in_flight')
                raise KeyboardInterrupt()
            return self.ready
        with self.assertRaises(KeyboardInterrupt):
            r.execute_ongoing(self.config, self.path, send=send)
        read = Mock(return_value=self.ready)
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=read), 1)
        read.assert_called_once_with(self.config, True)

    def test_successful_cycles_continue_and_check_never_writes(self):
        send = Mock(return_value=self.ready)
        self.assertEqual(r.execute_ongoing(self.config, self.path, check=True, send=send), 0)
        self.assertFalse(self.path.exists())
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 0)
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 0)
        self.assertEqual(json.loads(self.path.read_text())['phase'], 'waiting')

    def test_scope_requires_reviewed_unique_destination_ids(self):
        path = Path(self.tmp.name) / 'config.json'
        for ids in [[], ['bad'], self.config['postIds'] * 2]:
            path.write_text(json.dumps({**self.config, 'postIds': ids}))
            with self.assertRaises(ValueError):
                r.config_read(path)

    def test_heartbeat_covers_pause_without_mutating_dispatch_journal(self):
        send = Mock(return_value={**self.ready, 'publishingEnabled': False})
        self.assertEqual(r.execute_ongoing(self.config, self.path, send=send), 0)
        tick = json.loads(self.path.with_name('ongoing-heartbeat.json').read_text())
        self.assertEqual(tick['exitCode'], 0)
        self.assertIsNotNone(tick['finishedAt'])
        self.assertFalse(self.path.exists())

    def test_check_does_not_write_heartbeat(self):
        r.execute_ongoing(self.config, self.path, check=True, send=Mock(return_value=self.ready))
        self.assertFalse(self.path.with_name('ongoing-heartbeat.json').exists())

    def test_scope_digest_is_order_independent(self):
        config = {**self.config, 'postIds': self.config['postIds'] + ['00000000-0000-4000-8000-000000000003']}
        self.assertEqual(r.scope_digest(config), r.scope_digest({**config, 'postIds': list(reversed(config['postIds']))}))



# Imported by unittest discovery (the CI contract); no network in these fixtures.
monitor_spec = importlib.util.spec_from_file_location('monitor', Path(__file__).with_name('vps-monitor.py'))
m = importlib.util.module_from_spec(monitor_spec)
monitor_spec.loader.exec_module(m)


class OngoingMonitorTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.path = self.root / 'monitor-state.json'
        self.now = r.instant('2026-09-07T15:00:00Z')
        self.id = '00000000-0000-4000-8000-000000000002'
        self.config = {'runner': 'ongoing', 'businessId': '00000000-0000-4000-8000-000000000001', 'enabled': True, 'pilotReconciled': True, 'postIds': [self.id]}
        self.monitor = {'businessId': self.config['businessId'], 'enabled': True, 'expectPublishing': True, 'receiptSince': '2026-09-07T00:00:00.000Z'}
        self.ready = {'publishingEnabled': True, 'held': False, 'due': 0, 'oldestDueAt': None, 'stale': False, 'pending': False}
        self.receipt = {'id': self.id, 'status': 'posted', 'platform': 'facebook', 'scheduleTime': '2026-09-07T14:59:00Z', 'publicUrl': 'https://www.facebook.com/123_456'}
        m.initialize(self.path, self.config, self.now)
        self.tick()

    def tick(self):
        r.persist(self.root / 'ongoing-heartbeat.json', {'businessId': self.config['businessId'], 'fingerprint': r.fingerprint(self.config), 'startedAt': self.now.isoformat(), 'finishedAt': self.now.isoformat(), 'exitCode': 0})

    def run_case(self, **kw):
        return m.execute(self.config, self.monitor, self.root, self.path, now=kw.pop('now', self.now), check=kw.pop('check', Mock(return_value=self.ready)), read_receipts=kw.pop('read_receipts', Mock(return_value=[])), notify=kw.pop('notify', Mock(return_value=42)), active=kw.pop('active', Mock(return_value=True)), **kw)

    def test_future_healthy_queue_and_disabled_preparation_are_quiet(self):
        notify, check = Mock(return_value=42), Mock(return_value=self.ready)
        self.assertEqual(self.run_case(notify=notify, check=check), 0)
        check.assert_called_once_with(self.config, True)
        notify.assert_not_called()
        self.monitor['enabled'] = False
        self.config['enabled'] = False
        check.reset_mock()
        self.assertEqual(self.run_case(notify=notify, check=check, active=Mock(return_value=False)), 0)
        check.assert_not_called()
        notify.assert_not_called()

    def test_posted_only_suppresses_alerts_and_preserves_receipt_dedupe(self):
        notify = Mock(return_value=123)
        self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt]))
        notify.reset_mock()
        self.monitor['notificationMode'] = 'posted_only'
        self.run_case(notify=notify, check=Mock(side_effect=TimeoutError()), read_receipts=Mock(return_value=[self.receipt]))
        notify.assert_not_called()
        self.assertIn('queue_unavailable', json.loads(self.path.read_text())['problems'])

    def test_posted_only_ignores_pending_legacy_alert_confirmation(self):
        state = json.loads(self.path.read_text())
        state['outbox']['legacy'] = {'message': 'True Color scheduler: unavailable', 'phase': 'pending'}
        r.persist(self.path, state)
        self.monitor['notificationMode'] = 'posted_only'
        notify = Mock(return_value=123)
        self.assertEqual(self.run_case(notify=notify), 0)
        notify.assert_not_called()
        self.assertEqual(json.loads(self.path.read_text())['outbox']['legacy']['phase'], 'pending')

    def test_posted_only_sends_simple_success_once(self):
        self.monitor['notificationMode'] = 'posted_only'
        notify = Mock(return_value=123)
        self.assertEqual(self.run_case(notify=notify, read_receipts=Mock(return_value=[{**self.receipt, 'status': 'posting'}])), 0)
        notify.assert_not_called()
        for _ in range(2):
            self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt]))
        notify.assert_called_once_with('True Color posted to Facebook.\n' + self.receipt['publicUrl'])

    def test_receipt_link_and_ack_deduplicate_without_provider_mutation(self):
        check, notify = Mock(return_value=self.ready), Mock(return_value=123)
        for _ in range(2):
            self.assertEqual(self.run_case(check=check, notify=notify, read_receipts=Mock(return_value=[self.receipt])), 0)
        notify.assert_called_once()
        self.assertIn(self.id, notify.call_args.args[0])
        self.assertIn(self.receipt['publicUrl'], notify.call_args.args[0])
        event = next(iter(json.loads(self.path.read_text())['outbox'].values()))
        self.assertEqual((event['phase'], event['messageId']), ('acknowledged', 123))
        self.assertTrue(all(c.args[1] is True for c in check.call_args_list))

    def test_unknown_telegram_ack_is_never_automatically_resent(self):
        notify = Mock(side_effect=TimeoutError())
        for _ in range(2):
            self.assertEqual(self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt])), 1)
        notify.assert_called_once()
        self.assertEqual(next(iter(json.loads(self.path.read_text())['outbox'].values()))['phase'], 'uncertain')

    def test_process_crash_after_send_intent_never_replays(self):
        def crash(message):
            self.assertEqual(next(iter(json.loads(self.path.read_text())['outbox'].values()))['phase'], 'in_flight')
            raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):
            self.run_case(notify=crash, read_receipts=Mock(return_value=[self.receipt]))
        notify = Mock(return_value=123)
        self.assertEqual(self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt])), 1)
        notify.assert_not_called()

    def test_missing_or_corrupt_existing_journal_never_resets(self):
        notify = Mock(return_value=123)
        self.path.unlink()
        with self.assertRaises(ValueError):
            self.run_case(notify=notify)
        with self.assertRaises(ValueError):
            m.initialize(self.path, self.config, self.now)
        self.path.write_text('{bad')
        with self.assertRaises(ValueError):
            self.run_case(notify=notify)
        notify.assert_not_called()

    def test_persistence_failure_prevents_sending(self):
        from unittest.mock import patch
        notify = Mock(return_value=123)
        with patch.object(m.runner, 'persist', side_effect=OSError()):
            with self.assertRaises(OSError):
                self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt]))
        notify.assert_not_called()

    def test_ack_commit_failure_does_not_resend_after_restart(self):
        from unittest.mock import patch
        original = m.runner.persist
        def persist(path, state):
            if any(e.get('phase') == 'acknowledged' for e in state.get('outbox', {}).values()):
                raise OSError()
            original(path, state)
        notify = Mock(return_value=123)
        with patch.object(m.runner, 'persist', side_effect=persist):
            with self.assertRaises(OSError):
                self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt]))
        self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt]))
        notify.assert_called_once()

    def test_pending_to_posted_is_rescanned_and_only_posted_exposes_link(self):
        notify = Mock(return_value=123)
        self.run_case(notify=notify, read_receipts=Mock(return_value=[{**self.receipt, 'status': 'posting'}]))
        self.assertNotIn(self.receipt['publicUrl'], notify.call_args.args[0])
        self.run_case(notify=notify, read_receipts=Mock(return_value=[self.receipt]))
        self.assertEqual(notify.call_count, 2)
        self.assertIn(self.receipt['publicUrl'], notify.call_args.args[0])

    def test_paused_due_overdue_and_recovery_notify_only_transitions(self):
        notify = Mock(return_value=123)
        paused = {**self.ready, 'publishingEnabled': False, 'due': 1, 'oldestDueAt': '2026-09-07T14:40:00Z'}
        for _ in range(2):
            self.run_case(notify=notify, check=Mock(return_value=paused))
        self.assertEqual(notify.call_count, 3)
        self.run_case(notify=notify)
        self.assertEqual(notify.call_count, 6)
        self.run_case(notify=notify)
        self.assertEqual(notify.call_count, 6)

    def test_deliberate_pause_is_quiet_until_work_is_due(self):
        self.monitor['expectPublishing'] = False
        notify = Mock(return_value=123)
        self.run_case(notify=notify, check=Mock(return_value={**self.ready, 'publishingEnabled': False}))
        notify.assert_not_called()
        self.run_case(notify=notify, check=Mock(return_value={**self.ready, 'publishingEnabled': False, 'due': 1}))
        notify.assert_called_once()

    def test_dead_timer_and_old_heartbeat_survive_remote_outage(self):
        notify = Mock(return_value=123)
        self.run_case(now=self.now + dt.timedelta(minutes=11), active=Mock(return_value=False), check=Mock(side_effect=TimeoutError()), read_receipts=Mock(side_effect=TimeoutError()), notify=notify)
        messages = '\n'.join(c.args[0] for c in notify.call_args_list)
        self.assertIn('timer is inactive', messages)
        self.assertIn('heartbeat is older', messages)
        self.assertIn('queue check failed', messages)

    def test_monitor_never_changes_posting_journal(self):
        p = self.root / 'ongoing-state.json'
        p.write_text(json.dumps({'fingerprint': r.fingerprint(self.config), 'phase': 'in_flight'}))
        before = p.read_bytes()
        self.run_case()
        self.assertEqual(p.read_bytes(), before)

    def test_enrolled_receipts_require_opt_in_and_server_scope(self):
        foreign = '00000000-0000-4000-8000-000000000009'
        receipt = {**self.receipt, 'id': foreign}
        http = Mock(return_value={'receipts': [receipt], 'nextAfter': None, 'authorizedIds': [self.id, foreign]})
        with self.assertRaises(ValueError):
            m.receipt_read(self.config, self.monitor['receiptSince'], http=http)
        self.config['includeIntake'] = True
        self.assertEqual(m.receipt_read(self.config, self.monitor['receiptSince'], http=http), [receipt])
        for scope in [None, [foreign], [self.id, 'bad'], [self.id, self.id]]:
            with self.assertRaises(ValueError):
                m.receipt_read(self.config, self.monitor['receiptSince'], http=Mock(return_value={'receipts': [receipt], 'nextAfter': None, 'authorizedIds': scope}))

    def test_receipt_reader_rejects_out_of_scope_or_duplicate_ids(self):
        for receipts in [[{**self.receipt, 'id': 'other'}], [self.receipt, self.receipt]]:
            with self.assertRaises(ValueError):
                m.receipt_read(self.config, self.monitor['receiptSince'], http=Mock(return_value={'receipts': receipts, 'nextAfter': None}))

    def test_intake_receipt_watermark_retains_pending_and_failed_reads(self):
        self.config['includeIntake'] = True
        state = json.loads(self.path.read_text())
        state['fingerprint'] = r.fingerprint(self.config)
        state['receiptScanAt'] = '2026-09-12T15:00:00+00:00'
        r.persist(self.path, state)
        later = self.now + dt.timedelta(days=6)
        receipts = Mock(return_value=[])
        self.run_case(now=later, check=Mock(return_value={**self.ready, 'pending': True}), read_receipts=receipts)
        receipts.assert_called_once_with(self.config, '2026-09-10T15:00:00.000Z')
        self.assertEqual(json.loads(self.path.read_text())['receiptScanAt'], state['receiptScanAt'])
        self.run_case(now=later, read_receipts=Mock(side_effect=TimeoutError()))
        self.assertEqual(json.loads(self.path.read_text())['receiptScanAt'], state['receiptScanAt'])
        self.run_case(now=later, read_receipts=Mock(return_value=[]))
        self.assertEqual(json.loads(self.path.read_text())['receiptScanAt'], later.isoformat())

    def test_monitor_transport_never_allows_dispatch(self):
        with self.assertRaises(ValueError):
            m.readonly_http(self.config, {})
        with self.assertRaises(ValueError):
            m.queue_read(self.config, False)


    def test_failed_check_does_not_fabricate_recovery(self):
        notify = Mock(return_value=123)
        paused = {**self.ready, 'publishingEnabled': False, 'due': 1, 'oldestDueAt': '2026-09-07T14:40:00Z'}
        self.run_case(notify=notify, check=Mock(return_value=paused))
        notify.reset_mock()
        self.run_case(notify=notify, check=Mock(side_effect=TimeoutError()))
        messages = '\n'.join(c.args[0] for c in notify.call_args_list)
        self.assertNotIn('Recovered:', messages)
        problems = json.loads(self.path.read_text())['problems']
        self.assertTrue({'overdue', 'paused_due', 'unexpected_pause', 'queue_unavailable'} <= set(problems))

    def test_failed_local_read_retains_prior_timer_problem(self):
        notify = Mock(return_value=123)
        self.run_case(notify=notify, active=Mock(return_value=False))
        notify.reset_mock()
        self.run_case(notify=notify, active=Mock(side_effect=OSError()))
        self.assertNotIn('Recovered:', '\n'.join(c.args[0] for c in notify.call_args_list))
        self.assertIn('timer_inactive', json.loads(self.path.read_text())['problems'])


if __name__ == '__main__':
    unittest.main()
