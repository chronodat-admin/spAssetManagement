#!/usr/bin/env python3
"""Fix brand inconsistencies in asset-management-feature-grid-ai.png.

Run: python scripts/fix-feature-grid-ai.py
Then: npm run assets:marketing:crops
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.marketing_brand_fix import (  # noqa: E402
    ROOT as BRAND_ROOT,
    ensure_size,
    fix_header_branding,
    overlay_app_title,
    paste_screenshot,
    redraw_footer,
    scale_box,
)

TARGET = BRAND_ROOT / "assets" / "website" / "marketing" / "asset-management-feature-grid-ai.png"
REF_W, REF_H = 1536, 1024
REF_FOOTER_Y0 = 850
# Laptop / device mockup screen area on the right
REF_MOCKUP_BOX = (700, 210, 1500, 830)
REF_TITLE_OVERLAY = (108, 8, 320, 34)


def main() -> None:
    if not TARGET.is_file():
        raise SystemExit(f"Missing {TARGET}")

    img = Image.open(TARGET).convert("RGB")
    img = ensure_size(img, (REF_W, REF_H))

    mockup_box = scale_box(REF_MOCKUP_BOX, img.width, img.height, REF_W, REF_H)
    title_overlay = scale_box(REF_TITLE_OVERLAY, img.width, img.height, REF_W, REF_H)

    paste_screenshot(img, "01-dashboard.png", mockup_box)
    overlay_app_title(img, mockup_box, title_overlay)

    footer_y0 = int(REF_FOOTER_Y0 * (img.height / REF_H))
    redraw_footer(img, footer_y0)
    fix_header_branding(img)

    img.save(TARGET, "PNG", optimize=True)
    kb = TARGET.stat().st_size / 1024
    print(f"Fixed {TARGET.relative_to(BRAND_ROOT)} ({img.size[0]}x{img.size[1]}, {kb:.0f} KB)")


if __name__ == "__main__":
    main()
