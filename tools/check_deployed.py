#!/usr/bin/env python3
"""Compare the local index.html against what GitHub Pages is actually serving.

Pages can lag a push by a minute or two, and browsers cache index.html for ten
minutes, so "I pushed but the site looks old" is usually one of those two things
rather than a broken deploy. This tells you which.

    python tools/check_deployed.py
"""

from __future__ import annotations

import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

SITE = "https://omar-hamzat.github.io/index.html"
ROOT = Path(__file__).resolve().parent.parent
ASSET_RE = re.compile(r'(?:styles\.css|app\.js)\?v=(\d+)')


def versions(html: str) -> set[int]:
    return {int(v) for v in ASSET_RE.findall(html)}


def main() -> int:
    local_path = ROOT / "index.html"
    if not local_path.exists():
        print(f"error: {local_path} not found", file=sys.stderr)
        return 1
    local = versions(local_path.read_text(encoding="utf-8"))

    # Cache-buster in the URL so we read the origin, not a CDN or browser copy.
    req = urllib.request.Request(
        f"{SITE}?cb=check",
        headers={"Cache-Control": "no-cache", "Pragma": "no-cache"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            live_html = resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        print(f"Live site returned HTTP {err.code}. Is GitHub Pages enabled?")
        return 1
    except urllib.error.URLError as err:
        print(f"Couldn't reach the live site: {err.reason}")
        return 1

    live = versions(live_html)

    print(f"local  index.html asset version: {sorted(local) or 'none found'}")
    print(f"live   index.html asset version: {sorted(live) or 'none found'}")
    print()

    # ASCII-only output: the legacy Windows console mangles non-ASCII.
    if not live:
        print("The live page has no versioned asset links yet - an older deploy.")
        print("Wait a minute and re-run.")
    elif local == live:
        print("Match. Your latest push is live.")
        print("If your browser still shows the old site, hard-refresh: Ctrl+Shift+R")
    elif max(live) < max(local, default=0):
        print("The live site is behind your local copy.")
        print("Either the push hasn't happened yet, or Pages is still building")
        print("(usually under a minute). Re-run this to check again.")
    else:
        print("The live site is AHEAD of your local copy - something was pushed")
        print("elsewhere. Run: git pull")

    return 0


if __name__ == "__main__":
    sys.exit(main())
