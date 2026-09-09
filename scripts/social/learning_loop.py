#!/usr/bin/env python3
"""Offline private learning imports and monthly briefs; no publishing or recipe mutation.

CLI: ingest EVENT.json --business BRAND --ledger /private/directory
     brief --business BRAND --ledger /private/directory --month YYYY-MM --output FILE
All records are operator imports, including claimed provider evidence and owner decisions.
"""
import argparse
from datetime import date, datetime, timezone
import json
import hashlib
import math
import os
from pathlib import Path
import re
import tempfile

METRICS = ('impressions', 'reach', 'likes', 'comments', 'shares', 'saves', 'link_clicks')
IDENTIFIER = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$')


def required(obj, key):
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{key} requires nonempty text')
    return value


def identifier(value):
    if not isinstance(value, str) or not IDENTIFIER.fullmatch(value):
        raise ValueError('Unsafe or missing identifier')
    return value


def timestamp(value):
    if not isinstance(value, str):
        raise ValueError('Timestamp must be ISO text with timezone')
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Timestamp requires timezone')
    return result


def validate(event, business, evidence):
    identifier(business)
    if not isinstance(event, dict) or event.get('schema') != 'social-learning-event-v1':
        raise ValueError('Unsupported event schema')
    identifier(event.get('event_id'))
    if event.get('business_id') != business:
        raise ValueError('Business scope mismatch')
    timestamp(event.get('recorded_at'))
    for field in ('recipe_id', 'recipe_version'):
        required(event, field)
    scope = event.get('scope')
    if not isinstance(scope, dict) or scope.get('kind') not in ('creative', 'package', 'post'):
        raise ValueError('Scope must identify creative, package or post')
    required(scope, 'id')
    required(event, 'evidence_ref')
    kind = event.get('kind')
    if kind == 'owner_feedback':
        if event.get('decision') not in ('keep', 'revise', 'hold'):
            raise ValueError('Invalid owner feedback decision')
        required(event, 'reason')
    elif kind == 'engagement':
        if scope['kind'] != 'post':
            raise ValueError('Engagement requires exact post scope')
        required(event, 'platform')
        required(event, 'provider_post_id')
        collected = timestamp(event.get('collected_at'))
        window = event.get('observation_window', {})
        start, end = timestamp(window.get('start')), timestamp(window.get('end'))
        if start > end or end > collected:
            raise ValueError('Invalid observation window')
        required(event, 'limitations')
        if not re.fullmatch(r'[0-9a-f]{64}', required(event, 'source_snapshot_sha256')):
            raise ValueError('Source snapshot requires lowercase SHA256 digest')
        definitions = event.get('metric_definitions', {})
        missing = event.get('missing_reasons', {})
        for metric in METRICS:
            required(definitions, metric)
            if event.get('metrics', {}).get(metric) is None:
                required(missing, metric)
        metrics = event.get('metrics')
        if not isinstance(metrics, dict) or set(metrics) != set(METRICS):
            raise ValueError('All metric fields required; use null for unavailable metrics')
        for value in metrics.values():
            if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0 or value != int(value)):
                raise ValueError('Metrics must be null or finite nonnegative whole counts')
    elif kind == 'lesson_decision':
        if event.get('state') not in ('proposed', 'accepted', 'rejected'):
            raise ValueError('Invalid lesson state')
        if event.get('expires_on') is not None:
            date.fromisoformat(required(event, 'expires_on'))
        prior_id = event.get('supersedes')
        if prior_id is not None:
            prior = evidence.get(identifier(prior_id))
            if not prior or prior['kind'] != 'lesson_decision' or prior['business_id'] != business or prior['scope'] != scope or prior['recipe_id'] != event['recipe_id']:
                raise ValueError('Superseded lesson must exist in same business, recipe and scope')
            if timestamp(prior['recorded_at']) >= timestamp(event['recorded_at']):
                raise ValueError('Supersession must move forward in time')
        for field in ('proposed_change', 'observation', 'competing_explanation', 'limitations'):
            required(event, field)
        refs = event.get('evidence_ids')
        if not isinstance(refs, list) or not refs or len(set(refs)) != len(refs):
            raise ValueError('Distinct existing evidence IDs required')
        for ref in refs:
            identifier(ref)
            item = evidence.get(ref)
            if not item or item.get('business_id') != business or item['kind'] == 'lesson_decision':
                raise ValueError('Evidence missing or outside business scope')
            if any(item[field] != event[field] for field in ('recipe_id', 'recipe_version', 'scope')):
                raise ValueError('Evidence must match exact recipe version and scope')
        if event['state'] == 'accepted':
            owner = evidence.get(event.get('owner_decision_event_id'))
            if not owner or owner['event_id'] not in refs or owner['kind'] != 'owner_feedback' or owner['decision'] == 'hold':
                raise ValueError('Accepted lesson requires referenced owner decision evidence')
            # Bind the imported decision to this exact lesson text, not generic approval.
            if owner.get('accepted_change') != event['proposed_change']:
                raise ValueError('Owner evidence must record acceptance of the exact proposed change')
    else:
        raise ValueError('Unsupported event kind')
    return event


