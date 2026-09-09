#!/usr/bin/env python3
"""Bounded, GET-only Meta lifetime snapshot collector. Private outputs; no publishing.

Manifest: business_id, recipe_id, recipe_version, post_id (internal),
provider_post_id, platform (facebook/instagram), account_id, page_id,
published_at, evidence_ref. Token only from META_PAGE_ACCESS_TOKEN.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import tempfile
import urllib.error
import urllib.parse
import urllib.request

import learning_loop as learning

VERSION = 'v23.0'


class ReadError(Exception):
    """Fixed safe reason only, never provider text or request URL."""


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ReadError('redirect_refused')


class Graph:
    def __init__(self, token):
        if not token or '\n' in token or '\r' in token:
            raise ValueError('Missing or invalid META_PAGE_ACCESS_TOKEN')
        self._token = token
        self.response_versions = set()
        self._opener = urllib.request.build_opener(NoRedirect())

    def get(self, path, **params):
        if not re.fullmatch(r'(me|[0-9]+(?:_[0-9]+)?)(/(media|insights))?', path):
            raise ValueError('Invalid Graph resource')
        request = urllib.request.Request(
            'https://graph.facebook.com/' + VERSION + '/' + path + '?' + urllib.parse.urlencode(params),
            headers={'Authorization': 'Bearer ' + self._token}, method='GET')
        try:
            with self._opener.open(request, timeout=20) as response:
                version = response.headers.get('facebook-api-version', '')
                if re.fullmatch(r'v[0-9]+\.[0-9]+', version):
                    self.response_versions.add(version)
                raw = response.read(1024 * 1024 + 1)
                if len(raw) > 1024 * 1024:
                    raise ReadError('response_too_large')
                value = json.loads(raw)
        except urllib.error.HTTPError as error:
            # Never retain provider messages, headers, URLs, or token-bearing bodies.
            reason = 'http_' + str(error.code)
            try:
                body = error.read(65537)
                if len(body) <= 65536:
                    details = json.loads(body).get('error', {})
                    if isinstance(details, dict):
                        for field, label in (('code', '_meta_'), ('error_subcode', '_subcode_')):
                            number = details.get(field)
                            if type(number) is int and 0 <= number <= 2147483647:
                                reason += label + str(number)
            except (OSError, ValueError, UnicodeError, AttributeError):
                pass
            finally:
                error.close()
            raise ReadError(reason) from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise ReadError('transport_failure') from None
        except (ValueError, UnicodeError):
            raise ReadError('invalid_json') from None
        if not isinstance(value, dict) or 'error' in value:
            raise ReadError('provider_error')
        return value


def manifest_validate(m):
    if not isinstance(m, dict):
        raise ValueError('Manifest must be an object')
    allowed = {'business_id', 'recipe_id', 'recipe_version', 'post_id', 'provider_post_id', 'platform', 'account_id', 'page_id', 'published_at', 'evidence_ref'}
    if set(m) != allowed:
        raise ValueError('Manifest fields do not match contract; credentials are prohibited')
    for key in allowed:
        learning.required(m, key)
    learning.identifier(m['business_id'])
    if m['platform'] not in ('facebook', 'instagram'):
        raise ValueError('Unsupported platform')
    for key in ('account_id', 'page_id'):
        if not re.fullmatch(r'[0-9]+', m[key]):
            raise ValueError('Account IDs must be numeric')
    if not re.fullmatch(r'[0-9]+(?:_[0-9]+)?', m['provider_post_id']):
        raise ValueError('Invalid provider post ID')
    learning.timestamp(m['published_at'])


def verify_owner(graph, m):
    page = graph.get('me', fields='id,instagram_business_account{id}')
    if page.get('id') != m['page_id']:
        raise ValueError('Token Page identity mismatch')
    post = m['provider_post_id']
    if m['platform'] == 'facebook':
        if m['account_id'] != m['page_id'] or not post.startswith(m['page_id'] + '_'):
            raise ValueError('Facebook account mismatch')
        result = graph.get(post, fields='id,from{id},created_time')
        if result.get('id') != post or result.get('from', {}).get('id') != m['page_id']:
            raise ValueError('Facebook post ownership unverified')
    else:
        if page.get('instagram_business_account', {}).get('id') != m['account_id']:
            raise ValueError('Instagram account linkage mismatch')
        result = graph.get(post, fields='id,owner,timestamp')
        if result.get('id') != post or result.get('owner', {}).get('id') != m['account_id']:
            raise ValueError('Instagram media ownership mismatch')
    provider_time = result.get('timestamp' if m['platform'] == 'instagram' else 'created_time')
    if learning.timestamp(provider_time) != learning.timestamp(m['published_at']):
        raise ValueError('Publication timestamp differs from provider')
    return {'page_id': page['id'], 'account_id': m['account_id'], 'provider_post_id': result['id'],
            'provider_published_at': provider_time, 'method': 'page_token_identity_and_direct_post_owner'}



def count(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0 or int(value) != value:
        raise ReadError('missing_or_invalid_count')
    return int(value)


def collect(graph, m, collected_at=None):
    manifest_validate(m)
    now = collected_at or datetime.now(timezone.utc).isoformat()
    if learning.timestamp(m['published_at']) > learning.timestamp(now):
        raise ValueError('Publication is after collection')
    ownership = verify_owner(graph, m)
    metrics = dict.fromkeys(learning.METRICS)
    reasons = {name: 'not_requested_unsupported_mapping' for name in metrics}
    definitions = {name: 'Unavailable; no verified provider mapping enabled' for name in metrics}
    observations = {}
    post = m['provider_post_id']
    if m['platform'] == 'instagram':
        jobs = [('likes', 'like_count', False), ('comments', 'comments_count', False),
                ('reach', 'reach', True), ('saves', 'saved', True), ('shares', 'shares', True)]
    else:
        # post_clicks means all post clicks, NOT link clicks; preserve separately below.
        jobs = [('shares', 'shares', False), ('post_clicks', 'post_clicks', True)]
    for name, provider, insight in jobs:
        definition = f'Meta {VERSION} {provider}; lifetime cumulative value at collection, not interval delta'
        if name in definitions:
            definitions[name] = definition
        try:
            raw = graph.get(post + '/insights', metric=provider, period='lifetime') if insight else graph.get(post, fields=provider)
            if insight:
                rows = [row for row in raw.get('data', []) if row.get('name') == provider and row.get('period') == 'lifetime']
                if len(rows) != 1 or len(rows[0].get('values', [])) != 1:
                    raise ReadError('empty_data' if not rows else 'ambiguous_lifetime_count')
                value = count(rows[0]['values'][0].get('value'))
            else:
                if provider not in raw:
                    raise ReadError('field_absent')
                value = count(raw[provider].get('count') if provider == 'shares' and isinstance(raw[provider], dict) else raw[provider])
            observations[name] = {'provider_metric': provider, 'value': value, 'definition': definition}
            if name in metrics:
                metrics[name] = value
                reasons.pop(name, None)
        except ReadError as error:
            observations[name] = {'provider_metric': provider, 'value': None, 'reason': str(error)}
            if name in metrics:
                reasons[name] = str(error)
    snapshot = {'schema': 'meta-sanitized-snapshot-v1', 'manifest': m, 'collected_at': now,
                'requested_api_version': VERSION, 'response_api_versions': sorted(getattr(graph, 'response_versions', set())), 'ownership': ownership, 'observations': observations}
    sha = learning.digest(snapshot)
    event = {'schema': 'social-learning-event-v1', 'event_id': 'meta-' + sha[:40], 'business_id': m['business_id'],
             'recipe_id': m['recipe_id'], 'recipe_version': m['recipe_version'], 'scope': {'kind': 'post', 'id': m['post_id']},
             'kind': 'engagement', 'recorded_at': now, 'collected_at': now, 'platform': m['platform'],
             'provider_post_id': post, 'account_id': m['account_id'], 'evidence_ref': m['evidence_ref'],
             'source_snapshot_sha256': sha, 'observation_window': {'start': m['published_at'], 'end': now, 'kind': 'lifetime_to_collection'},
             'metrics': metrics, 'missing_reasons': reasons, 'metric_definitions': definitions,
             'limitations': 'Lifetime cumulative snapshot, not a date-filtered interval or attribution. Missing permissions/metrics are null. Facebook all-post clicks are preserved only in source observations, never mislabeled link clicks. Collection is evidence, not owner acceptance.'}
    learning.validate(event, m['business_id'], {})
    return snapshot, event


def save(snapshot, event, output):
    root = learning.private_directory(output, event['business_id'])
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    for obj, prefix in ((snapshot, 'snapshot-'), (event, 'engagement-')):
        payload = json.dumps(obj, sort_keys=True, ensure_ascii=False, allow_nan=False, indent=2) + '\n'
        path = root / (prefix + hashlib.sha256(payload.encode()).hexdigest() + '.json')
        fd, temporary = tempfile.mkstemp(prefix='.meta-', dir=root)
        try:
            with os.fdopen(fd, 'w') as stream:
                stream.write(payload)
                stream.flush()
                os.fsync(stream.fileno())
            try:
                os.link(temporary, path)
            except FileExistsError:
                if path.is_symlink() or path.read_bytes() != payload.encode():
                    raise ValueError('Immutable output collision')
        finally:
            os.unlink(temporary)
    return root


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--output', required=True, help='Private directory outside repository')
    args = parser.parse_args()
    try:
        m = json.loads(Path(args.manifest).read_text())
        manifest_validate(m)
        learning.private_directory(args.output, m['business_id'])
        result = collect(Graph(os.environ.get('META_PAGE_ACCESS_TOKEN')), m)
        save(*result, args.output)
    except Exception:
        # Do not print exceptions: even filesystem and JSON errors may contain sensitive input.
        parser.exit(1, 'Collection failed; check private manifest, account linkage, permissions and destination.\n')
    print('Private snapshot and normalized event saved; no publishing or acceptance performed.')


if __name__ == '__main__':
    main()
