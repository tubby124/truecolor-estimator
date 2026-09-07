"""Telegram transport for exact, app-owned social approval packages.

No LLM tools, token-bearing URLs, background retry loop, or polling transport.
Credentials are read only when making the corresponding API request.
"""
import asyncio
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import signal
import sqlite3
import stat
import time
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler
import uuid

MAX_IMAGE = 12 * 1024 * 1024
MAX_RESPONSE = 1024 * 1024
MIMES = {"image/jpeg", "image/png", "image/webp"}
TTL = 48 * 3600


def regina_date(value):
    """Regina observes UTC-06 year-round; never depend on server local time."""
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            raise ValueError("Missing timezone")
        local = parsed.astimezone(timezone(timedelta(hours=-6)))
        return local.strftime("%a, %b %d, %Y at %I:%M %p") + " Regina"
    except (ValueError, TypeError):
        raise SafeError("The service returned an invalid schedule date.") from None


class SafeError(Exception):
    """Only deliberately non-sensitive text belongs in this error."""


def restricted_file(path):
    path = Path(path)
    info = path.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_mode & 0o077:
        raise SafeError("Configuration and credential files must be private (mode 600).")
    return path


def load_config():
    path = os.environ.get("TRUECOLOR_SOCIAL_CONFIG", "/root/.config/truecolor-social/telegram.json")
    config = json.loads(restricted_file(path).read_text())
    origin = urlparse(config["api_url"])
    if (origin.scheme != "https" or origin.hostname not in config["allowed_api_hosts"]
            or origin.username or origin.password or origin.query or origin.fragment
            or origin.path not in ("", "/") or origin.port not in (None, 443)):
        raise SafeError("Configure an allowlisted HTTPS API origin.")
    config["api_url"] = config["api_url"].rstrip("/")
    for field in ("owner_id", "chat_id", "topic_id", "bot_id"):
        config[field] = int(config[field])
    for field in ("draft_secret_file", "approval_secret_file"):
        restricted_file(config[field])
    return config


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SafeError("API redirect refused.")


