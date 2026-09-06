#!/usr/bin/env python3
"""Bounded six-destination pilot. Uncertainty requires manual reconciliation."""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request

ENDPOINT = 'https://truecolorprinting.ca/api/cron/social-scheduler'
UUID = re.compile(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}')


def instant(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z', value):
        raise ValueError('UTC required')
    return dt.datetime.fromisoformat(value[:-1] + '+00:00')


def config_read(path):
    config = json.loads(Path(path).read_text())
    if config.get('runner') == 'ongoing':
        if set(config) != {'runner', 'businessId', 'enabled', 'pilotReconciled'} or not UUID.fullmatch(config.get('businessId', '')) or type(config.get('enabled')) is not bool or config.get('pilotReconciled') is not True:
            raise ValueError('Ongoing runner requires explicit pilot reconciliation and business scope')
        return config
    if set(config) != {'ids', 'enabled', 'notBefore', 'expiresAt'}:
        raise ValueError('Invalid config')
    ids = config['ids']
    if not isinstance(ids, list) or len(ids) != 6 or any(not isinstance(i, str) or not UUID.fullmatch(i) for i in ids) or len(set(ids)) != 6:
        raise ValueError('Exactly six unique UUIDs required')
    if type(config['enabled']) is not bool or not instant(config['notBefore']) < instant(config['expiresAt']):
        raise ValueError('Invalid window')
    return config


def fingerprint(config):
    return hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()


def persist(path, value):
    temporary = path.with_suffix('.tmp')
    with temporary.open('w') as out:
        json.dump(value, out)
        out.flush()
        os.fsync(out.fileno())
    os.replace(temporary, path)
    directory = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(config, check):
    credential = Path(os.environ['CREDENTIALS_DIRECTORY']) / 'cron-secret'
    secret = credential.read_text().strip()
    if not secret or '\n' in secret or '\r' in secret:
        raise ValueError('Invalid credential')
    query = {'ids': ','.join(config['ids']), 'expiresAt': config['expiresAt']}
    if check:
        query['mode'] = 'check'
    req = urllib.request.Request(ENDPOINT + '?' + urllib.parse.urlencode(query), headers={'Authorization': 'Bearer ' + secret, 'Cache-Control': 'no-store', 'User-Agent': 'TrueColor-Social-Scheduler/1.0 (+https://truecolorprinting.ca)'})
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=180) as response:
        result = json.loads(response.read(65537))
    if result.get('ok') is not True or type(result.get('held')) is not bool or type(result.get('complete')) is not bool or result.get('total') != 6 or not isinstance(result.get('counts'), dict):
        raise ValueError('Invalid response')
    return result


def telegram(message):
    directory = Path(os.environ['CREDENTIALS_DIRECTORY'])
    token = (directory / 'telegram-bot-token').read_text().strip()
    chat = (directory / 'telegram-chat-id').read_text().strip()
    if not re.fullmatch(r'[0-9]+:[A-Za-z0-9_-]+', token) or not re.fullmatch(r'-?[0-9]+', chat):
        raise ValueError('Invalid Telegram credential')
    body = json.dumps({'chat_id': chat, 'text': message, 'disable_web_page_preview': True}).encode()
    req = urllib.request.Request('https://api.telegram.org/bot' + token + '/sendMessage', data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=20) as response:
        result = json.loads(response.read(65537))
    if result.get('ok') is not True or not isinstance(result.get('result', {}).get('message_id'), int):
        raise ValueError('Telegram delivery unconfirmed')


