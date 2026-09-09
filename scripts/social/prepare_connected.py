#!/usr/bin/env python3
"""Prepare and verify a private connected batch; never upload or approve it."""
import argparse
import copy
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

from learning_loop import digest, draft_context, identifier, private_directory, timestamp
from preparation_policy import check_digest, compile_policy, verify_render_receipt


def read_json(path):
    return json.loads(Path(path).read_text())


def file_sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def local_file(root, name):
    if not isinstance(name, str) or not name or Path(name).name != name or name in ('.', '..'):
        raise ValueError('Expected a local basename')
    if root.is_symlink():
        raise ValueError('Directory may not be a symlink')
    path = root / name
    if path.is_symlink() or not path.is_file():
        raise ValueError('Expected regular local file')
    return path


def node_builder(batch, asset_directory, output_directory, *, bridge_checkout, node='node'):
    module = Path(bridge_checkout).resolve() / 'scripts/social/harness-batch.mjs'
    if not module.is_file():
        raise ValueError('Trusted bridge module missing')
    script = "import {pathToFileURL} from 'node:url'; import {readFile} from 'node:fs/promises'; const [modulePath,payload,assets,out]=process.argv.slice(2); const {buildHarnessBatch}=await import(pathToFileURL(modulePath).href); await buildHarnessBatch(JSON.parse(await readFile(payload,'utf8')),assets,out);"
    with tempfile.TemporaryDirectory(prefix='connected-payload-') as temporary:
        payload = Path(temporary) / 'batch.json'
        payload.write_text(json.dumps(batch, allow_nan=False))
        payload.chmod(0o600)
        subprocess.run([str(node), '--input-type=module', '-e', script, 'connected-runner', str(module), str(payload), str(asset_directory), str(output_directory)], check=True, capture_output=True, text=True)


