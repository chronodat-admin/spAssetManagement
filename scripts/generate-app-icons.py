"""Generate branded Asset Management icon assets from a single source render.

Produces:
  assets/brand/app-icon.png   - square master (feeds prepare-sppkg-assets.py)
  teams/color.png             - 192x192 Teams color icon
  teams/outline.png           - 32x32 transparent white outline icon

The source render is a blue rounded tile with a white asset cube on a light
background. We tightly crop to the tile, re-apply crisp rounded corners with an
alpha channel, then export the sizes each surface needs.
"""

from __future__ import annotations

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
TEAMS_COLOR = ROOT / "teams" / "color.png"
TEAMS_OUTLINE = ROOT / "teams" / "outline.png"

MASTER_SIZE = 512
CORNER_RATIO = 0.22  # rounded-square corner radius as a fraction of the side


def find_source() -> Path:
    for candidate in SOURCE_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit(
        "Missing source render. Expected one of:\n  "
        + "\n  ".join(str(p) for p in SOURCE_CANDIDATES)
    )


def rounded_mask(size: int, radius: int) -> Image.Image:
    # Supersample for smooth anti-aliased corners.
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

    # Background is near-white; keep everything that clearly is not.
    non_bg = ~((arr[:, :, 0] > 244) & (arr[:, :, 1] > 244) & (arr[:, :, 2] > 244))
    ys, xs = np.where(non_bg)
    if xs.size == 0:
        raise SystemExit("Could not detect the icon tile in the source render.")
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())

    crop = src.crop((x0, y0, x1 + 1, y1 + 1))

    # Center the tile in a square canvas with a small transparent margin.
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


def save_png(img: Image.Image, dst: Path, size: int) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(dst, "PNG", optimize=True)
    print(f"  {dst.relative_to(ROOT)} ({size}x{size} RGBA)")


def build_outline() -> Image.Image:
    """Monochrome white isometric-cube glyph on a transparent background.

    Teams renders this on the accent color, so a thin stroke disappears at 32px.
    We fill the solid cube silhouette in white and carve thin transparent gaps
    along the three internal edges — the accent color shows through the gaps, so
    the shape still reads as a 3D cube even at small sizes.
    """
    scale = 16
    size = 32 * scale
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

    # Solid outer silhouette (hexagon).
    draw.polygon(
        [top, upper_right, lower_right, bottom, lower_left, upper_left],
        fill=255,
    )

    # Carve the internal "Y" edges so the three faces are distinct.
    gap = max(2, int(size * 0.035))
    for a, b in ((upper_left, center), (upper_right, center), (center, bottom)):
        draw.line([a, b], fill=0, width=gap)

    glyph = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    glyph.putalpha(alpha)
    return glyph.resize((32, 32), Image.Resampling.LANCZOS)


def main() -> None:
    source = find_source()
    print(f"Generating icon assets from {source.name}...")
    master = build_master(source)

    save_png(master, BRAND_ICON, MASTER_SIZE)
    save_png(master, TEAMS_COLOR, 192)

    outline = build_outline()
    TEAMS_OUTLINE.parent.mkdir(parents=True, exist_ok=True)
    outline.save(TEAMS_OUTLINE, "PNG", optimize=True)
    print(f"  {TEAMS_OUTLINE.relative_to(ROOT)} (32x32 outline)")

    print("Done.")


if __name__ == "__main__":
    main()
