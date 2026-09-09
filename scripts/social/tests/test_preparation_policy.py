import copy
from datetime import date, datetime, timezone
import hashlib
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from preparation_policy import compile_policy, verify_render_receipt
from learning_loop import digest


def seal(obj, field):
    obj.pop(field, None)
    obj[field] = digest(obj)
    return obj


def fixture(business='truecolor', backing='white'):
    scope = dict(recipe_id='mix', recipe_version='v1', kind='package', id='review')
    lesson = dict(decision_id='logo', proposed_change='Use a white logo backing', owner_decision_event_id='owner', expires_on=None, evidence=[dict(event_id='owner', evidence_ref='private:review')])
    context = seal(dict(schema='social-draft-learning-context-v1', business_id=business, as_of=datetime.now(timezone.utc).date().isoformat(), source_scope=scope, target=dict(kind='package', id='next', status='draft'), selected_decision_ids=['logo'], lessons=[lesson]), 'context_sha256')
    renderer = dict(logo_sha256='a'*64, backing=backing, corner='top-right', width_ratio=.2, inset_ratio=.035)
    caption = dict(mode='provided_draft', fact_ids=[])
    binding = dict(schema='social-preparation-binding-v1', business_id=business, target_package_id='next', source_context_sha256=context['context_sha256'], source_scope=scope, renderer=renderer, caption=caption)
    binding['mappings'] = [dict(decision_id='logo', proposed_change_sha256=hashlib.sha256(lesson['proposed_change'].encode()).hexdigest(), owner_evidence_ref='private:review', settings_sha256=digest(dict(renderer=renderer, caption=caption)))]
    return context, seal(binding, 'binding_sha256')


class PolicyTest(unittest.TestCase):
    def test_two_businesses(self):
        for business, backing in [('truecolor', 'white'), ('other', 'transparent')]:
            p = compile_policy(*fixture(business, backing))
            self.assertEqual(p['business_id'], business)
            self.assertEqual(p['renderer']['backing'], backing)
            self.assertEqual(p['authority'], 'preparation_only_not_publication')

    def test_tampering(self):
        for field in ['context_sha256', 'binding_sha256']:
            c, b = fixture()
            (c if field.startswith('context') else b)[field] = '0'*64
            with self.assertRaises(ValueError):
                compile_policy(c, b)

    def test_bound_fields(self):
        for mutate in [lambda b: b.update(business_id='other'), lambda b: b.update(target_package_id='wrong'), lambda b: b['caption'].update(mode='provided_reviewed_draft'), lambda b: b['mappings'][0].update(decision_id='unknown'), lambda b: b['mappings'][0].update(proposed_change_sha256='0'*64), lambda b: b['mappings'][0].update(owner_evidence_ref='wrong'), lambda b: b['renderer'].update(backing='transparent'), lambda b: b['source_scope'].update(recipe_version='v2')]:
            c, b = fixture()
            b = copy.deepcopy(b)
            mutate(b)
            seal(b, 'binding_sha256')
            with self.assertRaises(ValueError):
                compile_policy(c, b)

    def test_stale_context(self):
        c, b = fixture()
        c['as_of'] = '2000-01-01'
        seal(c, 'context_sha256')
        b['source_context_sha256'] = c['context_sha256']
        seal(b, 'binding_sha256')
        with self.assertRaises(ValueError):
            compile_policy(c, b)

    def test_new_active_decision_requires_mapping(self):
        c, b = fixture()
        extra = copy.deepcopy(c['lessons'][0])
        extra['decision_id'] = 'new-correction'
        extra['proposed_change'] = 'Use a larger logo'
        c['lessons'].append(extra)
        c['selected_decision_ids'].append(extra['decision_id'])
        seal(c, 'context_sha256')
        b['source_context_sha256'] = c['context_sha256']
        seal(b, 'binding_sha256')
        with self.assertRaisesRegex(ValueError, 'Every active decision'):
            compile_policy(c, b)

    def test_receipt(self):
        p = compile_policy(*fixture())
        receipt = dict(schema='social-render-receipt-v1', **{k:p[k] for k in ['business_id', 'target_package_id', 'policy_sha256', 'renderer']}, source_sha256='b'*64, output_sha256='c'*64)
        self.assertTrue(verify_render_receipt(p, receipt, expected_source_sha256='b'*64, expected_output_sha256='c'*64))
        for field in ['business_id', 'target_package_id', 'policy_sha256', 'renderer', 'source_sha256', 'output_sha256']:
            wrong = copy.deepcopy(receipt)
            wrong[field] = 'wrong'
            with self.assertRaises(ValueError):
                verify_render_receipt(p, wrong)
        with self.assertRaises(ValueError):
            verify_render_receipt(p, receipt, expected_output_sha256='d'*64)

if __name__ == '__main__':
    unittest.main()
