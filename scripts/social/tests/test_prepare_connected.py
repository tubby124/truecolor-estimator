import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from prepare_connected import prepare
from test_preparation_policy import fixture, seal
from learning_loop import digest


def h(data):
    return hashlib.sha256(data).hexdigest()


class ConnectedTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.context, self.binding = fixture()
        self.binding['renderer']['logo_sha256'] = h(b'logo')
        self.binding['mappings'][0]['settings_sha256'] = digest({k:self.binding[k] for k in ['renderer', 'caption']})
        seal(self.binding, 'binding_sha256')
        self.batch = dict(businessKey='truecolor', packageId='next', logoFilename='logo.png', plan={'creatives':[dict(id='creative', imageFilename='raw.png', imageSha256=h(b'raw'),captionFacebook='FB',captionInstagram='IG',scheduleTime='2026-09-10T14:00:00-06:00',channels=['facebook'])]})
        self.request = dict(schema='social-connected-preparation-v1', business_id='truecolor', target_package_id='next', recipe_id='mix', recipe_version='v1', scope_kind='package', scope_id='review', ledger='ledger', binding_file='binding.json', batch_input_file='batch.json')
        (self.root/'raw.png').write_bytes(b'raw')
        (self.root/'logo.png').write_bytes(b'logo')
        self.write_inputs()

    def write_inputs(self):
        for name, value in [('request.json',self.request),('binding.json',self.binding),('batch.json',self.batch)]:
            (self.root/name).write_text(json.dumps(value))

    def builder(self, batch, assets, out):
        out.mkdir(mode=0o700)
        (out/'images').mkdir()
        (out/'upload-preview').mkdir()
        (out/'images/creative.jpg').write_bytes(b'rendered')
        (out/'upload-preview/creative.jpg').write_bytes(b'upload')
        policy=batch['preparationPolicy']
        receipt=dict(schema='social-render-receipt-v1', **{k:policy[k] for k in ['business_id','target_package_id','policy_sha256','renderer']}, source_sha256=h(b'raw'),output_sha256=h(b'rendered'),upload_preview_sha256=h(b'upload'),caption_sha256={'facebook':h(b'FB'),'instagram':h(b'IG')})
        plan={'creatives':[dict(id='creative',imageFilename='creative.jpg',imageSha256=h(b'rendered'),captionFacebook='FB',captionInstagram='IG',scheduleTime='2026-09-10T14:00:00-06:00',channels=['facebook'])]}
        lineage=dict(businessKey='truecolor',packageId='next',creatives=[dict(creativeId='creative',renderReceipt=receipt,finalImageSha256=h(b'rendered'),expectedUploadSha256=h(b'upload'))])
        (out/'month-plan.json').write_text(json.dumps(plan))
        lineage['planSha256']=h((out/'month-plan.json').read_bytes())
        (out/'lineage.json').write_text(json.dumps(lineage))

    def run_prepare(self, builder=None):
        with patch('prepare_connected.draft_context', return_value=self.context):
            return prepare(self.root/'request.json',self.root/'output',self.root/'trusted',builder=builder or self.builder)

    def test_happy(self):
        result=self.run_prepare()
        self.assertEqual(result['state'],'prepared_not_approved')
        self.assertEqual(result['creatives'][0]['upload_sha256'],h(b'upload'))
        self.assertTrue((self.root/'output/connection-receipt.json').is_file())
        with self.assertRaises(ValueError):
            self.run_prepare()

    def test_bad_logo(self):
        (self.root/'logo.png').write_bytes(b'wrong')
        with self.assertRaisesRegex(ValueError,'logo'):
            self.run_prepare()
        self.assertFalse((self.root/'output').exists())

    def test_wrong_scope(self):
        self.request['scope_id']='another'
        self.write_inputs()
        with self.assertRaisesRegex(ValueError,'scope'):
            self.run_prepare()

    def test_missing_lesson(self):
        self.context['lessons']=[]
        self.context['selected_decision_ids']=[]
        seal(self.context,'context_sha256')
        with self.assertRaisesRegex(ValueError,'Unknown'):
            self.run_prepare()

    def test_changed_lesson_text(self):
        self.context['lessons'][0]['proposed_change']='Different instruction'
        seal(self.context,'context_sha256')
        with self.assertRaisesRegex(ValueError,'text'):
            self.run_prepare()

    def test_bad_output_and_upload(self):
        for directory in ['images','upload-preview']:
            with self.subTest(directory=directory):
                def corrupt(batch,assets,out):
                    self.builder(batch,assets,out)
                    (out/directory/'creative.jpg').write_bytes(b'bad')
                with self.assertRaises(ValueError):
                    self.run_prepare(corrupt)
                self.assertFalse((self.root/'output/connection-receipt.json').exists())
                import shutil
                shutil.rmtree(self.root/'output')

    def test_wrong_receipt(self):
        def corrupt(batch,assets,out):
            self.builder(batch,assets,out)
            path=out/'lineage.json'
            value=json.loads(path.read_text())
            value['creatives'][0]['renderReceipt']['renderer']=dict(batch['preparationPolicy']['renderer'],backing='transparent')
            path.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError,'renderer'):
            self.run_prepare(corrupt)
        self.assertFalse((self.root/'output/connection-receipt.json').exists())

    def test_changed_caption_and_symlink_directory(self):
        for mode in ['caption', 'symlink']:
            with self.subTest(mode=mode):
                def corrupt(batch, assets, out):
                    self.builder(batch, assets, out)
                    if mode == 'caption':
                        path = out / 'month-plan.json'
                        plan = json.loads(path.read_text())
                        plan['creatives'][0]['captionFacebook'] = 'changed'
                        path.write_text(json.dumps(plan))
                        side = out / 'lineage.json'
                        lineage = json.loads(side.read_text())
                        lineage['planSha256'] = h(path.read_bytes())
                        side.write_text(json.dumps(lineage))
                    else:
                        (out / 'images').rename(out / 'hidden')
                        (out / 'images').symlink_to(out / 'hidden', target_is_directory=True)
                with self.assertRaises(ValueError):
                    self.run_prepare(corrupt)
                self.assertFalse((self.root/'output/connection-receipt.json').exists())
                import shutil
                shutil.rmtree(self.root/'output')

    def test_schedule_same_instant_and_changed_instant(self):
        for instant, succeeds in [('2026-09-10T20:00:00.000Z', True), ('2026-09-10T21:00:00.000Z', False)]:
            with self.subTest(instant=instant):
                def change_time(batch, assets, out):
                    self.builder(batch, assets, out)
                    path = out / 'month-plan.json'
                    plan = json.loads(path.read_text())
                    plan['creatives'][0]['scheduleTime'] = instant
                    path.write_text(json.dumps(plan))
                    side = out / 'lineage.json'
                    lineage = json.loads(side.read_text())
                    lineage['planSha256'] = h(path.read_bytes())
                    side.write_text(json.dumps(lineage))
                if succeeds:
                    self.assertEqual(self.run_prepare(change_time)['state'], 'prepared_not_approved')
                else:
                    with self.assertRaisesRegex(ValueError, 'scheduleTime'):
                        self.run_prepare(change_time)
                    self.assertFalse((self.root/'output/connection-receipt.json').exists())
                import shutil
                shutil.rmtree(self.root/'output')

    def test_builder_failure(self):
        def failure(*args):
            raise RuntimeError('builder failed')
        with self.assertRaises(RuntimeError):
            self.run_prepare(failure)
        self.assertFalse((self.root/'output/connection-receipt.json').exists())

if __name__=='__main__':
    unittest.main()
