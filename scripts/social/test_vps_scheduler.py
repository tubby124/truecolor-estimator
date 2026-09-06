import importlib.util
import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock

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


if __name__ == '__main__':
    unittest.main()


class OngoingRunnerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / 'ongoing-state.json'
        self.config = {'runner': 'ongoing', 'businessId': '00000000-0000-4000-8000-000000000001', 'enabled': True, 'pilotReconciled': True}
        self.ready = {'ok': True, 'runner': 'ongoing', 'businessId': self.config['businessId'], 'publishingEnabled': True, 'held': False, 'pending': False}

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
