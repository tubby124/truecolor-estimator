import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('learning_loop', Path(__file__).parents[1] / 'learning_loop.py')
loop = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loop)


class LearningTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.ledger = Path(self.temp.name)
        self.owner = dict(schema='social-learning-event-v1', event_id='owner-1', business_id='brand-a', recorded_at='2026-09-09T12:00:00Z', recipe_id='gallery', recipe_version='v1', scope=dict(kind='package', id='october'), evidence_ref='private/transcript.md#owner', kind='owner_feedback', decision='keep', reason='Keep this mix', accepted_change='Keep the daily customer work mix')

    def put(self, event):
        return loop.ingest(event, self.ledger, 'brand-a')

    def lesson(self, state='accepted', **changes):
        event = dict(self.owner, event_id='lesson-1', kind='lesson_decision', state=state, evidence_ids=['owner-1'], owner_decision_event_id='owner-1', proposed_change=self.owner['accepted_change'], observation='Owner likes the mix', competing_explanation='Taste does not prove engagement', limitations='One owner review')
        event.update(changes)
        return event

    def test_immutable_idempotent_and_conflicting(self):
        self.assertTrue(self.put(self.owner).startswith('recorded sha256='))
        self.assertTrue(self.put(dict(reversed(list(self.owner.items())))).startswith('already_recorded sha256='))
        with self.assertRaisesRegex(ValueError, 'Conflicting'):
            self.put(dict(self.owner, reason='Changed'))

    def test_interrupted_write_does_not_publish_partial_record(self):
        with patch.object(loop.os, 'fsync', side_effect=OSError('simulated write failure')):
            with self.assertRaises(OSError):
                self.put(self.owner)
        self.assertEqual(loop.load(self.ledger, 'brand-a'), {})
        self.assertEqual(list((self.ledger / 'brand-a').iterdir()), [])
        self.assertTrue(self.put(self.owner).startswith('recorded'))

    def test_business_isolation_and_traversal(self):
        self.put(self.owner)
        with self.assertRaises(ValueError):
            loop.ingest(self.owner, self.ledger, 'brand-b')
        with self.assertRaises(ValueError):
            loop.ingest(self.owner, self.ledger, '../brand-a')
        self.assertEqual(loop.load(self.ledger, 'brand-b'), {})
        other = dict(self.owner, business_id='brand-b', recipe_id='vehicle', recipe_version='v9', scope=dict(kind='creative', id='car'))
        loop.ingest(other, self.ledger, 'brand-b')
        self.assertEqual(loop.load(self.ledger, 'brand-a')['owner-1']['recipe_id'], 'gallery')
        self.assertEqual(loop.load(self.ledger, 'brand-b')['owner-1']['recipe_id'], 'vehicle')

    def test_proposals_are_not_accepted(self):
        self.put(self.owner)
        self.put(self.lesson('proposed'))
        result = loop.brief(self.ledger, 'brand-a', '2026-10')
        accepted = result.split('## Proposals')[0]
        self.assertNotIn('Keep the daily', accepted)
        self.assertIn('Keep the daily', result)
        with self.assertRaises(ValueError):
            self.put(self.lesson(event_id='lesson-2', proposed_change='Invented expansion'))

    def test_missing_evidence_and_scope_rejected(self):
        with self.assertRaises(ValueError):
            self.put(self.lesson())
        self.put(self.owner)
        with self.assertRaises(ValueError):
            self.put(self.lesson(scope=dict(kind='package', id='other')))

    def test_supersession_expiry_scope(self):
        self.put(self.owner)
        self.put(self.lesson())
        self.put(self.lesson('rejected', event_id='lesson-2', recorded_at='2026-09-10T12:00:00Z', supersedes='lesson-1'))
        accepted = loop.brief(self.ledger, 'brand-a', '2026-10').split('## Proposals')[0]
        self.assertNotIn('lesson-1:', accepted)
        self.put(self.lesson(event_id='expired', expires_on='2026-09-30'))
        self.assertNotIn('expired:', loop.brief(self.ledger, 'brand-a', '2026-10'))
        self.assertNotIn('lesson-2:', loop.brief(self.ledger, 'brand-a', '2026-10', scope_id='different'))

    def test_symlink_and_exact_scope_guards(self):
        (self.ledger / 'brand-a').symlink_to(Path(__file__).parents[3], target_is_directory=True)
        with self.assertRaises(ValueError):
            self.put(self.owner)
        (self.ledger / 'brand-a').unlink()
        self.put(self.owner)
        self.put(self.lesson())
        self.assertNotIn('lesson-1:', loop.brief(self.ledger, 'brand-a', '2026-10', recipe_version='v2'))
        self.assertNotIn('lesson-1:', loop.brief(self.ledger, 'brand-a', '2026-10', scope_kind='post'))

    def test_metric_missingness_and_finite_counts(self):
        event = dict(self.owner, event_id='engagement-1', kind='engagement', scope=dict(kind='post', id='local-post-1'), platform='instagram', provider_post_id='provider-123', collected_at='2026-09-09T12:00:00Z', observation_window=dict(start='2026-09-01T00:00:00Z', end='2026-09-09T00:00:00Z'), limitations='Manual provider report', metrics=dict.fromkeys(loop.METRICS), source_snapshot_sha256='a' * 64, metric_definitions={key: 'Provider reported ' + key for key in loop.METRICS}, missing_reasons={key: 'Unavailable in report' for key in loop.METRICS})
        self.put(event)
        self.assertIsNone(loop.load(self.ledger, 'brand-a')['engagement-1']['metrics']['reach'])
        for bad in (float('nan'), float('inf'), -1, True, 1.5):
            with self.assertRaises(ValueError):
                self.put(dict(event, event_id='bad', metrics=dict(event['metrics'], reach=bad)))
        with self.assertRaises(ValueError):
            self.put(dict(event, event_id='missing', metrics={}))
        with self.assertRaises(ValueError):
            self.put(dict(event, event_id='window', collected_at='2026-09-01T00:00:00Z'))


if __name__ == '__main__':
    unittest.main()
