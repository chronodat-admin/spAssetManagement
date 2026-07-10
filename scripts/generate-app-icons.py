"""Generate all Asset Management icon assets from a single AI/source render.

Single master → every surface Microsoft expects (Partner Center, SPFx, Teams, toolbox):

  assets/brand/app-icon.png              512×512 RGBA master archive
  assets/store/listing/logo-300x300.png  Partner Center large logo (216–350 px)
  sharepoint/app-icon.png                96×96 RGB  (.sppkg / App Catalog)
  teams/app-icon.png                     96×96 RGB  (ClientSideAssets sweep)
  teams/color.png                        192×192 RGBA (Teams manifest)
  teams/outline.png                      32×32 RGBA white glyph (Teams manifest)
  Web part manifest iconImageUrl         96×96 via sync-webpart-icon.py

Chronodat.com theme (css/colors/yellow.css): gold #f1dd00, charcoal #191a1c.
Microsoft Marketplace large logo: square PNG between 216×216 and 350×350 px.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PROJECT_ASSETS = Path.home() / ".cursor" / "projects" / "c-spAssetManagement" / "assets"
SOURCE_CANDIDATES = [
    ROOT / "assets" / "app-icon-source-v2.png",
    PROJECT_ASSETS / "app-icon-source-v2.png",
    ROOT / "assets" / "app-icon-source.png",
    PROJECT_ASSETS / "app-icon-source.png",
]

BRAND_ICON = ROOT / "assets" / "brand" / "app-icon.png"
STORE_LISTING_ICON = ROOT / "assets" / "store" / "listing" / "logo-300x300.png"
SHAREPOINT_ICON = ROOT / "sharepoint" / "app-icon.png"
TEAMS_APP_ICON = ROOT / "teams" / "app-icon.png"
TEAMS_COLOR = ROOT / "teams" / "color.png"
TEAMS_OUTLINE = ROOT / "teams" / "outline.png"

MASTER_SIZE = 512
PARTNER_CENTER_SIZE = 300  # within 216–350 px requirement
CATALOG_SIZE = 96
TEAMS_COLOR_SIZE = 192
TEAMS_OUTLINE_SIZE = 32
CORNER_RATIO = 0.22
# Light neutral tile background for SharePoint catalog / toolbox (opaque PNG).
TILE_BG = (245, 247, 250)


def find_source() -> Path:
    for candidate in SOURCE_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit(
        "Missing source render. Expected one of:\n  "
        + "\n  ".join(str(p) for p in SOURCE_CANDIDATES)
    )


def rounded_mask(size: int, radius: int) -> Image.Image:
    scale = 4
    big = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(big)
    draw.rounded_rectangle(
        (0, 0, size * scale - 1, size * scale - 1),
        radius=radius * scale,
        fill=255,
    )
    return big.resize((size, size), Image.Resampling.LANCZOS)


def build_master(source: Path) -> Image.Image:
    src = Image.open(source).convert("RGB")
    arr = np.asarray(src)

    non_bg = ~((arr[:, :, 0] > 244) & (arr[:, :, 1] > 244) & (arr[:, :, 2] > 244))
    ys, xs = np.where(non_bg)
    if xs.size == 0:
        raise SystemExit("Could not detect the icon tile in the source render.")
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())

    crop = src.crop((x0, y0, x1 + 1, y1 + 1))
    side = max(crop.size)
    margin = int(side * 0.04)
    canvas_side = side + margin * 2
    square = Image.new("RGB", (canvas_side, canvas_side), (255, 255, 255))
    off = ((canvas_side - crop.size[0]) // 2, (canvas_side - crop.size[1]) // 2)
    square.paste(crop, off)

    master = square.resize((MASTER_SIZE, MASTER_SIZE), Image.Resampling.LANCZOS).convert("RGBA")
    mask = rounded_mask(MASTER_SIZE, int(MASTER_SIZE * CORNER_RATIO))
    master.putalpha(mask)
    return master


def square_crop(img: Image.Image) -> Image.Image:
    square = img.convert("RGBA")
    if square.size[0] != square.size[1]:
        side = min(square.size)
        left = (square.size[0] - side) // 2
        top = (square.size[1] - side) // 2
        square = square.crop((left, top, left + side, top + side))
    return square


def save_rgba(master: Image.Image, dst: Path, size: int) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    square_crop(master).resize((size, size), Image.Resampling.LANCZOS).save(
        dst, "PNG", optimize=True
    )
    print(f"  {dst.relative_to(ROOT)} ({size}x{size} RGBA)")


def save_catalog_rgb(master: Image.Image, dst: Path, size: int = CATALOG_SIZE) -> None:
    """SharePoint / toolbox icons: opaque RGB on the same light tile as the catalog."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    resized = square_crop(master).resize((size, size), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", (size, size), TILE_BG)
    bg.paste(resized, mask=resized.split()[3])
    bg.save(dst, "PNG", optimize=True)
    print(f"  {dst.relative_to(ROOT)} ({size}x{size} RGB)")


def build_outline() -> Image.Image:
    """White isometric-cube glyph on transparent (Teams outline rules)."""
    scale = 16
    size = TEAMS_OUTLINE_SIZE * scale
    alpha = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(alpha)

    def pt(fx: float, fy: float) -> tuple[int, int]:
        return int(fx * size), int(fy * size)

    top = pt(0.50, 0.13)
    upper_right = pt(0.85, 0.33)
    upper_left = pt(0.15, 0.33)
    center = pt(0.50, 0.53)
    lower_right = pt(0.85, 0.67)
    lower_left = pt(0.15, 0.67)
    bottom = pt(0.50, 0.87)

    draw.polygon([top, upper_right, lower_right, bottom, lower_left, upper_left], fill=255)

    gap = max(2, int(size * 0.035))
    for a, b in ((upper_left, center), (upper_right, center), (center, bottom)):
        draw.line([a, b], fill=0, width=gap)

    glyph = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    glyph.putalpha(alpha)
    return glyph.resize((TEAMS_OUTLINE_SIZE, TEAMS_OUTLINE_SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    source = find_source()
    print(f"Generating icon assets from {source.name}...")
    master = build_master(source)

    save_rgba(master, BRAND_ICON, MASTER_SIZE)
    save_rgba(master, STORE_LISTING_ICON, PARTNER_CENTER_SIZE)
    save_catalog_rgb(master, SHAREPOINT_ICON, CATALOG_SIZE)
    save_catalog_rgb(master, TEAMS_APP_ICON, CATALOG_SIZE)
    save_rgba(master, TEAMS_COLOR, TEAMS_COLOR_SIZE)

    outline = build_outline()
    TEAMS_OUTLINE.parent.mkdir(parents=True, exist_ok=True)
    outline.save(TEAMS_OUTLINE, "PNG", optimize=True)
    print(f"  {TEAMS_OUTLINE.relative_to(ROOT)} ({TEAMS_OUTLINE_SIZE}x{TEAMS_OUTLINE_SIZE} outline)")

    subprocess.run([sys.executable, str(ROOT / "scripts" / "sync-webpart-icon.py")], check=True)
    print("Done — all icons derived from one master.")


if __name__ == "__main__":
    main()
