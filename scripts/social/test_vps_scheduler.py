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
        return r.execute(self.config, self.path, now=self.now, send=send, clock=kw.pop("clock", lambda: self.now), **kw)

    def test_check_crossing_expiry_never_dispatches(self):
        send = Mock(return_value=self.waiting)
        self.assertEqual(self.run_case(send, clock=lambda: r.instant(self.config['expiresAt'])), 0)
        send.assert_called_once_with(self.config, True)
        self.assertEqual(json.loads(self.path.read_text())['phase'], 'waiting')

    def test_uncertain_submission_is_never_retried(self):
        send = Mock(side_effect=[self.waiting, TimeoutError()])
        self.assertEqual(self.run_case(send), 1)
        self.assertEqual(self.run_case(send), 1)
        self.assertEqual(send.call_count, 2)

    def test_journal_exists_before_request_and_crash_blocks(self):
        def crash(*args):
            self.assertEqual(json.loads(self.path.read_text())['phase'], 'in_flight')
            raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):
            self.run_case(crash)
        send = Mock()
        self.assertEqual(self.run_case(send), 1)
        send.assert_not_called()

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

    def test_config_rejects_missing_duplicate_or_extra_ids(self):
        for ids in [[], self.config['ids'][:5], self.config['ids'] + ['bad'], [self.config['ids'][0]] * 6]:
            cfg = Path(self.tmp.name) / 'config.json'
            cfg.write_text(json.dumps({**self.config, 'ids': ids}))
            with self.assertRaises(ValueError):
                r.config_read(cfg)


if __name__ == '__main__':
    unittest.main()
