#!/usr/bin/env python3
"""Harmless sandbox probe: no Codex, image generation, credentials or network calls."""
import argparse
import json
import os
from pathlib import Path
import pwd
import subprocess
import uuid
from worker import isolated_args

parser = argparse.ArgumentParser()
parser.add_argument("--config", required=True)
args = parser.parse_args()
config = json.loads(Path(args.config).read_text())
root = Path(config["workspaceRoot"]).resolve()
name = "probe-" + uuid.uuid4().hex
workspace = root / name
workspace.mkdir(mode=0o700)
account = pwd.getpwnam(config["user"])
os.chown(workspace, account.pw_uid, account.pw_gid)
sentinel = root / ("." + name + "-neighbor")
sentinel.write_text("synthetic probe only")
sentinel.chmod(0o644)
code = '''import os,sys
from pathlib import Path
workspace,neighbor,home=map(Path,sys.argv[1:])
assert not neighbor.exists(), "neighbor not masked"
for p in ["/run/credentials","/opt/eda-media","/opt/eda-workflow","/opt/truecolor-social","/var/lib/eda-creative-queue","/etc/truecolor-social"]:
 assert not os.access(p,os.R_OK), "denied path readable"
assert os.access(home,os.R_OK|os.W_OK), "managed home inaccessible"
out=workspace/"probe-ok.txt"
out.write_text("synthetic sandbox probe passed")
print("SANDBOX_PROBE_OK")
'''
try:
    result = subprocess.run(isolated_args(config, workspace, name) + ["/usr/bin/python3", "-c", code,
                            str(workspace), str(sentinel), config["codexHome"]],
                            env={"PATH": "/usr/bin:/bin", "LANG": "C.UTF-8"}, capture_output=True, timeout=45)
    print("SANDBOX_PROBE_OK" if result.returncode == 0 and b"SANDBOX_PROBE_OK" in result.stdout else "SANDBOX_PROBE_FAILED")
    raise SystemExit(0 if result.returncode == 0 else 1)
finally:
    subprocess.run(["systemctl", "stop", "tc-photo-" + name + ".service"], capture_output=True, timeout=30)
    sentinel.unlink(missing_ok=True)
