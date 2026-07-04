#!/usr/bin/env python3
"""Composite the official Chronodat wordmark onto marketing one-pager PNGs.

Clears AI-generated or duplicated CHRONODAT text and platform badge pills
(M365 / SPFx / Teams) from the header, then pastes assets/brand/chronodat-logo.png
top-right at a consistent size (matches generate-marketing-one-pagers.py intent).

Usage:
  python scripts/embed-marketing-chronodat-logo.py
  npm run assets:marketing:logo
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "assets" / "brand" / "chronodat-logo.png"
MARKETING = ROOT / "assets" / "website" / "marketing"

SHEETS = [
    "asset-management-dashboard-showcase-ai.png",
    "asset-management-compliance-showcase-ai.png",
    "asset-management-analysis-showcase-ai.png",
    "asset-management-feature-grid-ai.png",
    "asset-management-all-features-infographic-ai.png",
    "asset-management-surfaces-showcase-ai.png",
]

# Fraction of canvas to wipe (top-right): AI logo + optional platform pills
CLEAR_WIDTH_RATIO = 0.32
CLEAR_HEIGHT_RATIO = 0.115
MARGIN_X_RATIO = 0.022
MARGIN_Y_RATIO = 0.034
LOGO_HEIGHT_RATIO = 0.042


def sample_header_fill(img: Image.Image, x0: int, y0: int, zone_h: int) -> tuple[int, int, int]:
    rgb = img.convert("RGB")
    w, _ = rgb.size
    px = max(8, x0 - 12)
    py = min(rgb.size[1] - 1, y0 + zone_h // 2)
    return rgb.getpixel((px, py))


def fix_sheet(path: Path, logo: Image.Image) -> None:
    base = Image.open(path).convert("RGBA")
    w, h = base.size

    zone_w = int(w * CLEAR_WIDTH_RATIO)
    zone_h = int(h * CLEAR_HEIGHT_RATIO)
    pad_x = int(w * 0.012)
    pad_y = int(h * 0.012)
    x0 = w - zone_w - pad_x
    y0 = pad_y

    fill = sample_header_fill(base, x0, y0, zone_h)
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rectangle((x0, y0, w - pad_x, y0 + zone_h), fill=(*fill, 255))
    base = Image.alpha_composite(base, layer)

    target_h = max(24, int(h * LOGO_HEIGHT_RATIO))
    target_w = max(1, int(logo.width * (target_h / logo.height)))
    mark = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = w - target_w - int(w * MARGIN_X_RATIO)
    y = int(h * MARGIN_Y_RATIO)
    base.alpha_composite(mark, (x, y))

    base.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)} ({w}x{h}, logo {target_w}x{target_h} @ {x},{y})")


def main() -> None:
    if not LOGO.is_file():
        raise SystemExit(f"Missing logo: {LOGO}")

    logo = Image.open(LOGO).convert("RGBA")
    print(f"Embedding {LOGO.relative_to(ROOT)} ({logo.size[0]}x{logo.size[1]}) on marketing sheets:")
    for name in SHEETS:
        path = MARKETING / name
        if not path.is_file():
            print(f"  SKIP missing {name}")
            continue
        fix_sheet(path, logo)
    print("Done. Run: npm run assets:marketing:crops")


if __name__ == "__main__":
    main()