class API:
    def __init__(self, config):
        self.config = config

    async def request(self, method, path, payload=None, image=None, approval=False):
        return await asyncio.to_thread(self._request, method, path, payload, image, approval)

    def _request(self, method, path, payload, image, approval):
        if not re.fullmatch(r"/api/integrations/social/intake(?:/[a-zA-Z0-9-]+(?:/(?:approve|revise|image))?)?", path):
            raise SafeError("Invalid intake API path.")
        secret_key = "approval_secret_file" if approval else "draft_secret_file"
        token = restricted_file(self.config[secret_key]).read_text().strip()
        if not token or "\n" in token or "\r" in token:
            raise SafeError("API credential unavailable.")
        headers = {"Authorization": "Bearer " + token, "Accept": "application/json"}
        body = None
        if image is not None:
            data, mime = image
            boundary = "tc" + secrets.token_hex(18)
            parts = []
            for key, value in (payload or {}).items():
                parts.append((f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{value}\r\n").encode())
            parts += [f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="work-photo"\r\nContent-Type: {mime}\r\n\r\n'.encode(), data, f"\r\n--{boundary}--\r\n".encode()]
            body = b"".join(parts)
            headers["Content-Type"] = "multipart/form-data; boundary=" + boundary
        elif payload is not None:
            body = json.dumps(payload).encode()
            headers["Content-Type"] = "application/json"
        try:
            request = Request(self.config["api_url"] + path, data=body, headers=headers, method=method)
            with build_opener(NoRedirect()).open(request, timeout=150 if method == "POST" and path == "/api/integrations/social/intake" else 35) as response:
                raw = response.read(MAX_RESPONSE + 1)
                if len(raw) > MAX_RESPONSE:
                    raise SafeError("API response exceeded the allowed size.")
                package = json.loads(raw)
                if not isinstance(package, dict):
                    raise SafeError("API returned an invalid response.")
                return package
        except HTTPError as error:
            alternatives = []
            try:
                detail = json.loads(error.read(MAX_RESPONSE))
                alternatives = [regina_date(value)
                                for value in detail.get("alternatives", [])[:5]]
            except Exception:
                pass
            if alternatives:
                raise SafeError("That date is occupied. Available dates: " + "; ".join(alternatives)
                                + ". Reply to the preview with date YYYY-MM-DD HH:MM (Regina time).") from None
            raise SafeError("The social service could not accept this request. Use Status to check the saved draft.") from None
        except Exception:
            # Never echo requests, transport errors, URLs or remote error bodies.
            raise SafeError("The social service did not confirm that request. Use Status before trying again.") from None


class Journal:
    def __init__(self, path):
        path = Path(path)
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        if path.parent.stat().st_mode & 0o077:
            raise SafeError("Journal directory must be private (mode 700).")
        fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o600)
        os.close(fd)
        restricted_file(path)
        self.db = sqlite3.connect(path)
        self.db.execute("CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        self.db.commit()

    def get(self, key):
        row = self.db.execute("SELECT value FROM records WHERE key=?", (key,)).fetchone()
        return json.loads(row[0]) if row else None

    def put(self, key, value):
        with self.db:
            self.db.execute("INSERT OR REPLACE INTO records VALUES (?,?)", (key, json.dumps(value)))


def forwarded(message):
    return bool(getattr(message, "forward_origin", None) or getattr(message, "forward_date", None)
                or getattr(message, "forward_from", None) or getattr(message, "is_automatic_forward", False))


def image_mime(data):
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    raise SafeError("Please send a JPEG, PNG, or WebP photo.")


class Intake:
    def __init__(self, config, bot, api=None, journal=None):
        self.config = config
        self.bot = bot
        self.api = api or API(config)
        self.journal = journal or Journal(config["journal_path"])
        self.lock = asyncio.Lock()

    def authorized(self, message, user=None):
        user = user or getattr(message, "from_user", None)
        try:
            if self.bot.id != self.config["bot_id"]:
                return False
        except Exception:
            return False
        return bool(message and user and not getattr(user, "is_bot", False)
                    and user.id == self.config["owner_id"]
                    and message.chat.id == self.config["chat_id"]
                    and getattr(message, "message_thread_id", None) == self.config["topic_id"]
                    and not forwarded(message))

    def reply_record(self, message):
        reply = getattr(message, "reply_to_message", None)
        if not reply:
            return None
        record = self.journal.get("preview:" + str(reply.message_id))
        if record and record["chat_id"] == message.chat.id and record["topic_id"] == message.message_thread_id:
            return record
        return None

    def accepts(self, message):
        if not self.authorized(message):
            return False
        if getattr(message, "photo", None):
            return True
        document = getattr(message, "document", None)
        if document and document.mime_type in MIMES:
            return True
        text = (getattr(message, "text", None) or "").strip()
        if text in ("/social status", "/social retry"):
            return True
        return bool(self.reply_record(message) and re.match(r"^(?:date |caption |status$|retry$)", text, re.I))

    async def tell(self, text, reply_markup=None, reply_to_message_id=None):
        return await self.bot.send_message(chat_id=self.config["chat_id"],
            message_thread_id=self.config["topic_id"], text=text,
            reply_markup=reply_markup, reply_to_message_id=reply_to_message_id)

    async def download(self, message):
        attachment = message.photo[-1] if getattr(message, "photo", None) else message.document
        size = getattr(attachment, "file_size", None)
        if not size or size > MAX_IMAGE:
            raise SafeError("Send a photo smaller than 12 MB with a known file size.")
        return await self.download_file(attachment.file_id)

    async def download_file(self, file_id):
        file = await self.bot.get_file(file_id)
        if not getattr(file, "file_size", None) or file.file_size > MAX_IMAGE:
            raise SafeError("That photo exceeds the download limit.")
        # PTB's sink interface lets us enforce the byte limit even if metadata lies.
        class Sink:
            def __init__(self):
                self.parts = []
                self.size = 0
            def write(self, chunk):
                self.size += len(chunk)
                if self.size > MAX_IMAGE:
                    raise SafeError("That photo exceeds the download limit.")
                self.parts.append(chunk)
        sink = Sink()
        await file.download_to_memory(out=sink)
        data = b"".join(sink.parts)
        return data, image_mime(data)

    def validate_package(self, package):
        required = ("intakeId", "fingerprint", "revision", "status", "previewUrl", "scheduleTime")
        if any(package.get(key) is None for key in required):
            raise SafeError("The service returned an incomplete review package.")
        if not re.fullmatch(r"[a-zA-Z0-9-]+", str(package["intakeId"])):
            raise SafeError("The service returned an invalid review identity.")
        origin = urlparse(package["previewUrl"])
        if origin.scheme != "https" or origin.hostname not in self.config["allowed_api_hosts"] or origin.username or origin.password:
            raise SafeError("The preview link is not on the approved website.")

    async def show(self, package, request_id=None):
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
        self.validate_package(package)
        key = secrets.token_urlsafe(18)
        record = {"key": key, "package": package, "chat_id": self.config["chat_id"],
                  "topic_id": self.config["topic_id"], "preview_message_id": None,
                  "created_at": time.time(), "request_id": request_id, "approval_state": "pending"}
        # Persist before Telegram send. A send with no receipt can never authorize.
        self.journal.put("action:" + key, record)
        captions = package.get("captions") or {}
        if not isinstance(captions, dict):
            captions = {}
        text = (f"Review your post: {package['previewUrl']}\n"
                f"Scheduled: {regina_date(package['scheduleTime'])}\nStatus: {package['status']}\n\n"
                f"Instagram: {str(captions.get('instagram', 'See preview'))[:800]}\n\n"
                f"Facebook: {str(captions.get('facebook', 'See preview'))[:800]}\n\n"
                "Approve confirms the exact image, captions and date shown in the preview, "
                "and that you have permission to publish this image. "
                + ("Original photo; no image cleanup has been applied." if package.get("mediaTreatment", "original") == "original"
                   else "Image treatment: " + str(package.get("mediaTreatment"))))
        buttons = [[InlineKeyboardButton("Approve exact post + image rights", callback_data=f"tc:a:{key}")],
                   [InlineKeyboardButton("Change date", callback_data=f"tc:d:{key}"),
                    InlineKeyboardButton("Revise caption", callback_data=f"tc:c:{key}")],
                   [InlineKeyboardButton("Status", callback_data=f"tc:s:{key}")]]
        if self.config.get("enhancement_command"):
            buttons.insert(2, [InlineKeyboardButton("Clean up photo", callback_data=f"tc:e:{key}"),
                               InlineKeyboardButton("Remove background", callback_data=f"tc:b:{key}")])
        sent = await self.tell(text, InlineKeyboardMarkup(buttons))
        record["preview_message_id"] = sent.message_id
        self.journal.put("action:" + key, record)
        self.journal.put("preview:" + str(sent.message_id), record)
        self.journal.put("latest", record)
        return record

    async def readback(self, record):
        package = await self.api.request("GET", "/api/integrations/social/intake/" + record["package"]["intakeId"])
        self.validate_package(package)
        return package

    async def on_message(self, update, context=None):
        message = update.effective_message
        if not self.accepts(message):
            return
        async with self.lock:
            try:
                text = (getattr(message, "text", None) or "").strip()
                if text == "/social status":
                    latest = self.journal.get("latest")
                    if not latest:
                        pending = self.journal.get("latest_request")
                        await self.tell("A photo request is saved but no complete preview was confirmed. Use /social retry to reconcile that same request."
                                        if pending else "No Telegram photo submission has been recorded yet.")
                    else:
                        await self.show(await self.readback(latest), latest.get("request_id"))
                    return
                if text == "/social retry":
                    pending = self.journal.get("latest_request")
                    if not pending:
                        await self.tell("No saved photo request is available to retry.")
                    else:
                        await self.submit_saved(pending)
                    return
                record = self.reply_record(message)
                if record:
                    await self.revise_or_status(message, record, text)
                    return
                request_id = str(uuid.uuid5(uuid.NAMESPACE_URL,
                    f"telegram:{self.bot.id}:{message.chat.id}:{message.message_id}"))
                saved = self.journal.get("request:" + request_id)
                if saved and saved.get("package"):
                    await self.show(await self.readback(saved), request_id)
                    return
                attachment = message.photo[-1] if getattr(message, "photo", None) else message.document
                if not getattr(attachment, "file_size", None) or attachment.file_size > MAX_IMAGE:
                    raise SafeError("Send a photo smaller than 12 MB with a known file size.")
                pending = {"request_id": request_id, "state": "pending", "file_id": attachment.file_id,
                           "context": (message.caption or "")[:2000]}
                self.journal.put("request:" + request_id, pending)
                self.journal.put("latest_request", pending)
                await self.submit_saved(pending)
            except Exception as error:
                text = str(error) if isinstance(error, SafeError) else "That request could not be confirmed. No new publishing approval was granted."
                await self.tell(text + " Send /social status for the last preview, or /social retry to retry the same saved photo request without creating another post.")

    async def submit_saved(self, pending):
        request_id = pending["request_id"]
        saved = self.journal.get("request:" + request_id)
        if saved and saved.get("package"):
            await self.show(await self.readback(saved), request_id)
            return
        image = await self.download_file(pending["file_id"])
        original_path = self.save_original(request_id, image[0])
        package = await self.api.request("POST", "/api/integrations/social/intake",
            {"requestId": request_id, "context": pending["context"]}, image=image)
        self.validate_package(package)
        self.journal.put("original:" + package["intakeId"], {"path": str(original_path), "sha256": hashlib.sha256(image[0]).hexdigest()})
        self.journal.put("request:" + request_id, {"request_id": request_id, "package": package})
        await self.show(package, request_id)

    async def revise_or_status(self, message, record, text):
        package = await self.readback(record)
        if text.lower() in ("status", "retry"):
            await self.show(package, record.get("request_id"))
            return
        if package["fingerprint"] != record["package"]["fingerprint"] or package["revision"] != record["package"]["revision"]:
            await self.show(package, record.get("request_id"))
            await self.tell("That preview changed. Reply to the newest preview to revise it.")
            return
        payload = {"fingerprint": package["fingerprint"]}
        if text.lower().startswith("date "):
            value = text[5:].strip()
            if re.fullmatch(r"\d{4}-\d\d-\d\d \d\d:\d\d", value):
                try:
                    value = datetime.strptime(value, "%Y-%m-%d %H:%M").isoformat() + "-06:00"
                except ValueError:
                    raise SafeError("Use a valid date YYYY-MM-DD HH:MM (Regina time).") from None
            if not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)", value):
                raise SafeError("Reply with date YYYY-MM-DD HH:MM (Regina time).")
            payload["scheduleTime"] = value
        elif text.lower().startswith("caption "):
            value = text[8:].strip()
            if not value or len(value) > 2200:
                raise SafeError("Use a caption between 1 and 2,200 characters.")
            payload.update(captionInstagram=value, captionFacebook=value)
        else:
            return
        revised = await self.api.request("POST", "/api/integrations/social/intake/" + package["intakeId"] + "/revise", payload)
        await self.show(revised, record.get("request_id"))

    async def on_callback(self, update, context=None):
        query = update.callback_query
        match = re.fullmatch(r"tc:([adcseb]):([A-Za-z0-9_-]{24})", query.data or "")
        if not match or not self.authorized(query.message, query.from_user):
            await query.answer("This control is not available here.")
            return
        async with self.lock:
            try:
                operation, key = match.groups()
                record = self.journal.get("action:" + key)
                if (not record or record["preview_message_id"] != query.message.message_id
                        or record["chat_id"] != query.message.chat.id
                        or record["topic_id"] != query.message.message_thread_id
                        or time.time() - record["created_at"] > TTL):
                    await query.answer("This preview control expired or does not match.")
                    return
                await query.answer()
                if operation in ("d", "c"):
                    prompt = ("Reply directly to the preview with: date 2026-09-10 09:00 (Regina time; omit this parenthetical)"
                              if operation == "d" else "Reply directly to the preview with: caption Your revised caption")
                    await self.tell(prompt, reply_to_message_id=query.message.message_id)
                    return
                latest = await self.readback(record)
                original = record["package"]
                if operation == "s":
                    await self.show(latest, record.get("request_id"))
                    return
                if latest["fingerprint"] != original["fingerprint"] or latest["revision"] != original["revision"]:
                    await self.show(latest, record.get("request_id"))
                    await self.tell("This post changed. Review the latest preview before approving.")
                    return
                if operation in ("e", "b"):
                    if latest["status"] != "review":
                        raise SafeError("Only an unapproved review draft can be enhanced.")
                    await self.enhance(record, "cleanup" if operation == "e" else "remove_background")
                    return
                if latest["status"] in ("approved", "scheduled", "posting", "posted"):
                    await self.tell("Already approved. Current status: " + latest["status"])
                    return
                attempt_key = "approval:" + original["intakeId"] + ":" + original["fingerprint"]
                # Approval only mutates app state; its atomic API is idempotent.
                # A fresh explicit click may retry after current-state readback,
                # but Telegram redelivery of the same callback must never retry.
                if latest["status"] != "review":
                    await self.tell("This post is not currently available for approval. Check Status for its current state.")
                    return
                callback_id = getattr(query, "id", None)
                if not callback_id or self.journal.get("callback:" + callback_id):
                    await self.tell("That click was already handled. Check Status, or press Approve again to retry an unapproved review.")
                    return
                self.journal.put("callback:" + callback_id, {"action": key, "created_at": time.time()})
                previous_attempt = self.journal.get(attempt_key) or {}
                attempt_count = previous_attempt.get("attempts", 0) + 1
                record["approval_state"] = "attempted"
                self.journal.put("action:" + key, record)
                self.journal.put(attempt_key, {"state": "attempted", "attempts": attempt_count, "created_at": time.time()})
                approved = await self.api.request("POST", "/api/integrations/social/intake/" + original["intakeId"] + "/approve",
                    {"fingerprint": original["fingerprint"], "rightsConfirmed": True}, approval=True)
                if approved.get("status") not in ("approved", "scheduled", "posting", "posted"):
                    raise SafeError("Approval was not confirmed. Check Status.")
                record["approval_state"] = "confirmed"
                self.journal.put("action:" + key, record)
                self.journal.put(attempt_key, {"state": "confirmed", "attempts": attempt_count, "created_at": time.time()})
                await self.tell("Approved and queued for " + regina_date(approved.get("scheduleTime", original["scheduleTime"])) + ". You will receive the published links when posting succeeds.")
            except Exception as error:
                await self.tell(str(error) if isinstance(error, SafeError) else "That action could not be confirmed. Check Status before trying again.")

    def save_original(self, request_id, data):
        directory = Path(self.config["journal_path"]).parent / "originals"
        directory.mkdir(mode=0o700, exist_ok=True)
        if directory.stat().st_mode & 0o077:
            raise SafeError("Original image storage must be private.")
        path = directory / (request_id + ".image")
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600) if not path.exists() else None
        if fd is not None:
            with os.fdopen(fd, "wb") as file:
                file.write(data)
        elif hashlib.sha256(restricted_file(path).read_bytes()).digest() != hashlib.sha256(data).digest():
            raise SafeError("This submission's source image changed.")
        return path

    async def enhance(self, record, treatment):
        command = self.config.get("enhancement_command")
        if not isinstance(command, list) or not command or any(not isinstance(arg, str) for arg in command):
            raise SafeError("Photo enhancement is not configured. The original remains available for review.")
        package = record["package"]
        attempt_key = "enhancement:" + package["intakeId"] + ":" + package["fingerprint"] + ":" + treatment
        attempted = self.journal.get(attempt_key)
        if attempted:
            raise SafeError("This photo edit was already attempted. Its saved result needs reconciliation; it will not be generated again automatically.")
        original = self.journal.get("original:" + package["intakeId"])
        if not original:
            raise SafeError("The local original is unavailable. Keep the original preview or send a new photo.")
        image_path = restricted_file(original["path"])
        if hashlib.sha256(image_path.read_bytes()).hexdigest() != original["sha256"]:
            raise SafeError("The original image could not be verified.")
        enhancement_root = Path(self.config["journal_path"]).parent / "enhancements"
        enhancement_root.mkdir(mode=0o700, exist_ok=True)
        output_dir = enhancement_root / secrets.token_hex(12)
        job = {"intakeId": package["intakeId"], "fingerprint": package["fingerprint"],
               "inputPath": str(image_path), "inputSha256": original["sha256"],
               "treatment": treatment, "outputDir": str(output_dir)}
        job_path = enhancement_root / (output_dir.name + ".json")
        with os.fdopen(os.open(job_path, os.O_CREAT | os.O_WRONLY | os.O_EXCL, 0o600), "w") as file:
            json.dump(job, file)
        attempt = {"state": "started", "jobPath": str(job_path), "outputDir": str(output_dir), "created_at": time.time()}
        self.journal.put(attempt_key, attempt)
        await self.tell("Preparing a separate photo edit for review. Your original remains saved; nothing is approved by this step.")
        # No shell, no app secrets passed in environment, and no gateway-blocking wait.
        process = await asyncio.create_subprocess_exec(*command, "--job", str(job_path),
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
            start_new_session=True,
            env={key: value for key, value in os.environ.items() if key in ("PATH", "HOME", "LANG", "TMPDIR")})
        try:
            output, _ = await asyncio.wait_for(process.communicate(), timeout=660)
        except asyncio.TimeoutError:
            os.killpg(process.pid, signal.SIGKILL)
            await process.wait()
            raise SafeError("Photo editing timed out. Your original draft is unchanged.") from None
        if process.returncode or len(output) > MAX_RESPONSE:
            raise SafeError("Photo editing did not complete. Your original draft is unchanged.")
        result = json.loads(output)
        output_path = Path(result["outputPath"]).resolve()
        if not output_path.is_relative_to(output_dir.resolve()) or not output_path.is_file() or output_path.stat().st_size > MAX_IMAGE:
            raise SafeError("The edited photo could not be verified.")
        data = output_path.read_bytes()
        if hashlib.sha256(data).hexdigest() != result["sha256"]:
            raise SafeError("The edited photo hash did not match.")
        attempt.update(state="generated", outputPath=str(output_path), sha256=result["sha256"])
        self.journal.put(attempt_key, attempt)
        revised = await self.api.request("POST", "/api/integrations/social/intake/" + package["intakeId"] + "/image",
            {"fingerprint": package["fingerprint"], "mediaTreatment": "cleaned" if treatment == "cleanup" else "background_removed"},
            image=(data, image_mime(data)))
        attempt.update(state="uploaded", revision=revised.get("revision"), fingerprint=revised.get("fingerprint"))
        self.journal.put(attempt_key, attempt)
        await self.show(revised, record.get("request_id"))


def install(application, adapter):
    from telegram.ext import CallbackQueryHandler, MessageHandler, filters
    intake = Intake(load_config(), adapter.bot)

    class IntakeFilter(filters.MessageFilter):
        def filter(self, message):
            return intake.accepts(message)

    application.add_handler(MessageHandler(IntakeFilter(), intake.on_message, block=False))
    application.add_handler(CallbackQueryHandler(intake.on_callback, pattern=r"^tc:", block=False))
    return intake
