#!/usr/bin/env python3
"""Bump the ?v= cache-busting number on styles.css and app.js in index.html.

GitHub Pages serves those assets with a 10-minute max-age, so without a version
change a returning visitor can load newly deployed HTML against a stale script.
Run this after editing styles.css or app.js, before you commit.

    python tools/bump_assets.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
ASSET_RE = re.compile(r'((?:styles\.css|app\.js)\?v=)(\d+)')


def main() -> int:
    if not INDEX.exists():
        print(f"error: {INDEX} not found", file=sys.stderr)
        return 1

    html = INDEX.read_text(encoding="utf-8")
    versions = [int(m.group(2)) for m in ASSET_RE.finditer(html)]

    if not versions:
        print(
            "error: no 'styles.css?v=N' or 'app.js?v=N' found in index.html.\n"
            "       Add ?v=1 to both tags first, then re-run.",
            file=sys.stderr,
        )
        return 1

    new_version = max(versions) + 1
    updated, count = ASSET_RE.subn(rf'\g<1>{new_version}', html)

    # newline="\n" so this never introduces CRLF on Windows.
    INDEX.write_text(updated, encoding="utf-8", newline="\n")

    # ASCII-only output: the legacy Windows console mangles non-ASCII.
    print(f"Bumped {count} asset link(s) to ?v={new_version}")
    print("Now commit and push from the Source Control panel.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
