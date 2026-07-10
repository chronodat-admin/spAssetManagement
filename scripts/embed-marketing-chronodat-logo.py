#!/usr/bin/env python3
"""Composite the official Chronodat wordmark onto marketing one-pager PNGs.

The AI sheets are generated with an intentionally empty top-right corner (see
scripts/amh_ai_prompts.py). This script stamps assets/brand/chronodat-logo.png
directly onto that clean corner — no background wipe, no box, no seams. It picks a
white wordmark for dark headers and the dark-ink wordmark for light headers.

Usage:
  python scripts/embed-marketing-chronodat-logo.py              # marketing masters
  python scripts/embed-marketing-chronodat-logo.py --store-only # 1366x768 crops
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.marketing_brand_fix import clean_logo_edges  # noqa: E402

LOGO = ROOT / "assets" / "brand" / "chronodat-logo.png"
MARKETING = ROOT / "assets" / "website" / "marketing"
STORE = ROOT / "assets" / "store" / "listing" / "screenshots" / "marketing"

SHEETS = [
    "asset-management-dashboard-showcase-ai.png",
    "asset-management-compliance-showcase-ai.png",
    "asset-management-analysis-showcase-ai.png",
    "asset-management-feature-grid-ai.png",
    "asset-management-all-features-infographic-ai.png",
    "asset-management-surfaces-showcase-ai.png",
]

STORE_CROPS = [
    "dashboard-1366x768.png",
    "feature-grid-1366x768.png",
    "compliance-1366x768.png",
    "analysis-1366x768.png",
    "all-features-1366x768.png",
    "surfaces-1366x768.png",
]

MARGIN_X_RATIO = 0.022
MARGIN_Y_RATIO = 0.030
LOGO_HEIGHT_RATIO = 0.042


def light_wordmark(logo: Image.Image) -> Image.Image:
    """White wordmark for dark backgrounds; keep the gold accent, drop everything else."""
    rgba = logo.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    visible = a > 24
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    gold = visible & (r > 140) & (g > 80) & (b < 130) & (lum < 185)
    ink = visible & ~gold & (lum < 110)
    arr[ink, 0:3] = 255
    arr[ink, 3] = 255
    arr[visible & ~gold & ~ink, 3] = 0
    return Image.fromarray(arr.astype(np.uint8))


def region_luminance(img: Image.Image, box: tuple[int, int, int, int]) -> float:
    crop = img.crop(box).convert("RGB")
    arr = np.array(crop, dtype=np.float32)
    return float(np.mean(0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]))


def top_bar_height(img: Image.Image) -> int:
    """Return the height of a solid dark full-width top bar, or 0 if the header is light."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    ref_x = w // 2
    first = rgb.getpixel((ref_x, 2))
    first_lum = 0.299 * first[0] + 0.587 * first[1] + 0.114 * first[2]
    if first_lum >= 150:
        return 0  # light header, no dark bar
    for y in range(min(160, h)):
        r, g, b = rgb.getpixel((ref_x, y))
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        if lum >= 150:
            return y
    return 0


def fix_sheet(path: Path, dark_logo: Image.Image, light_logo: Image.Image) -> None:
    base = Image.open(path).convert("RGBA")
    w, h = base.size

    target_h = max(24, int(h * LOGO_HEIGHT_RATIO))
    target_w_dark = max(1, int(dark_logo.width * (target_h / dark_logo.height)))
    x = w - target_w_dark - int(w * MARGIN_X_RATIO)

    bar_h = top_bar_height(base)
    if bar_h >= max(28, int(h * 0.03)):
        # Solid dark top bar: center the logo vertically inside it.
        y = max(4, (bar_h - target_h) // 2)
        logo_box = (x, y, x + target_w_dark, y + target_h)
        dark_bg = True
    else:
        y = int(h * MARGIN_Y_RATIO)
        logo_box = (x, y, x + target_w_dark, y + target_h)
        dark_bg = region_luminance(base, logo_box) < 140

    mark = light_logo if dark_bg else dark_logo
    target_w = max(1, int(mark.width * (target_h / mark.height)))
    x = w - target_w - int(w * MARGIN_X_RATIO)
    mark = mark.resize((target_w, target_h), Image.Resampling.LANCZOS)
    base.alpha_composite(mark, (x, y))

    base.convert("RGB").save(path, "PNG", optimize=True)
    mode = "light" if dark_bg else "dark"
    print(f"  {path.name} ({w}x{h}, {mode} logo {target_w}x{target_h} @ {x},{y}, bar={bar_h})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Embed Chronodat wordmark on marketing images.")
    parser.add_argument(
        "--store-only",
        action="store_true",
        help="Only process 1366x768 store crops (run after generate-marketing-store-crops.py).",
    )
    args = parser.parse_args()

    if not LOGO.is_file():
        raise SystemExit(f"Missing logo: {LOGO}")

    dark_logo = clean_logo_edges(Image.open(LOGO).convert("RGBA"))
    light_logo = light_wordmark(Image.open(LOGO).convert("RGBA"))

    if args.store_only:
        targets = [STORE / name for name in STORE_CROPS]
    else:
        targets = [MARKETING / name for name in SHEETS]

    print(f"Embedding {LOGO.name}:")
    for path in targets:
        if not path.is_file():
            print(f"  SKIP missing {path.name}")
            continue
        fix_sheet(path, dark_logo, light_logo)

    print("Done.")


if __name__ == "__main__":
    main()
