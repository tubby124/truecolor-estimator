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
    req = urllib.request.Request(ENDPOINT + '?' + urllib.parse.urlencode(query), headers={'Authorization': 'Bearer ' + secret, 'Cache-Control': 'no-store'})
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=180) as response:
        result = json.loads(response.read(65537))
    if result.get('ok') is not True or type(result.get('held')) is not bool or type(result.get('complete')) is not bool or result.get('total') != 6 or not isinstance(result.get('counts'), dict):
        raise ValueError('Invalid response')
    return result


def execute(config, path, check=False, now=None, send=request, clock=None):
    clock = clock or (lambda: dt.datetime.now(dt.timezone.utc))
    now = now or clock()
    key = fingerprint(config)
    state = json.loads(path.read_text()) if path.exists() else {'fingerprint': key, 'phase': 'waiting'}
    # A check is remote read-only, even when locally held; never clears local state.
    if check:
        result = send(config, True)
        print('check_held' if result['held'] else 'check_complete' if result['complete'] else 'check_waiting')
        return 0
    if not config['enabled'] or now >= instant(config['expiresAt']):
        print('disabled_or_expired')
        return 0
    if state.get('fingerprint') != key or state.get('phase') not in ('waiting', 'complete'):
        print('blocked_manual_reconciliation')
        return 1
    if state['phase'] == 'complete' or now < instant(config['notBefore']):
        print('complete' if state['phase'] == 'complete' else 'before_window')
        return 0
    # Persist BEFORE even the read-only network call. Any error/crash blocks later runs.
    persist(path, {'fingerprint': key, 'phase': 'in_flight'})
    try:
        result = send(config, True)
        if not result['held'] and not result['complete'] and result.get('publishingEnabled') is True:
            times = result.get('nextTimes')
            if not isinstance(times, list) or not times:
                raise ValueError('Missing schedules')
            current = clock()
            if current >= instant(config['expiresAt']):
                persist(path, {'fingerprint': key, 'phase': 'waiting'})
                print('expired_before_dispatch')
                return 0
            if any(instant(t) <= current for t in times):
                result = send(config, False)
        phase = 'blocked' if result['held'] else 'complete' if result['complete'] else 'waiting'
        persist(path, {'fingerprint': key, 'phase': phase})
        print(phase)
        return 1 if phase == 'blocked' else 0
    except Exception:
        persist(path, {'fingerprint': key, 'phase': 'blocked'})
        print('blocked_uncertain_http')
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
        if args.check:
            return execute(config, directory / 'state.json', True)
        directory.mkdir(parents=True, exist_ok=True)
        with (directory / 'runner.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return execute(config, directory / 'state.json')
    except Exception:
        print('blocked_configuration_or_lock')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
