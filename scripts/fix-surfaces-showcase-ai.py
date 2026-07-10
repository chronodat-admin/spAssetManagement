#!/usr/bin/env python3
"""Fix brand inconsistencies in asset-management-surfaces-showcase-ai.png.

Default (--branding-only): keep AI layout/mockups; only fix a dark M365 footer if present.
Full (--swap-screenshots): also paste live screenshots into column frames (legacy layouts).

Chronodat wordmark: run embed-marketing-chronodat-logo.py after this script.

Run: python scripts/fix-surfaces-showcase-ai.py
Then: python scripts/embed-marketing-chronodat-logo.py
Then: python scripts/generate-marketing-store-crops.py
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

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
    wipe_dark_footer,
)

TARGET = BRAND_ROOT / "assets" / "website" / "marketing" / "asset-management-surfaces-showcase-ai.png"
REF_W, REF_H = 1536, 1024
REF_FOOTER_Y0 = 858
CARD_FILL = (248, 252, 254)

# Mockup screenshot insets inside each column card (1536×1024 reference)
REF_SCREENSHOT_BOXES = [
    (90, 402, 458, 798),   # SharePoint Online column
    (566, 402, 934, 798),  # Microsoft Teams column
]
REF_TITLE_OVERLAY = (108, 6, 310, 30)
SCREENSHOT_FILES = ["02-all-assets.png", "02-all-assets.png"]


def detect_footer_y0(img: Image.Image, default: int = REF_FOOTER_Y0) -> int:
    """Find the top edge of the dark AI footer bar."""
    arr = np.array(img.convert("RGB"), dtype=np.float32)
    lum = 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]
    start = int(img.height * 0.72)
    for y in range(start, img.height):
        if float(np.mean(lum[y])) < 120:
            return y
    return default


def clear_hero_artifacts(canvas: Image.Image) -> None:
    """Remove duplicate AI CHRC / logo strip between header and headline."""
    from lib.marketing_brand_fix import gradient_clear_zone

    w, _ = canvas.size
    # Sample from center column (light background), not the dark left header bar.
    gradient_clear_zone(canvas, int(w * 0.22), 118, int(w * 0.78), 188, ref_x=w // 2)


def clear_mockup_areas(canvas: Image.Image, boxes: list[tuple[int, int, int, int]]) -> None:
    draw = ImageDraw.Draw(canvas)
    for box in boxes:
        draw.rectangle(box, fill=CARD_FILL)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fix surfaces showcase AI sheet branding.")
    parser.add_argument(
        "--swap-screenshots",
        action="store_true",
        help="Paste live screenshots into SharePoint/Teams columns (legacy AI layouts).",
    )
    args = parser.parse_args()

    if not TARGET.is_file():
        raise SystemExit(f"Missing {TARGET}")

    img = Image.open(TARGET).convert("RGB")
    img = ensure_size(img, (REF_W, REF_H))

    if args.swap_screenshots:
        screenshot_boxes = [scale_box(box, img.width, img.height, REF_W, REF_H) for box in REF_SCREENSHOT_BOXES]
        title_overlay = scale_box(REF_TITLE_OVERLAY, img.width, img.height, REF_W, REF_H)
        clear_mockup_areas(img, screenshot_boxes)
        for box, shot in zip(screenshot_boxes, SCREENSHOT_FILES):
            paste_screenshot(img, shot, box)
            overlay_app_title(img, box, title_overlay)
        clear_hero_artifacts(img)
        fix_header_branding(img)

    footer_y0 = detect_footer_y0(img, REF_FOOTER_Y0)
    # Only replace footer when AI generated a dark bar (avg luminance check on bottom strip).
    arr = np.array(img.convert("RGB"), dtype=np.float32)
    lum = 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]
    if float(np.mean(lum[footer_y0:])) < 140:
        wipe_dark_footer(img, footer_y0)
        redraw_footer(img, footer_y0)

    img.save(TARGET, "PNG", optimize=True)
    mode = "swap-screenshots" if args.swap_screenshots else "branding-only"
    kb = TARGET.stat().st_size / 1024
    print(f"Fixed {TARGET.relative_to(BRAND_ROOT)} ({img.size[0]}x{img.size[1]}, {kb:.0f} KB, {mode})")


if __name__ == "__main__":
    main()