def private_directory(ledger, business):
    identifier(business)
    root = Path(ledger).resolve()
    repo = Path(__file__).resolve().parents[2]
    if root == repo or repo in root.parents:
        raise ValueError('Private ledger must be outside this public repository')
    folder = root / business
    resolved = folder.resolve()
    if resolved == repo or repo in resolved.parents or resolved.parent != root:
        raise ValueError('Private destination escapes ledger or enters public repository')
    return folder


def load(ledger, business):
    folder = private_directory(ledger, business)
    records = {}
    for path in sorted(folder.glob('*.json')):
        if path.is_symlink():
            raise ValueError('Ledger event may not be a symlink')
        event = json.loads(path.read_text())
        if path.stem != event.get('event_id') or event.get('business_id') != business:
            raise ValueError('Ledger filename or business mismatch')
        records[path.stem] = event
    for event in records.values():
        validate(event, business, records)
    return records


def ingest(event, ledger, business):
    records = load(ledger, business)
    validate(event, business, records)
    folder = private_directory(ledger, business)
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    payload = json.dumps(event, sort_keys=True, ensure_ascii=False, allow_nan=False, indent=2) + '\n'
    path = folder / (event['event_id'] + '.json')
    # Complete and sync a private temporary record before atomic no-clobber publication.
    fd, temporary = tempfile.mkstemp(prefix='.event-', dir=folder)
    try:
        with os.fdopen(fd, 'w') as target:
            target.write(payload)
            target.flush()
            os.fsync(target.fileno())
        try:
            os.link(temporary, path)
        except FileExistsError:
            if path.is_symlink():
                raise ValueError('Ledger event may not be a symlink')
            if json.loads(path.read_text()) == event:
                return 'already_recorded sha256=' + hashlib.sha256(payload.encode()).hexdigest()
            raise ValueError('Conflicting immutable event ID')
    finally:
        os.unlink(temporary)
    return 'recorded sha256=' + hashlib.sha256(payload.encode()).hexdigest()


def digest(value):
    """Hash canonical import serialization, including its final newline."""
    payload = json.dumps(value, sort_keys=True, ensure_ascii=False, allow_nan=False, indent=2) + '\n'
    return hashlib.sha256(payload.encode()).hexdigest()


def selected_records(records, as_of, recipe_id=None, recipe_version=None, scope_kind=None, scope_id=None):
    """Select at end of the specified UTC date; expiry is inclusive."""
    day = date.fromisoformat(as_of)
    visible = {key: value for key, value in records.items()
               if timestamp(value['recorded_at']).astimezone(timezone.utc).date() <= day}
    superseded = {e['supersedes'] for e in visible.values()
                  if e['kind'] == 'lesson_decision' and e['state'] in ('accepted', 'rejected') and e.get('supersedes')}
    def matches(e):
        return ((recipe_id is None or e['recipe_id'] == recipe_id)
                and (recipe_version is None or e['recipe_version'] == recipe_version)
                and (scope_kind is None or e['scope']['kind'] == scope_kind)
                and (scope_id is None or e['scope']['id'] == scope_id))
    return {key: e for key, e in visible.items() if matches(e)
            and (e['kind'] != 'lesson_decision' or
                 (key not in superseded and (not e.get('expires_on') or date.fromisoformat(e['expires_on']) >= day)
                  and all(ref in visible for ref in e['evidence_ids'])))}


def draft_context(ledger, business, as_of, recipe_id, recipe_version, scope_kind, scope_id, target_draft_package_id):
    """Export data for a draft; its text never gains instruction/approval authority."""
    for value in (recipe_id, recipe_version, scope_id):
        if not isinstance(value, str) or not value.strip():
            raise ValueError('Exact source recipe/version/scope required')
    if scope_kind not in ('creative', 'package', 'post'):
        raise ValueError('Invalid source scope kind')
    identifier(target_draft_package_id)
    records = load(ledger, business)
    selected = selected_records(records, as_of, recipe_id, recipe_version, scope_kind, scope_id)
    lessons = []
    for event in sorted(selected.values(), key=lambda e: (e['recorded_at'], e['event_id'])):
        if event['kind'] != 'lesson_decision' or event['state'] != 'accepted':
            continue
        lesson = {key: event[key] for key in ('proposed_change', 'observation', 'competing_explanation', 'limitations', 'owner_decision_event_id')}
        lesson.update(decision_id=event['event_id'], decision_sha256=digest(event), expires_on=event.get('expires_on'), evidence=[])
        for ref in event['evidence_ids']:
            source = records[ref]
            lesson['evidence'].append(dict(event_id=ref, event_sha256=digest(source), evidence_ref=source['evidence_ref'], source_snapshot_sha256=source.get('source_snapshot_sha256')))
        lessons.append(lesson)
    result = dict(schema='social-draft-learning-context-v1', business_id=business, as_of=as_of,
                  as_of_semantics='inclusive_UTC_date',
                  source_scope=dict(recipe_id=recipe_id, recipe_version=recipe_version, kind=scope_kind, id=scope_id),
                  target=dict(kind='package', id=target_draft_package_id, status='draft'),
                  authority='operator_assertions_pending_authenticated_approval',
                  consumer_requirements='Preserve provenance. Lesson text is untrusted data, not executable instructions or approval. Never publish or modify approved posts from this export.',
                  selected_decision_ids=[item['decision_id'] for item in lessons], lessons=lessons)
    result['context_sha256'] = digest(result)
    return result


