import asyncio
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace as NS
import unittest
from unittest.mock import AsyncMock, patch

spec = importlib.util.spec_from_file_location("tc_intake_test_module", Path(__file__).with_name("intake.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class Button:
    def __init__(self, text, callback_data):
        self.text, self.callback_data = text, callback_data


sys.modules.setdefault("telegram", NS(InlineKeyboardButton=Button, InlineKeyboardMarkup=lambda value: value))


def message(**changes):
    values = dict(message_id=10, chat=NS(id=7), from_user=NS(id=7, is_bot=False),
                  message_thread_id=42, photo=[], document=None, text=None, caption=None,
                  reply_to_message=None, forward_origin=None)
    values.update(changes)
    return NS(**values)


def package(**changes):
    values = dict(intakeId="12345678-1234-1234-1234-123456789012", fingerprint="a" * 64,
                  revision=1, status="review", previewUrl="https://truecolorprinting.ca/social/review/test",
                  scheduleTime="2026-09-12T15:00:00Z", captions={"instagram": "Nice work", "facebook": "Nice work"})
    values.update(changes)
    return values


class Tests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.config = dict(owner_id=7, chat_id=7, topic_id=42, bot_id=99,
            api_url="https://truecolorprinting.ca", allowed_api_hosts=["truecolorprinting.ca"],
            journal_path=self.temp.name + "/state.db")
        self.bot = NS(id=99, send_message=AsyncMock(side_effect=self.send), get_file=AsyncMock())
        self.api = NS(request=AsyncMock())
        self.messages = []
        self.intake = m.Intake(self.config, self.bot, self.api)

    def tearDown(self):
        self.intake.journal.db.close()
        self.temp.cleanup()

    async def send(self, **kwargs):
        self.messages.append(kwargs)
        return NS(message_id=100 + len(self.messages))

    async def callback(self, record, op="a", **changes):
        msg = message(message_id=record["preview_message_id"], from_user=NS(id=99, is_bot=True))
        query = NS(id=m.secrets.token_hex(12), data=f"tc:{op}:{record['key']}", message=msg, from_user=NS(id=7, is_bot=False), answer=AsyncMock())
        for key, value in changes.items():
            setattr(query, key, value)
        await self.intake.on_callback(NS(callback_query=query))
        return query

    def test_only_owner_topic_original_images(self):
        photo = [NS(file_id="f", file_size=10)]
        self.assertTrue(self.intake.accepts(message(photo=photo)))
        self.assertFalse(self.intake.accepts(message(photo=photo, from_user=NS(id=8, is_bot=False))))
        self.assertFalse(self.intake.accepts(message(photo=photo, message_thread_id=43)))
        self.assertFalse(self.intake.accepts(message(photo=photo, chat=NS(id=8))))
        self.assertFalse(self.intake.accepts(message(photo=photo, forward_origin=NS())))
        self.assertFalse(self.intake.accepts(message(document=NS(mime_type="application/pdf"))))
        self.bot.id = 100
        self.assertFalse(self.intake.accepts(message(photo=photo)))

    async def test_yes_never_approves_or_consumes_chat(self):
        record = await self.intake.show(package())
        for text in ("yes", "approve", "looks good", "caption unrelated"):
            self.assertFalse(self.intake.accepts(message(text=text)))
        msg = message(text="yes", reply_to_message=NS(message_id=record["preview_message_id"]))
        self.assertFalse(self.intake.accepts(msg))
        await self.intake.on_message(NS(effective_message=msg))
        self.api.request.assert_not_called()

    async def test_callback_message_owner_topic_binding(self):
        record = await self.intake.show(package())
        await self.callback(record, message=message(message_id=999))
        await self.callback(record, from_user=NS(id=8, is_bot=False))
        await self.callback(record, message=message(message_id=record["preview_message_id"], message_thread_id=43))
        self.api.request.assert_not_called()

    async def test_exact_approval_and_replay(self):
        record = await self.intake.show(package())
        self.api.request.side_effect = [package(), package(status="approved"), package(status="approved")]
        await self.callback(record)
        await self.callback(record)
        approvals = [call for call in self.api.request.call_args_list if call.args[0] == "POST"]
        self.assertEqual(len(approvals), 1)
        self.assertTrue(approvals[0].kwargs["approval"])
        self.assertEqual(approvals[0].args[2], {"fingerprint": "a" * 64, "rightsConfirmed": True})

    async def test_uncertain_approval_new_explicit_click_can_retry_after_readback(self):
        record = await self.intake.show(package())
        self.api.request.side_effect = [package(), m.SafeError("Request not confirmed.")]
        await self.callback(record)
        newer = await self.intake.show(package())
        self.api.request.side_effect = [package(), package(status="approved"), package(status="approved")]
        await self.callback(newer)
        await self.callback(newer)
        self.assertEqual(sum(call.args[0] == "POST" for call in self.api.request.call_args_list), 2)

    async def test_failed_approval_same_callback_redelivery_does_not_retry(self):
        record = await self.intake.show(package())
        self.api.request.side_effect = [package(), m.SafeError("Request not confirmed."), package()]
        await self.callback(record, id="same-telegram-click")
        await self.callback(record, id="same-telegram-click")
        self.assertEqual(sum(call.args[0] == "POST" for call in self.api.request.call_args_list), 1)

    def test_regina_date_uses_fixed_offset_in_summer_and_winter(self):
        self.assertEqual(m.regina_date("2026-09-12T15:00:00Z"), "Sat, Sep 12, 2026 at 09:00 AM Regina")
        self.assertIn("09:00 AM Regina", m.regina_date("2026-01-12T15:00:00Z"))
        with self.assertRaises(m.SafeError):
            m.regina_date("2026-09-12T15:00:00")

    async def test_stale_revision_cannot_approve(self):
        record = await self.intake.show(package())
        self.api.request.return_value = package(revision=2, fingerprint="b" * 64)
        await self.callback(record)
        self.assertEqual(self.api.request.call_count, 1)
        self.assertIn("changed", self.messages[-1]["text"])

    async def test_expired_callback(self):
        record = await self.intake.show(package())
        record["created_at"] = 0
        self.intake.journal.put("action:" + record["key"], record)
        await self.callback(record)
        self.api.request.assert_not_called()

    async def test_buttons_fit_and_no_enhancement_without_config(self):
        await self.intake.show(package())
        buttons = self.messages[-1]["reply_markup"]
        self.assertTrue(all(len(button.callback_data.encode()) <= 64 for row in buttons for button in row))
        self.assertFalse(any("photo" in button.text.lower() for row in buttons for button in row))

    async def test_local_date_revision_requires_bound_reply(self):
        record = await self.intake.show(package())
        self.api.request.side_effect = [package(), package(revision=2)]
        msg = message(text="date 2026-09-15 10:00", reply_to_message=NS(message_id=record["preview_message_id"]))
        await self.intake.on_message(NS(effective_message=msg))
        self.assertEqual(self.api.request.call_args_list[1].args[2]["scheduleTime"], "2026-09-15T10:00:00-06:00")

    async def test_metadata_download_limit(self):
        msg = message(photo=[NS(file_size=m.MAX_IMAGE + 1, file_id="f")])
        with self.assertRaises(m.SafeError):
            await self.intake.download(msg)
        self.bot.get_file.assert_not_called()

    async def test_actual_download_limit(self):
        async def download(out):
            out.write(b"x" * 6)
        self.bot.get_file.return_value = NS(file_size=1, download_to_memory=download)
        with patch.object(m, "MAX_IMAGE", 5):
            with self.assertRaises(m.SafeError):
                await self.intake.download_file("f")

    async def test_spoofed_mime_rejected(self):
        async def download(out):
            out.write(b"<html>no image</html>")
        self.bot.get_file.return_value = NS(file_size=20, download_to_memory=download)
        with self.assertRaises(m.SafeError):
            await self.intake.download_file("f")

    async def test_retry_keeps_request_identity_and_no_implicit_approval(self):
        async def download(out):
            out.write(b"\xff\xd8\xfftest")
        self.bot.get_file.return_value = NS(file_size=7, download_to_memory=download)
        self.api.request.side_effect = [m.SafeError("Temporary error"), package()]
        await self.intake.on_message(NS(effective_message=message(photo=[NS(file_size=7, file_id="f")], caption="Window sign")))
        await self.intake.on_message(NS(effective_message=message(text="/social retry")))
        calls = self.api.request.call_args_list
        self.assertEqual(calls[0].args[2]["requestId"], calls[1].args[2]["requestId"])
        self.assertTrue(all(not call.kwargs.get("approval") for call in calls))

    async def test_errors_never_echo_transport_secrets(self):
        self.bot.get_file.side_effect = RuntimeError("https://api.telegram.org/botSECRET/file")
        await self.intake.on_message(NS(effective_message=message(photo=[NS(file_size=7, file_id="f")])))
        self.assertNotIn("SECRET", str(self.messages))

    def test_config_rejects_redirect_origins_and_open_credentials(self):
        path = Path(self.temp.name) / "config.json"
        cfg = {**self.config, "api_url": "http://truecolorprinting.ca"}
        path.write_text(json.dumps(cfg))
        path.chmod(0o600)
        with patch.dict(os.environ, {"TRUECOLOR_SOCIAL_CONFIG": str(path)}):
            with self.assertRaises(m.SafeError):
                m.load_config()
        path.chmod(0o644)
        with self.assertRaises(m.SafeError):
            m.restricted_file(path)

    async def test_failed_enhancement_never_approves(self):
        self.config["enhancement_command"] = ["python3", "/test/worker.py"]
        record = await self.intake.show(package())
        original = self.intake.save_original("request-1", b"\xff\xd8\xfforiginal")
        self.intake.journal.put("original:" + package()["intakeId"],
            {"path": str(original), "sha256": m.hashlib.sha256(original.read_bytes()).hexdigest()})
        self.api.request.return_value = package()
        process = NS(returncode=1, communicate=AsyncMock(return_value=(b"", None)))
        with patch.object(m.asyncio, "create_subprocess_exec", AsyncMock(return_value=process)) as launch:
            await self.callback(record, "e")
        self.assertEqual(self.api.request.call_count, 1)
        self.assertIn("unchanged", self.messages[-1]["text"])
        self.assertTrue(launch.call_args.kwargs["start_new_session"])
        self.assertNotIn("TRUECOLOR_SOCIAL_CONFIG", launch.call_args.kwargs["env"])

    def test_native_handler_installation_filters_before_dispatch(self):
        class Filter:
            pass
        handlers = []
        ext = NS(CallbackQueryHandler=lambda callback, **kwargs: ("callback", callback, kwargs),
                 MessageHandler=lambda filt, callback, **kwargs: ("message", filt, callback, kwargs),
                 filters=NS(MessageFilter=Filter))
        with patch.dict(sys.modules, {"telegram.ext": ext}), patch.object(m, "load_config", return_value=self.config):
            instance = m.install(NS(add_handler=handlers.append), NS(bot=self.bot))
        self.assertEqual(handlers[0][0], "message")
        self.assertFalse(handlers[0][1].filter(message(text="ordinary chat")))
        self.assertEqual(handlers[1][2]["pattern"], "^tc:")
        self.assertFalse(handlers[0][3]["block"])
        self.assertFalse(handlers[1][2]["block"])
        instance.journal.db.close()


if __name__ == "__main__":
    unittest.main()
