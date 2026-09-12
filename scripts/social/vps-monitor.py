#!/usr/bin/env python3
"""Read-only scoped delivery monitor. Its only outbound mutation is owner Telegram."""
import argparse
import datetime as dt
import fcntl
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import urllib.parse

spec = importlib.util.spec_from_file_location('social_runner', Path(__file__).with_name('vps-scheduler.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
REMOTE_PROBLEMS = {'unexpected_pause', 'paused_due', 'provider_pending', 'stale_approval', 'overdue'}
LOCAL_PROBLEMS = {'timer_inactive', 'runner_disabled', 'runner_held', 'heartbeat_missing', 'heartbeat_scope', 'runner_failed'}


def monitor_config(path, config):
    value = json.loads(Path(path).read_text())
    if set(value) - {'notificationMode'} != {'businessId', 'enabled', 'expectPublishing', 'receiptSince'}:
        raise ValueError('Invalid monitor configuration')
    if value['businessId'] != config['businessId'] or type(value['enabled']) is not bool or type(value['expectPublishing']) is not bool:
        raise ValueError('Monitor scope mismatch')
    if value.get('notificationMode', 'all') not in ('all', 'posted_only'):
        raise ValueError('Invalid notification mode')
    since = runner.instant(value['receiptSince'])
    if since.isoformat(timespec='milliseconds').replace('+00:00', 'Z') != value['receiptSince']:
        raise ValueError('receiptSince requires canonical millisecond UTC')
    return value


def state_read(path):
    return json.loads(path.read_text()) if path.exists() else None


def initialize(path, config, now=None):
    """Explicit first installation only. Missing/corrupt journals never self-reset."""
    marker = path.with_name('initialized.json')
    if marker.exists() or path.exists():
        raise ValueError('Monitor was already initialized; reconcile existing journal')
    now = now or dt.datetime.now(dt.timezone.utc)
    identity = {'businessId': config['businessId'], 'scope': runner.scope_digest(config)}
    runner.persist(marker, identity)
    runner.persist(path, {**identity, 'firstObservedAt': now.isoformat(), 'outbox': {}})


def journal_read(path, config):
    state = state_read(path)
    identity = {'businessId': config['businessId'], 'scope': runner.scope_digest(config)}
    if state_read(path.with_name('initialized.json')) != identity or not isinstance(state, dict):
        raise ValueError('Missing or mismatched initialized monitor journal')
    if any(state.get(key) != value for key, value in identity.items()) or not isinstance(state.get('outbox'), dict):
        raise ValueError('Monitor journal scope or format mismatch')
    for event in state['outbox'].values():
        if not isinstance(event, dict) or event.get('phase') not in ('pending', 'in_flight', 'uncertain', 'acknowledged') or not isinstance(event.get('message'), str):
            raise ValueError('Invalid notification journal')
    return state


def timestamp(value):
    parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.utcoffset() != dt.timedelta(0):
        raise ValueError('UTC timestamp required')
    return parsed


def timer_active():
    result = subprocess.run(['/usr/bin/systemctl', 'show', 'truecolor-social.timer',
                             '--property=ActiveState', '--value'], capture_output=True, text=True, timeout=10)
    return result.returncode == 0 and result.stdout.strip() == 'active'


def readonly_http(config, params):
    if params.get('mode') not in ('check', 'receipts'):
        raise ValueError('Monitor only permits read-only requests')
    return runner.ongoing_http(config, params, timeout=20)


def queue_read(config, check=True):
    if check is not True:
        raise ValueError('Monitor cannot dispatch')
    result = readonly_http(config, {'mode': 'check'})
    if type(result.get('publishingEnabled')) is not bool or type(result.get('held')) is not bool or type(result.get('due')) is not int:
        raise ValueError('Invalid check response')
    return result


def receipt_read(config, since, http=readonly_http):
    # Exact allowlist is at most 100 destinations. A bounded second page handles
    # future API page-size changes without an unbounded polling loop.
    after, receipts = None, []
    for _ in range(6):
        params = {'mode': 'receipts', 'since': since}
        if after:
            params['after'] = after
        result = http(config, params)
        page, cursor = result.get('receipts'), result.get('nextAfter')
        if not isinstance(page, list) or len(page) > 100:
            raise ValueError('Invalid receipt page')
        authorized = config['postIds']
        if config.get('includeIntake'):
            authorized = result.get('authorizedIds')
            if not isinstance(authorized, list) or not 1 <= len(authorized) <= 500 or len(set(authorized)) != len(authorized) or any(not isinstance(i, str) or not runner.UUID.fullmatch(i) for i in authorized) or not set(config['postIds']) <= set(authorized):
                raise ValueError('Invalid enrolled receipt scope')
        for receipt in page:
            if not isinstance(receipt, dict) or receipt.get('id') not in authorized:
                raise ValueError('Receipt outside approved destination scope')
            if receipt['id'] in {r['id'] for r in receipts}:
                raise ValueError('Duplicate receipt')
            receipts.append(receipt)
        if cursor is None:
            return receipts
        if not page or cursor != page[-1]['id'] or (after and cursor <= after):
            raise ValueError('Invalid receipt cursor')
        after = cursor
    raise ValueError('Receipt scan incomplete')


def receipt_message(receipt):
    platform, status = receipt.get('platform'), receipt.get('status')
    if platform not in ('facebook', 'instagram') or status not in ('posted', 'posting', 'failed'):
        return None
    scheduled = runner.instant(receipt['scheduleTime']).isoformat()
    link = receipt.get('publicUrl')
    parsed = urllib.parse.urlsplit(link) if isinstance(link, str) else None
    hosts = ('instagram.com', 'www.instagram.com') if platform == 'instagram' else ('facebook.com', 'www.facebook.com')
    valid = parsed and parsed.scheme == 'https' and parsed.netloc in hosts and not parsed.query and not parsed.fragment
    if status == 'posted':
        outcome = 'Publication recorded in saved delivery state.' if valid else 'Saved state is posted; public link unavailable. Verify delivery.'
    else:
        outcome = 'HELD: manual provider reconciliation required. No automatic publication retry.'
    lines = ['True Color delivery update', f'Destination: {receipt["id"]}', platform.title(),
             'Scheduled UTC: ' + scheduled, outcome]
    if status == 'posted' and valid:
        lines.append(link)
    return '\n'.join(lines)


def enqueue(state, key, message):
    event = hashlib.sha256((state['businessId'] + ':' + key).encode()).hexdigest()
    if event not in state['outbox']:
        state['outbox'][event] = {'message': message, 'phase': 'pending', 'observedAt': state['lastObservedAt']}


def transitions(state, problems):
    previous = state.get('problems', {})
    for key in sorted(set(previous) | set(problems)):
        active = key in problems
        if active == (key in previous):
            continue
        sequence = state.get('sequence', 0) + 1
        state['sequence'] = sequence
        message = problems[key] if active else 'Recovered: ' + key.replace('_', ' ') + '.'
        enqueue(state, f'condition:{key}:{sequence}', 'True Color scheduler: ' + message)
    state['problems'] = problems


def flush_outbox(path, state, notify=runner.notify_owner, posted_only=False):
    """At most one attempt per event. Lost ACK requires manual readback, not retry."""
    attempts = 0
    for event in state['outbox'].values():
        if posted_only and 'Publication recorded in saved delivery state.' not in event['message']:
            continue
        if event['phase'] != 'pending':
            continue
        if attempts >= 4:
            break
        attempts += 1
        event['phase'] = 'in_flight'
        runner.persist(path, state)  # Commit intent before any network transmission.
        try:
            message = event['message'] + '\nObserved UTC: ' + event['observedAt']
            if posted_only:
                lines = event['message'].splitlines()
                message = 'True Color posted to ' + lines[2] + '.\n' + lines[-1]
            message_id = notify(message)
            if type(message_id) is not int:
                raise ValueError('Missing Telegram acknowledgment')
            event.update(phase='acknowledged', messageId=message_id)
        except Exception:
            event['phase'] = 'uncertain'
        runner.persist(path, state)
    return all(e['phase'] == 'acknowledged' for e in state['outbox'].values()
               if not posted_only or 'Publication recorded in saved delivery state.' in e['message'])


def local_problems(config, directory, state, now, active):
    problems = {}
    if not active:
        problems['timer_inactive'] = 'Posting timer is inactive or unavailable; inspect the canonical timer.'
    if not config['enabled']:
        problems['runner_disabled'] = 'Approved monitoring is enabled but posting runner configuration is disabled.'
    heartbeat = state_read(directory / 'ongoing-heartbeat.json')
    journal = state_read(directory / 'ongoing-state.json')
    if journal and (journal.get('fingerprint') != runner.fingerprint(config) or journal.get('phase') != 'waiting'):
        problems['runner_held'] = 'Posting journal is held or in flight. Reconcile before any restart; never reset automatically.'
    if heartbeat is None:
        if (now - timestamp(state['firstObservedAt'])).total_seconds() > 600:
            problems['heartbeat_missing'] = 'No posting runner heartbeat for more than ten minutes.'
        return problems
    if heartbeat.get('fingerprint') != runner.fingerprint(config) or heartbeat.get('businessId') != config['businessId']:
        problems['heartbeat_scope'] = 'Posting heartbeat does not match the reviewed configuration.'
    last_tick = timestamp(heartbeat.get('finishedAt') or heartbeat['startedAt'])
    age = (now - last_tick).total_seconds()
    if age > 600 or age < -60:
        problems['heartbeat_missing'] = 'Posting runner heartbeat is older than ten minutes or has an invalid future clock.'
    if heartbeat.get('exitCode') not in (0, None):
        problems['runner_failed'] = 'Posting runner exited with a failure; inspect the journal and service.'
    return problems


def remote_problems(result, monitor, now):
    problems = {}
    if result.get('publishingEnabled') is False:
        if monitor['expectPublishing']:
            problems['unexpected_pause'] = 'Publishing is paused while this monitor expects it enabled.'
        if result.get('due', 0) > 0 or result.get('stale'):
            problems['paused_due'] = 'Reviewed work is due while publishing is paused; no catch-up is authorized.'
    if result.get('pending'):
        problems['provider_pending'] = 'A scoped delivery is posting or failed; provider reconciliation is required.'
    if result.get('stale'):
        problems['stale_approval'] = 'A scoped ready delivery is more than one hour late; reschedule and approve again.'
    oldest = result.get('oldestDueAt')
    if oldest and (now - timestamp(oldest)).total_seconds() > 900:
        problems['overdue'] = 'Reviewed delivery is more than fifteen minutes overdue.'
    return problems


def execute(config, monitor, runner_dir, path, now=None, check=queue_read,
            read_receipts=receipt_read, notify=runner.telegram, active=timer_active):
    if not monitor['enabled']:
        print('monitor_disabled')
        return 0
    now = now or dt.datetime.now(dt.timezone.utc)
    state = journal_read(path, config)
    state['lastObservedAt'] = now.isoformat()
    problems = {}
    result = None
    try:
        problems.update(local_problems(config, runner_dir, state, now, active()))
    except Exception:
        problems.update({key: value for key, value in state.get('problems', {}).items() if key in LOCAL_PROBLEMS})
        problems['local_evidence_unavailable'] = 'Cannot read canonical timer/journal/heartbeat; inspect monitor access.'
    try:
        result = check(config, True)  # Never expose a mutation mode in this monitor.
        problems.update(remote_problems(result, monitor, now))
    except Exception:
        problems.update({key: value for key, value in state.get('problems', {}).items() if key in REMOTE_PROBLEMS})
        problems['queue_unavailable'] = 'Read-only scoped queue check failed; inspect activation, scope and connectivity.'
    try:
        since = monitor['receiptSince']
        # Keep an overlap for delayed receipts, but do not rescan all history forever.
        # Pending provider outcomes retain the old watermark until reconciled.
        if config.get('includeIntake') and state.get('receiptScanAt'):
            overlap = timestamp(state['receiptScanAt']) - dt.timedelta(days=2)
            since = max(runner.instant(since), overlap).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        for receipt in read_receipts(config, since):
            message = receipt_message(receipt)
            if message and (monitor.get('notificationMode') != 'posted_only' or
                            'Publication recorded in saved delivery state.' in message):
                enqueue(state, 'receipt:' + receipt['id'] + ':' + hashlib.sha256(message.encode()).hexdigest(), message)
        if config.get('includeIntake') and result is not None and not result.get('pending'):
            state['receiptScanAt'] = now.isoformat()
    except Exception:
        problems['receipts_unavailable'] = 'Scoped delivery receipt readback failed; publication is not verified.'
    posted_only = monitor.get('notificationMode') == 'posted_only'
    if posted_only:
        state['problems'] = problems
    else:
        transitions(state, problems)
    state['lastObservedAt'] = now.isoformat()
    runner.persist(path, state)
    confirmed = flush_outbox(path, state, notify, posted_only=posted_only)
    print(json.dumps({'problems': sorted(problems), 'notificationsConfirmed': confirmed}))
    return 1 if problems or not confirmed else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--runner-config', default='/etc/truecolor-social/ongoing.json')
    parser.add_argument('--config', default='/etc/truecolor-social/monitor.json')
    parser.add_argument('--runner-state-dir', default='/var/lib/truecolor-social')
    parser.add_argument('--state-dir', default='/var/lib/truecolor-social-monitor')
    parser.add_argument('--initialize', action='store_true', help='Create a new local journal without network calls')
    args = parser.parse_args()
    try:
        config = runner.config_read(args.runner_config)
        if config.get('runner') != 'ongoing':
            raise ValueError('Ongoing scope required')
        monitor = monitor_config(args.config, config)
        directory = Path(args.state_dir)
        directory.mkdir(parents=True, exist_ok=True)
        with (directory / 'monitor.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            if args.initialize:
                initialize(directory / 'monitor-state.json', config)
                return 0
            return execute(config, monitor, Path(args.runner_state_dir), directory / 'monitor-state.json')
    except Exception:
        print('monitor_configuration_storage_or_lock_failure')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