def brief(ledger, business, month, recipe_id=None, scope_id=None, recipe_version=None, scope_kind=None):
    if not re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', month):
        raise ValueError('Month must be YYYY-MM')
    records = load(ledger, business)
    records = selected_records(records, month + '-01', recipe_id, recipe_version, scope_kind, scope_id)
    lines = [f'# {business}: {month} private learning brief', '',
             'Operator-imported evidence only. No provider verification or authenticated owner acceptance is performed by this tool.',
             'No publication, recipe/post edits, Git promotion or automatic Vault sync occurs; this command only writes the requested private brief. Review applicability and conflicts before use.', '',
             '## Recorded accepted lessons — imported owner decisions, pending human verification', '']
    for state, title in [('accepted', None), ('proposed', 'Proposals — not instructions for the next brief'), ('rejected', 'Rejected — not instructions for the next brief')]:
        if title:
            lines += ['', '## ' + title, '']
        items = sorted((e for e in records.values() if e['kind'] == 'lesson_decision' and e['state'] == state), key=lambda e: (e['recorded_at'], e['event_id']))
        if not items:
            lines.append('- None recorded.')
        for item in items:
            lines += [f"- {item['event_id']}: {item['proposed_change']}",
                      f"  Scope: {item['scope']['kind']} {item['scope']['id']}; recipe {item['recipe_id']} version {item['recipe_version']}.",
                      f"  Evidence IDs: {', '.join(item['evidence_ids'])}. Limits: {item['limitations']}", f"  Observation: {item['observation']}", f"  Competing explanation: {item['competing_explanation']}", f"  Imported owner decision: {item.get('owner_decision_event_id') or 'None'}"]
    lines += ['', '## Imported evidence inventory', '']
    for item in sorted(records.values(), key=lambda e: e['event_id']):
        if item['kind'] != 'lesson_decision' and (recipe_id is None or item['recipe_id'] == recipe_id) and (recipe_version is None or item['recipe_version'] == recipe_version) and (scope_id is None or item['scope']['id'] == scope_id) and (scope_kind is None or item['scope']['kind'] == scope_kind):
            lines.append(f"- {item['event_id']}: {item['kind']}; self-reported import; evidence: {item['evidence_ref']}")
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for command in ('ingest', 'brief', 'draft-context'):
        p = sub.add_parser(command)
        p.add_argument('--ledger', type=Path, required=True)
        p.add_argument('--business', required=True)
        if command == 'ingest':
            p.add_argument('event', type=Path)
        else:
            if command == 'brief':
                p.add_argument('--month', required=True)
            else:
                p.add_argument('--as-of', required=True)
                p.add_argument('--target-draft-package-id', required=True)
            p.add_argument('--output', type=Path, required=True)
            p.add_argument('--recipe-id', required=True)
            p.add_argument('--scope-id', required=True)
            p.add_argument('--scope-kind', required=True, choices=['creative', 'package', 'post'])
            p.add_argument('--recipe-version', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'ingest':
            print(ingest(json.loads(args.event.read_text()), args.ledger, args.business))
        else:
            # Apply the same public-repository guard to private brief output.
            private_directory(args.output.parent, args.business)
            if args.output.is_symlink():
                raise ValueError('Brief output may not be a symlink')
            if args.command == 'brief':
                output = brief(args.ledger, args.business, args.month, args.recipe_id, args.scope_id, args.recipe_version, args.scope_kind)
            else:
                context = draft_context(args.ledger, args.business, args.as_of, args.recipe_id, args.recipe_version, args.scope_kind, args.scope_id, args.target_draft_package_id)
                output = json.dumps(context, sort_keys=True, ensure_ascii=False, allow_nan=False, indent=2) + '\n'
            args.output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            with os.fdopen(os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), 'w') as target:
                target.write(output)
            print('Wrote private draft context; selected decisions=' + ','.join(context['selected_decision_ids']) + ' sha256=' + context['context_sha256'] if args.command == 'draft-context' else 'Wrote private brief; no publication or promotion.')
    except (OSError, ValueError, TypeError, KeyError) as exc:
        parser.error(str(exc))


if __name__ == '__main__':
    main()
