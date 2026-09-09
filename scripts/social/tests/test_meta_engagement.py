import importlib.util
import io
import json
import pathlib
import sys
import tempfile
import unittest
import urllib.error
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import meta_engagement as meta

NOW = '2026-09-09T12:00:00+00:00'
PUBLISHED = '2026-09-01T12:00:00+00:00'


def manifest(platform='instagram'):
    return dict(business_id='test', recipe_id='gallery', recipe_version='1', post_id='internal-1',
                provider_post_id='300' if platform == 'instagram' else '100_300', platform=platform,
                account_id='200' if platform == 'instagram' else '100', page_id='100',
                published_at=PUBLISHED, evidence_ref='private-receipt')


class Fake:
    def __init__(self, wrong=False):
        self.wrong = wrong
        self.calls = []

    def get(self, path, **params):
        self.calls.append((path, params))
        if path == 'me':
            return {'id': '100', 'instagram_business_account': {'id': '200'}}
        fields = params.get('fields', '')
        if 'owner' in fields:
            return {'id': '300', 'owner': {'id': '999' if self.wrong else '200'}, 'timestamp': PUBLISHED}
        if 'from' in fields:
            return {'id': '100_300', 'from': {'id': '999' if self.wrong else '100'}, 'created_time': PUBLISHED}
        if fields == 'like_count':
            return {'like_count': 0}
        if fields == 'comments_count':
            return {'comments_count': 2}
        if fields == 'shares':
            return {'id': '100_300'}
        if params.get('metric') == 'post_clicks':
            return {'data': []}
        raise meta.ReadError('http_400')


class CollectorTests(unittest.TestCase):
    def test_partial_and_zero(self):
        source, event = meta.collect(Fake(), manifest(), NOW)
        self.assertEqual(event['metrics']['likes'], 0)
        self.assertEqual(event['metrics']['comments'], 2)
        self.assertIsNone(event['metrics']['reach'])
        self.assertEqual(event['missing_reasons']['reach'], 'http_400')
        self.assertEqual(event['source_snapshot_sha256'], meta.learning.digest(source))
        meta.learning.validate(event, 'test', {})

    def test_facebook_missing_is_not_zero_or_link_clicks(self):
        source, event = meta.collect(Fake(), manifest('facebook'), NOW)
        self.assertIsNone(event['metrics']['shares'])
        self.assertEqual(event['missing_reasons']['shares'], 'field_absent')
        self.assertEqual(source['observations']['post_clicks']['reason'], 'empty_data')
        self.assertIsNone(event['metrics']['link_clicks'])

    def test_cross_account_rejected_before_metrics(self):
        for platform in ('facebook', 'instagram'):
            graph = Fake(wrong=True)
            with self.assertRaises(ValueError):
                meta.collect(graph, manifest(platform), NOW)
            self.assertEqual(len(graph.calls), 2)

    def test_timestamp_verified(self):
        m = manifest()
        m['published_at'] = '2026-09-02T12:00:00+00:00'
        with self.assertRaises(ValueError):
            meta.collect(Fake(), m, NOW)

    def test_private_immutable_outputs(self):
        source, event = meta.collect(Fake(), manifest(), NOW)
        with tempfile.TemporaryDirectory() as temp:
            meta.save(source, event, temp)
            meta.save(source, event, temp)
            files = list((pathlib.Path(temp) / 'test').glob('*.json'))
            self.assertEqual(len(files), 2)
            self.assertTrue(all(p.stat().st_mode & 0o077 == 0 for p in files))
        with self.assertRaises(ValueError):
            meta.save(source, event, pathlib.Path(meta.__file__).resolve().parents[2])

    def test_get_only_fixed_host_and_redaction(self):
        graph = meta.Graph('secret-token')
        seen = []
        def failure(req, timeout):
            seen.append(req)
            raise urllib.error.HTTPError(req.full_url, 400, 'secret-token', {}, None)
        with patch.object(graph._opener, 'open', side_effect=failure):
            with self.assertRaisesRegex(meta.ReadError, '^http_400$'):
                graph.get('300', fields='like_count')
        self.assertEqual(seen[0].get_method(), 'GET')
        self.assertTrue(seen[0].full_url.startswith('https://graph.facebook.com/v23.0/'))
        self.assertNotIn('secret-token', seen[0].full_url)
        with self.assertRaises(ValueError):
            graph.get('https://evil.test')
        with self.assertRaisesRegex(meta.ReadError, 'redirect_refused'):
            meta.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://evil.test')

    def test_numeric_provider_error_only(self):
        graph = meta.Graph('secret-token')
        bodies = [
            (b'{"error":{"code":10,"error_subcode":200,"message":"secret-token https://secret.test"}}', 'http_400_meta_10_subcode_200'),
            (b'{"error":{"code":"secret-token","error_subcode":true}}', 'http_400'),
            (b'not json secret-token', 'http_400'),
            (b'', 'http_400'),
            (b'x' * 65537, 'http_400'),
        ]
        for body, expected in bodies:
            error = urllib.error.HTTPError('https://secret.test', 400, 'secret-token', {}, io.BytesIO(body))
            with patch.object(graph._opener, 'open', side_effect=error):
                with self.assertRaises(meta.ReadError) as caught:
                    graph.get('300', fields='like_count')
            self.assertEqual(str(caught.exception), expected)
            self.assertNotIn('secret', str(caught.exception))

    def test_credentials_not_allowed_in_manifest(self):
        m = manifest()
        m['access_token'] = 'secret'
        with self.assertRaises(ValueError):
            meta.manifest_validate(m)

    def test_successful_fb_all_clicks_stays_separate(self):
        class Clicks(Fake):
            def get(self, path, **params):
                if params.get('metric') == 'post_clicks':
                    return {'data': [{'name': 'post_clicks', 'period': 'lifetime', 'values': [{'value': 7}]}]}
                return super().get(path, **params)
        source, event = meta.collect(Clicks(), manifest('facebook'), NOW)
        self.assertEqual(source['observations']['post_clicks']['value'], 7)
        self.assertIsNone(event['metrics']['link_clicks'])


if __name__ == '__main__':
    unittest.main()
