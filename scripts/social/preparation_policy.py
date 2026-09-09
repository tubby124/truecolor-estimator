#!/usr/bin/env python3
"""Compile explicit trusted-operator mappings; never interpret lesson prose or approve posts."""
import argparse
from datetime import date, datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import tempfile
from learning_loop import digest, identifier, private_directory


def sha(value):
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{64}', value):
        raise ValueError('Expected lowercase SHA256')
    return value


def check_digest(obj, field):
    sha(obj.get(field))
    if obj[field] != digest({k: v for k, v in obj.items() if k != field}):
        raise ValueError(f'{field} mismatch')


def settings(renderer, caption):
    if not isinstance(renderer, dict) or set(renderer) != {'logo_sha256', 'backing', 'corner', 'width_ratio', 'inset_ratio'}:
        raise ValueError('Exact typed renderer settings required')
    sha(renderer['logo_sha256'])
    if renderer['backing'] not in ('white', 'transparent') or renderer['corner'] != 'top-right':
        raise ValueError('Unsupported renderer setting')
    for key, minimum, maximum in [('width_ratio', .01, .5), ('inset_ratio', 0, .2)]:
        value = renderer[key]
        if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not minimum <= value <= maximum:
            raise ValueError('Invalid renderer ratio')
    if not isinstance(caption, dict) or set(caption) != {'mode', 'fact_ids'} or caption['mode'] != 'provided_draft':
        raise ValueError('Only provided_draft caption mode supported')
    ids = caption['fact_ids']
    if not isinstance(ids, list) or any(not isinstance(v, str) for v in ids) or len(set(ids)) != len(ids):
        raise ValueError('Distinct fact IDs required')
    for value in ids:
        identifier(value)


def compile_policy(context, binding, *, as_of=None):
    """Digests ensure integrity, not authentication; caller must trust local binding input."""
    if context.get('schema') != 'social-draft-learning-context-v1' or binding.get('schema') != 'social-preparation-binding-v1':
        raise ValueError('Unsupported context or binding schema')
    check_digest(context, 'context_sha256')
    check_digest(binding, 'binding_sha256')
    today = date.fromisoformat(as_of) if as_of else datetime.now(timezone.utc).date()
    if date.fromisoformat(context['as_of']) != today:
        raise ValueError('Regenerate context for current preparation date')
    identifier(binding.get('business_id'))
    identifier(binding.get('target_package_id'))
    if binding['business_id'] != context.get('business_id') or binding['source_context_sha256'] != context['context_sha256']:
        raise ValueError('Business or context mismatch')
    if context.get('target') != {'kind': 'package', 'id': binding['target_package_id'], 'status': 'draft'}:
        raise ValueError('Target must be exact draft package')
    scope = context.get('source_scope', {})
    if set(scope) != {'recipe_id', 'recipe_version', 'kind', 'id'} or any(not isinstance(v, str) or not v for v in scope.values()) or scope['kind'] not in ('package', 'creative', 'post') or binding.get('source_scope') != scope:
        raise ValueError('Exact source scope required')
    settings(binding.get('renderer'), binding.get('caption'))
    lessons = context.get('lessons', [])
    selected = context.get('selected_decision_ids')
    if not isinstance(lessons, list) or not isinstance(selected, list) or len(set(selected)) != len(selected) or [v['decision_id'] for v in lessons] != selected:
        raise ValueError('Invalid active selection')
    indexed = {v['decision_id']: v for v in lessons}
    mappings = binding.get('mappings')
    if not isinstance(mappings, list) or not mappings:
        raise ValueError('Explicit reviewed operator mappings required')
    used = []
    settings_hash = digest({'renderer': binding['renderer'], 'caption': binding['caption']})
    for mapping in mappings:
        lesson = indexed.get(mapping.get('decision_id'))
        if not lesson or mapping['decision_id'] in used:
            raise ValueError('Unknown or duplicate decision')
        if lesson.get('expires_on') and date.fromisoformat(lesson['expires_on']) < today:
            raise ValueError('Expired decision')
        if mapping.get('proposed_change_sha256') != hashlib.sha256(lesson['proposed_change'].encode('utf-8')).hexdigest() or mapping.get('settings_sha256') != settings_hash:
            raise ValueError('Decision text or typed settings binding mismatch')
        owner_refs = [e['evidence_ref'] for e in lesson['evidence'] if e['event_id'] == lesson['owner_decision_event_id']]
        if not mapping.get('owner_evidence_ref') or mapping['owner_evidence_ref'] not in owner_refs:
            raise ValueError('Owner evidence reference mismatch')
        used.append(mapping['decision_id'])
    result = dict(schema='social-preparation-policy-v1', business_id=binding['business_id'], target_package_id=binding['target_package_id'], source_context_sha256=context['context_sha256'], source_scope=scope, applied_decision_ids=used, renderer=binding['renderer'], caption=binding['caption'], binding_sha256=binding['binding_sha256'], authority='preparation_only_not_publication')
    result['policy_sha256'] = digest(result)
    return result


def verify_render_receipt(policy, receipt, *, expected_source_sha256=None, expected_output_sha256=None):
    check_digest(policy, 'policy_sha256')
    if policy.get('schema') != 'social-preparation-policy-v1' or policy.get('authority') != 'preparation_only_not_publication':
        raise ValueError('Unsupported policy authority')
    settings(policy.get('renderer'), policy.get('caption'))
    if receipt.get('schema') != 'social-render-receipt-v1':
        raise ValueError('Unsupported receipt')
    for field in ('business_id', 'target_package_id', 'policy_sha256', 'renderer'):
        if receipt.get(field) != policy.get(field):
            raise ValueError(f'Render receipt {field} mismatch')
    for field, expected in [('source_sha256', expected_source_sha256), ('output_sha256', expected_output_sha256)]:
        sha(receipt.get(field))
        if expected is not None and receipt[field] != sha(expected):
            raise ValueError(f'Render receipt {field} mismatch')
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    command = sub.add_parser('compile')
    command.add_argument('--binding', type=Path, required=True)
    command.add_argument('--context', type=Path, required=True)
    command.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    policy = compile_policy(json.loads(args.context.read_text()), json.loads(args.binding.read_text()))
    private_directory(args.output.parent, policy['business_id'])
    if args.output.is_symlink():
        raise ValueError('Private output cannot be symlink')
    args.output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd, temporary = tempfile.mkstemp(dir=args.output.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(json.dumps(policy, sort_keys=True, ensure_ascii=False, allow_nan=False, indent=2) + '\n')
        os.replace(temporary, args.output)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print('Prepared policy ' + policy['policy_sha256'] + '; no publication authority')


if __name__ == '__main__':
    main()
