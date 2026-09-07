"""Native Hermes Telegram extension; never creates a poller or webhook."""
import importlib.util
from pathlib import Path
import sys


def register(ctx):
    def wire(application, adapter):
        path = Path(__file__).with_name("intake.py")
        spec = importlib.util.spec_from_file_location("truecolor_social_intake", path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        module.install(application, adapter)

    ctx.register_telegram_handler(wire)
