#!/usr/bin/env python3
"""Embed the branded app icon into the Asset Management web part manifest.

SharePoint reads preconfiguredEntries[].iconImageUrl for the toolbox tile. Embed the
exact sharepoint/app-icon.png bytes so the toolbox tile matches the App Catalog / .sppkg.
"""

from __future__ import annotations

import base64
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "src" / "webparts" / "assetManagement" / "AssetManagementWebPart.manifest.json"
ICON_SIZE = 96
ICON_CANDIDATES = (
    ROOT / "sharepoint" / "app-icon.png",
    ROOT / "teams" / "app-icon.png",
    ROOT / "assets" / "brand" / "app-icon.png",
    ROOT / "teams" / "color.png",
)


def load_icon_png_bytes() -> bytes:
    for candidate in ICON_CANDIDATES:
        if not candidate.exists():
            continue
        with Image.open(candidate) as icon:
            if icon.size == (ICON_SIZE, ICON_SIZE):
                return candidate.read_bytes()
        icon = Image.open(candidate).convert("RGBA")
        icon = icon.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        icon.save(buffer, format="PNG", optimize=True)
        return buffer.getvalue()
    raise SystemExit(
        "Missing app icon. Expected one of:\n  " + "\n  ".join(str(p) for p in ICON_CANDIDATES)
    )


def to_data_uri(png_bytes: bytes) -> str:
    encoded = base64.b64encode(png_bytes).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def main() -> None:
    png_bytes = load_icon_png_bytes()
    data_uri = to_data_uri(png_bytes)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = manifest.get("preconfiguredEntries") or []
    if not entries:
        raise SystemExit(f"No preconfiguredEntries in {MANIFEST}")

    entries[0]["iconImageUrl"] = data_uri
    MANIFEST.write_text(f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8")
    print(f"Updated {MANIFEST.relative_to(ROOT)} ({ICON_SIZE}x{ICON_SIZE} branded icon)")


if __name__ == "__main__":
    main()
