import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("enhancement_worker", Path(__file__).with_name("worker.py"))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.source = self.root / "input.png"
        self.source.write_bytes(b"placeholder")
        self.job = {"intakeId": "12345678-1234-4234-8234-123456789012", "fingerprint": "a" * 64,
                    "inputPath": str(self.source), "inputSha256": worker.digest(self.source),
                    "treatment": "cleanup", "outputDir": str(self.root / "result")}

    def tearDown(self):
        self.temp.cleanup()

    def test_valid_paths_and_hash(self):
        self.assertEqual(worker.validate(self.job, self.root)[0], self.source)
        self.job["inputSha256"] = "b" * 64
        with self.assertRaises(ValueError):
            worker.validate(self.job, self.root)

    def test_rejects_links_and_escape(self):
        link = self.root / "link.png"
        link.symlink_to(self.source)
        self.job["inputPath"] = str(link)
        with self.assertRaises(ValueError):
            worker.validate(self.job, self.root)
        self.job["inputPath"] = str(self.source)
        self.job["outputDir"] = "/tmp/outside"
        with self.assertRaises(ValueError):
            worker.validate(self.job, self.root)

    def test_no_automatic_reexecution(self):
        (self.root / "result").mkdir()
        with self.assertRaises(ValueError):
            worker.validate(self.job, self.root)

    def test_output_rejects_hardlinks_empty_and_oversized(self):
        linked = self.root / "linked"
        linked.hardlink_to(self.source)
        with self.assertRaises(ValueError):
            worker.regular(linked)
        linked.unlink()
        self.source.write_bytes(b"")
        with self.assertRaises(ValueError):
            worker.regular(self.source)
        with self.source.open("wb") as stream:
            stream.truncate(worker.MAX_IMAGE + 1)
        with self.assertRaises(ValueError):
            worker.regular(self.source)

    def test_sandbox_and_timeout_contract(self):
        args = worker.isolated_args({"user": "tc-creative", "codexHome": "/var/lib/managed-codex", "workspaceRoot": str(self.root)}, self.root / "job", "test")
        self.assertIn("RuntimeMaxSec=600", args)
        self.assertEqual(worker.TIMEOUT, 600)
        self.assertIn("ProtectHome=yes", args)
        self.assertIn("NoNewPrivileges=yes", args)
        self.assertIn("User=tc-creative", args)
        self.assertIn("TemporaryFileSystem=" + str(self.root) + ":ro", args)
        self.assertIn("BindPaths=" + str(self.root / "job"), args)
        self.assertFalse(any("BindReadOnlyPaths" in arg for arg in args))
        self.assertNotIn("OPENAI_API_KEY", " ".join(args))

    def test_scope_specific_fixed_prompt(self):
        self.assertIn("transparent background", worker.prompt("remove_background"))
        self.assertIn("Preserve the existing background", worker.prompt("cleanup"))
        self.assertIn("built-in image_gen", worker.prompt("cleanup"))

    def test_image_receipt_must_bind_exact_output(self):
        import base64
        import hashlib
        image_hash = hashlib.sha256(b"image bytes").hexdigest()
        self.assertFalse(worker.verified_image_event([{"type": "turn.completed"}], image_hash))
        event = {"type": "response_item", "payload": {"type": "image_generation_call", "status": "completed", "result": base64.b64encode(b"image bytes").decode()}}
        self.assertTrue(worker.verified_image_event([event], image_hash))
        self.assertFalse(worker.verified_image_event([event], "b" * 64))

    def test_session_receipt_rejects_wrong_thread_identity(self):
        import base64
        import hashlib
        import json
        thread = self.job["intakeId"]
        directory = self.root / "sessions/2026/09/07"
        directory.mkdir(parents=True)
        path = directory / ("rollout-test-" + thread + ".jsonl")
        image = {"type": "response_item", "payload": {"type": "image_generation_call", "status": "completed", "result": base64.b64encode(b"image").decode()}}
        path.write_text(json.dumps({"type": "session_meta", "payload": {"id": thread}}) + "\n" + json.dumps(image) + "\n")
        events = [{"type": "thread.started", "thread_id": thread}]
        value = hashlib.sha256(b"image").hexdigest()
        self.assertTrue(worker.verify_session_image(self.root, events, value))
        path.write_text(json.dumps({"type": "session_meta", "payload": {"id": "wrong"}}) + "\n" + json.dumps(image) + "\n")
        self.assertFalse(worker.verify_session_image(self.root, events, value))

    def test_manifest_roundtrip_preserves_attempt_hold(self):
        target = self.root / "manifest.json"
        worker.save_json(target, {"status": "attempted", "jobKey": "a" * 64})
        import json
        self.assertEqual(json.loads(target.read_text())["status"], "attempted")
        self.assertEqual(target.stat().st_mode & 0o777, 0o600)


if __name__ == "__main__":
    unittest.main()