def prepare(request_file, output, bridge_checkout, node='node', *, builder=None):
    request_file = Path(request_file).resolve()
    request = read_json(request_file)
    fields = {'schema', 'business_id', 'target_package_id', 'recipe_id', 'recipe_version', 'scope_kind', 'scope_id', 'ledger', 'binding_file', 'batch_input_file'}
    if set(request) != fields or request['schema'] != 'social-connected-preparation-v1':
        raise ValueError('Expected social-connected-preparation-v1 request')
    identifier(request['business_id'])
    business = request['business_id']
    identifier(request['target_package_id'])
    output = Path(output).absolute()
    private_directory(output, business)
    bridge_checkout = Path(bridge_checkout).resolve()
    if output.resolve() == bridge_checkout or bridge_checkout in output.resolve().parents:
        raise ValueError('Private output cannot enter bridge checkout')
    if output.exists() or output.is_symlink():
        raise ValueError('Output must be a new private directory')
    def source(key):
        value = Path(request[key])
        return value if value.is_absolute() else request_file.parent / value
    binding = read_json(source('binding_file'))
    check_digest(binding, 'binding_sha256')
    scope = dict(recipe_id=request['recipe_id'], recipe_version=request['recipe_version'], kind=request['scope_kind'], id=request['scope_id'])
    if binding.get('business_id') != business or binding.get('target_package_id') != request['target_package_id'] or binding.get('source_scope') != scope:
        raise ValueError('Reviewed binding scope mismatch')
    context = draft_context(source('ledger'), business, datetime.now(timezone.utc).date().isoformat(), request['recipe_id'], request['recipe_version'], request['scope_kind'], request['scope_id'], request['target_package_id'])
    binding = copy.deepcopy(binding)
    binding['source_context_sha256'] = context['context_sha256']
    binding.pop('binding_sha256')
    binding['binding_sha256'] = digest(binding)
    policy = compile_policy(context, binding)
    batch_path = source('batch_input_file').resolve()
    batch = read_json(batch_path)
    if batch.get('businessKey') != business or batch.get('packageId') != request['target_package_id']:
        raise ValueError('Batch business or package mismatch')
    batch['learningContext'] = context
    batch['preparationPolicy'] = policy
    assets = batch_path.parent
    logo_hash = file_sha(local_file(assets, batch.get('logoFilename')))
    if logo_hash != policy['renderer']['logo_sha256']:
        raise ValueError('Actual logo hash mismatch')
    originals = {}
    for creative in batch['plan']['creatives']:
        key = creative['id']
        if key in originals:
            raise ValueError('Duplicate creative')
        originals[key] = file_sha(local_file(assets, creative['imageFilename']))
        if originals[key] != creative['imageSha256']:
            raise ValueError('Raw source hash mismatch')
    if not originals:
        raise ValueError('Empty batch')
    previous_umask = os.umask(0o077)
    try:
        if builder is None:
            node_builder(batch, assets, output, bridge_checkout=bridge_checkout, node=node)
        else:
            builder(batch, assets, output)
    finally:
        os.umask(previous_umask)
    output.chmod(0o700)
    plan = read_json(local_file(output, 'month-plan.json'))
    lineage = read_json(local_file(output, 'lineage.json'))
    if lineage.get('businessKey') != business or lineage.get('packageId') != request['target_package_id']:
        raise ValueError('Output lineage target mismatch')
    if lineage.get('planSha256') != file_sha(output / 'month-plan.json'):
        raise ValueError('Lineage plan hash mismatch')
    rows = lineage['creatives']
    rendered = plan['creatives']
    if len(rows) != len(originals) or len(rendered) != len(originals) or {r['creativeId'] for r in rows} != set(originals) or {c['id'] for c in rendered} != set(originals):
        raise ValueError('Output creative set mismatch')
    proofs = []
    for creative in rendered:
        key = creative['id']
        row = next(r for r in rows if r['creativeId'] == key)
        original = next(c for c in batch['plan']['creatives'] if c['id'] == key)
        for field in ('captionFacebook', 'captionInstagram', 'channels'):
            if creative.get(field) != original.get(field):
                raise ValueError('Provided draft changed: ' + field)
        if timestamp(creative.get('scheduleTime')) != timestamp(original.get('scheduleTime')):
            raise ValueError('Provided draft changed: scheduleTime')
        for channel, field in [('facebook', 'captionFacebook'), ('instagram', 'captionInstagram')]:
            if row['renderReceipt'].get('caption_sha256', {}).get(channel) != hashlib.sha256(creative[field].encode()).hexdigest():
                raise ValueError('Caption receipt hash mismatch')
        actual = file_sha(local_file(output / 'images', creative['imageFilename']))
        upload = file_sha(local_file(output / 'upload-preview', key + '.jpg'))
        verify_render_receipt(policy, row['renderReceipt'], expected_source_sha256=originals[key], expected_output_sha256=actual)
        if actual != creative['imageSha256'] or actual != row['finalImageSha256'] or upload != row['expectedUploadSha256'] or upload != row['renderReceipt']['upload_preview_sha256']:
            raise ValueError('Output or upload hash mismatch')
        proofs.append(dict(creative_id=key, source_sha256=originals[key], output_sha256=actual, upload_sha256=upload))
    receipt = dict(schema='social-connected-preparation-receipt-v1', state='prepared_not_approved', business_id=business, target_package_id=request['target_package_id'], context_sha256=context['context_sha256'], policy_sha256=policy['policy_sha256'], input_sha256=digest(batch), request_sha256=digest(request), plan_sha256=file_sha(output / 'month-plan.json'), creatives=proofs)
    for name, value in [('learning-context.json', context), ('preparation-policy.json', policy), ('connection-receipt.json', receipt)]:
        fd, temporary = tempfile.mkstemp(dir=output, prefix='.connected-')
        try:
            with os.fdopen(fd, 'w') as stream:
                json.dump(value, stream, indent=2, sort_keys=True, ensure_ascii=False, allow_nan=False)
                stream.write('\n')
                stream.flush()
                os.fsync(stream.fileno())
            os.link(temporary, output / name)
        finally:
            os.unlink(temporary)
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--request', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--bridge-checkout', type=Path, required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    prepare(args.request, args.output, args.bridge_checkout, args.node)
    print('Connected batch verified: prepared_not_approved')


if __name__ == '__main__':
    main()
