"""Prepare sharepoint assets for .sppkg packaging.

All icon sizes are generated together by scripts/generate-app-icons.py so the
Partner Center logo, App Catalog tile, Teams icons, and web part toolbox stay
consistent. This script refreshes icons then removes stale packaged copies.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHAREPOINT_ROOT = ROOT / "sharepoint"
SHAREPOINT_ASSETS = ROOT / "sharepoint" / "assets"
TEAMS = ROOT / "teams"
ICON_NAME = "app-icon.png"
STALE_ICON_NAMES = (
    "app-icon-1-0-2-10.png",
    "app-icon-1-0-2-11.png",
    "app-icon-1-0-2-12.png",
    "asset-management-icon-96.png",
)


def main() -> None:
    print("Preparing sharepoint/assets for .sppkg (catalog icon only)...")
    subprocess.run([sys.executable, str(ROOT / "scripts" / "generate-app-icons.py")], check=True)

    catalog = SHAREPOINT_ROOT / ICON_NAME
    if not catalog.exists():
        raise SystemExit(f"Missing {catalog} after icon generation.")

    for stale_name in STALE_ICON_NAMES:
        for stale in (SHAREPOINT_ASSETS / stale_name, SHAREPOINT_ROOT / stale_name, TEAMS / stale_name):
            if stale.exists():
                stale.unlink()
                print(f"  removed stale {stale.relative_to(ROOT)}")

    print("Done.")


if __name__ == "__main__":
    main()