def notifications(path, config, result=None, alert=None, notify=telegram):
    """Separate durable outbox: failure here can never change provider dispatch state.

    Telegram has no idempotency key. An accepted message whose ACK was lost may
    repeat; confirmed ACKs are deduplicated. Never claim an unconfirmed send.
    """
    outpath = path.with_name('notifications.json')
    outbox = json.loads(outpath.read_text()) if outpath.exists() else {}
    def enqueue(key, message):
        event = hashlib.sha256((fingerprint(config) + key).encode()).hexdigest()
        if event not in outbox:
            outbox[event] = {'message': message, 'sent': False}
    if result is not None:
        groups = {}
        for receipt in result.get('receipts', []):
            if receipt.get('id') in config['ids']:
                groups.setdefault(receipt.get('scheduleTime'), []).append(receipt)
        for scheduled, group in groups.items():
            if not any(r.get('status') in ('posted', 'posting', 'failed') for r in group):
                continue
            group.sort(key=lambda r: r['id'])
            lines = ['True Color scheduled post update', 'Scheduled UTC: ' + str(scheduled)]
            for receipt in group:
                platform = receipt.get('platform')
                platform = platform if platform in ('facebook', 'instagram') else 'destination'
                status = receipt.get('status')
                label = 'published' if status == 'posted' else 'HELD - needs manual reconciliation' if status in ('posting', 'failed') else 'pending'
                lines.append(platform.title() + ': ' + label)
                link = receipt.get('publicUrl')
                if status == 'posted' and isinstance(link, str):
                    url = urllib.parse.urlsplit(link)
                    hosts = ('instagram.com', 'www.instagram.com') if platform == 'instagram' else ('facebook.com', 'www.facebook.com')
                    if url.scheme == 'https' and url.netloc in hosts and not url.query and not url.fragment:
                        lines.append(link)
            enqueue(json.dumps(group, sort_keys=True), '\n'.join(lines))
        if result.get('held'):
            alert = 'held'
    if alert:
        labels = {'held': 'Scheduled publishing HELD. Review approval or delivery state; provider retries are disabled.', 'uncertain': 'Scheduled publishing response uncertain. Manual reconciliation required; provider retries are disabled.', 'expired': 'Scheduling window expired before all destinations were confirmed published.', 'paused': 'A scheduled post is due but publishing is paused.'}
        enqueue('alert:' + alert, 'True Color: ' + labels[alert])
    persist(outpath, outbox)
    pending = False
    for event in outbox.values():
        if event['sent']:
            continue
        try:
            notify(event['message'])
            event['sent'] = True
            persist(outpath, outbox)
        except Exception:
            pending = True
            print('notification_pending')
            break
    return not pending


def receipt_snapshot(result, config):
    """Persist only the safe receipt fields, never arbitrary server responses."""
    receipts = []
    for receipt in result.get('receipts', []):
        if receipt.get('id') not in config['ids'] or receipt.get('platform') not in ('facebook', 'instagram') or receipt.get('status') not in ('draft', 'ready', 'posting', 'posted', 'failed'):
            continue
        scheduled = receipt.get('scheduleTime')
        try:
            instant(scheduled)
        except (ValueError, TypeError):
            scheduled = None
        link = receipt.get('publicUrl')
        url = urllib.parse.urlsplit(link) if isinstance(link, str) else None
        hosts = ('instagram.com', 'www.instagram.com') if receipt['platform'] == 'instagram' else ('facebook.com', 'www.facebook.com')
        if receipt['status'] != 'posted' or not url or url.scheme != 'https' or url.netloc not in hosts or url.query or url.fragment:
            link = None
        receipts.append({'id': receipt['id'], 'platform': receipt['platform'], 'status': receipt['status'], 'scheduleTime': scheduled, 'publicUrl': link})
    return {'receipts': receipts, 'held': result.get('held') is True, 'complete': result.get('complete') is True}


def execute(config, path, check=False, now=None, send=request, clock=None, notify=telegram):
    clock = clock or (lambda: dt.datetime.now(dt.timezone.utc))
    now = now or clock()
    key = fingerprint(config)
    state = json.loads(path.read_text()) if path.exists() else {'fingerprint': key, 'phase': 'waiting'}
    if check:
        result = send(config, True)
        print('check_held' if result['held'] else 'check_complete' if result['complete'] else 'check_waiting')
        return 0

    def notices(result=None, alert=None):
        try:
            return notifications(path, config, result, alert, notify)
        except Exception:
            print('notification_storage_pending')
            return False

    def save(phase, result=None, recovery=False):
        nonlocal state
        snapshot = receipt_snapshot(result, config) if result is not None else state.get('lastResult')
        state = {'fingerprint': key, 'phase': phase, 'lastResult': snapshot, 'recovery': recovery}
        persist(path, state)  # Phase and notification intent commit atomically.

    # Replay the durable intent even if the process died before creating the outbox.
    notices(result=state.get('lastResult') if state.get('fingerprint') == key else None)
    expired = now >= instant(config['expiresAt'])
    if not config['enabled']:
        print('disabled_or_expired')
        return 0
    if state.get('fingerprint') != key:
        notices(alert='held')
        print('blocked_manual_reconciliation')
        return 1
    if state.get('phase') not in ('waiting', 'complete'):
        # Recovery reads may continue after expiry. They NEVER dispatch, and stop
        # once remote state is definitive; posting remains held for reconciliation.
        if state.get('recovery', True) and now >= instant(config['notBefore']):
            try:
                result = send(config, True)
                unresolved = any(r.get('status') == 'posting' for r in result.get('receipts', []))
                save('complete' if result['complete'] else 'blocked', result, unresolved)
                notices(result=state['lastResult'], alert=None if result['complete'] else 'held')
            except Exception:
                notices(alert='uncertain')
        elif state.get('phase') != 'complete':
            notices(alert='held')
        if expired and state.get('phase') != 'complete':
            notices(alert='expired')
        print('complete' if state.get('phase') == 'complete' else 'blocked_manual_reconciliation')
        return 0 if expired or state.get('phase') == 'complete' else 1
    if expired:
        if state.get('phase') != 'complete':
            notices(alert='expired')
        print('disabled_or_expired')
        return 0
    if state['phase'] == 'complete' or now < instant(config['notBefore']):
        print('complete' if state['phase'] == 'complete' else 'before_window')
        return 0
    save('in_flight', recovery=True)
    try:
        result = send(config, True)
        save('in_flight', result, True)
        if not result['held'] and not result['complete'] and result.get('publishingEnabled') is True:
            times = result.get('nextTimes')
            if not isinstance(times, list) or not times:
                raise ValueError('Missing schedules')
            current = clock()
            if current >= instant(config['expiresAt']):
                save('waiting', result)
                notices(result=state['lastResult'], alert='expired')
                print('expired_before_dispatch')
                return 0
            if any(instant(t) <= current for t in times):
                result = send(config, False)
        phase = 'blocked' if result['held'] else 'complete' if result['complete'] else 'waiting'
        save(phase, result, any(r.get('status') == 'posting' for r in result.get('receipts', [])))
        notices(result=state['lastResult'])
        if result.get('publishingEnabled') is False and any(instant(t) <= clock() for t in result.get('nextTimes', [])):
            notices(alert='paused')
        print(phase)
        return 1 if phase == 'blocked' else 0
    except Exception:
        save('blocked', recovery=True)
        notices(alert='uncertain')
        print('blocked_uncertain_http')
        return 1


def request_ongoing(config, check):
    credential = Path(os.environ['CREDENTIALS_DIRECTORY']) / 'cron-secret'
    secret = credential.read_text().strip()
    if not secret or '\n' in secret or '\r' in secret:
        raise ValueError('Invalid credential')
    query = {'runner': 'ongoing', 'businessId': config['businessId']}
    if check:
        query['mode'] = 'check'
    req = urllib.request.Request(ENDPOINT + '?' + urllib.parse.urlencode(query), headers={'Authorization': 'Bearer ' + secret, 'Cache-Control': 'no-store', 'User-Agent': 'TrueColor-Social-Scheduler/1.0 (+https://truecolorprinting.ca)'})
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=180) as response:
        result = json.loads(response.read(65537))
    if result.get('ok') is not True or result.get('runner') != 'ongoing' or result.get('businessId') != config['businessId'] or type(result.get('held')) is not bool or type(result.get('publishingEnabled')) is not bool:
        raise ValueError('Invalid ongoing response')
    return result


def execute_ongoing(config, path, check=False, send=request_ongoing):
    """One canonical scoped trigger. Never silently replace the bounded pilot state.

    A lost dispatch ACK leaves in_flight durable. Operator reconciliation is required
    before removing ongoing-state.json; later runs only read remote queue state.
    """
    if check:
        result = send(config, True)
        print(json.dumps({key: result.get(key) for key in ('runner', 'businessId', 'publishingEnabled', 'held', 'due', 'backlog', 'stale', 'pending')}))
        return 0 if not result['held'] else 1
    if not config['enabled']:
        print('ongoing_disabled')
        return 0
    key = fingerprint(config)
    state = json.loads(path.read_text()) if path.exists() else {'fingerprint': key, 'phase': 'waiting'}
    if state.get('fingerprint') != key or state.get('phase') != 'waiting':
        send(config, True)  # Read only: remote receipts never implicitly clear uncertainty.
        print('ongoing_held_manual_reconciliation')
        return 1
    try:
        result = send(config, True)
        if not result['publishingEnabled']:
            print('ongoing_paused')
            return 0
        if result.get('pending'):
            persist(path, {'fingerprint': key, 'phase': 'blocked'})
            print('ongoing_pending_provider_reconciliation')
            return 1
        persist(path, {'fingerprint': key, 'phase': 'in_flight'})
        result = send(config, False)
        persist(path, {'fingerprint': key, 'phase': 'blocked' if result['held'] else 'waiting'})
        print('ongoing_held' if result['held'] else 'ongoing_checked')
        return 1 if result['held'] else 0
    except Exception:
        persist(path, {'fingerprint': key, 'phase': 'blocked'})
        print('ongoing_uncertain_manual_reconciliation')
        return 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', default='/etc/truecolor-social/pilot.json')
    parser.add_argument('--state-dir', default='/var/lib/truecolor-social')
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--run', action='store_true')
    args = parser.parse_args()
    try:
        config = config_read(args.config)
        directory = Path(args.state_dir)
        ongoing = config.get('runner') == 'ongoing'
        runner = execute_ongoing if ongoing else execute
        state_path = directory / ('ongoing-state.json' if ongoing else 'state.json')
        if args.check:
            return runner(config, state_path, True)
        directory.mkdir(parents=True, exist_ok=True)
        with (directory / 'runner.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return runner(config, state_path)
    except Exception:
        print('blocked_configuration_or_lock')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
