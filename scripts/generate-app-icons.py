"""Generate all Asset Management icon assets from the branded source render.

Outputs:
  assets/brand/app-icon.png              512x512 RGBA master archive
  assets/store/listing/logo-300x300.png  Partner Center large logo
  sharepoint/app-icon.png                96x96 RGB  (.sppkg / App Catalog)
  teams/app-icon.png                     96x96 RGB
  teams/color.png                        192x192 RGBA
  teams/outline.png                      32x32 RGBA white glyph
  src/assets/images/asset-management-icon-96.png  in-app brand tile
  Web part manifest iconImageUrl         96x96 via sync-webpart-icon.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PROJECT_ASSETS = Path.home() / ".cursor" / "projects" / "c-spAssetManagement" / "assets"
SOURCE_CANDIDATES = [
    PROJECT_ASSETS / "asset-mgmt-icon-variant-b-barcode-box.png",
    PROJECT_ASSETS / "asset-management-packaging-icon-source.png",
    PROJECT_ASSETS / "asset-management-icon-source.png",
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
RUNTIME_IMAGES = ROOT / "src" / "assets" / "images"
RUNTIME_BRAND_ICON = RUNTIME_IMAGES / "asset-management-icon-96.png"
RUNTIME_NAV_ICON = RUNTIME_IMAGES / "asset-management-icon-nav.png"

MASTER_SIZE = 512
PARTNER_CENTER_SIZE = 300
CATALOG_SIZE = 96
TEAMS_COLOR_SIZE = 192
TEAMS_OUTLINE_SIZE = 32
CORNER_RATIO = 0.22
# Fraction of the icon tile the box artwork should fill (source leaves big blue margins).
TILE_FILL_RATIO = 0.92
TILE_BG = (245, 247, 250)
# Match spServiceDesk / Microsoft Teams accent gradient tile.
BLUE_LIGHT = (0, 120, 212)
BLUE_DARK = (0, 78, 152)


def blue_gradient_pixel(x: int, y: int, width: int, height: int) -> tuple[int, int, int]:
    t = (x / max(width - 1, 1) * 0.55) + (y / max(height - 1, 1) * 0.45)
    t = max(0.0, min(1.0, t))
    return (
        round(BLUE_LIGHT[0] + (BLUE_DARK[0] - BLUE_LIGHT[0]) * t),
        round(BLUE_LIGHT[1] + (BLUE_DARK[1] - BLUE_LIGHT[1]) * t),
        round(BLUE_LIGHT[2] + (BLUE_DARK[2] - BLUE_LIGHT[2]) * t),
    )


def is_dark_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 32:
        return True
    return r < 60 and g < 60 and b < 70


def is_blue_tile_pixel(r: int, g: int, b: int, a: int) -> bool:
    """Detect Service Desk / Microsoft blue gradient background pixels."""
    if a < 32:
        return True
    if is_dark_background_pixel(r, g, b, a):
        return True
    if b > max(r, g) + 8 and b > 70:
        return True
    # Soft blue shadows cast on the tile surface.
    if b > 55 and g > 35 and r < 55 and (b - r) > 25:
        return True
    return False


def crop_source_artwork(source: Path) -> Image.Image:
    rgba = Image.open(source).convert("RGBA")
    arr = np.asarray(rgba)
    h, w = arr.shape[:2]

    visible = arr[:, :, 3] > 16
    light_margin = (
        (arr[:, :, 0] > 245)
        & (arr[:, :, 1] > 245)
        & (arr[:, :, 2] > 245)
        & (arr[:, :, 3] > 200)
    )
    fg = visible & ~light_margin
    if not fg.any():
        fg = visible
    ys, xs = np.where(fg)
    pad = max(1, int(min(h, w) * 0.01))
    x0 = max(0, int(xs.min()) - pad)
    y0 = max(0, int(ys.min()) - pad)
    x1 = min(w, int(xs.max()) + pad + 1)
    y1 = min(h, int(ys.max()) + pad + 1)
    return rgba.crop((x0, y0, x1, y1))


def apply_blue_brand_background(img: Image.Image) -> Image.Image:
    """Replace dark tile background with the Chronodat blue gradient used by Service Desk."""
    result = img.convert("RGBA")
    width, height = result.size
    pixels = result.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if not is_dark_background_pixel(r, g, b, a):
                continue
            nr, ng, nb = blue_gradient_pixel(x, y, width, height)
            pixels[x, y] = (nr, ng, nb, a if a > 0 else 255)
    return result


def create_blue_gradient_square(side: int) -> Image.Image:
    img = Image.new("RGBA", (side, side), BLUE_LIGHT + (255,))
    pixels = img.load()
    for y in range(side):
        for x in range(side):
            nr, ng, nb = blue_gradient_pixel(x, y, side, side)
            pixels[x, y] = (nr, ng, nb, 255)
    return img


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


def zoom_to_subject(source: Path, fill: float = TILE_FILL_RATIO) -> Image.Image:
    """Center-crop into the blue tile margin so the artwork fills more of the icon.

    The source render leaves large empty blue borders (the box sits low-right),
    which makes the logo look small. We find the real subject bounding box,
    recenter on it, and crop a square that lets the subject occupy `fill` of the
    tile — without clipping and without seams (the whole background stays the
    source's blue gradient).
    """
    rgba = Image.open(source).convert("RGBA")
    arr = np.asarray(rgba).astype(int)
    h, w = arr.shape[:2]
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    dark = (r < 60) & (g < 60) & (b < 70)
    blue1 = (b > np.maximum(r, g) + 8) & (b > 70)
    blue2 = (b > 55) & (g > 35) & (r < 55) & ((b - r) > 25)
    background = (a < 32) | dark | blue1 | blue2
    fg = ~background
    if not fg.any():
        return rgba

    ys, xs = np.where(fg)
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    subject = max(x1 - x0 + 1, y1 - y0 + 1)

    side = subject / max(0.1, min(fill, 1.0))
    max_centered = 2 * min(cx, w - cx, cy, h - cy)
    side = min(side, max_centered)
    side = max(side, subject)  # never clip the subject
    half = side / 2.0

    left = max(0, int(round(cx - half)))
    top = max(0, int(round(cy - half)))
    right = min(w, int(round(cx + half)))
    bottom = min(h, int(round(cy + half)))
    return rgba.crop((left, top, right, bottom))


def build_master(source: Path, size: int = MASTER_SIZE) -> Image.Image:
    """Scale the AI/source artwork to a square master with rounded corners."""
    cropped = zoom_to_subject(source)

    side = max(cropped.size)
    square = create_blue_gradient_square(side)
    offset = ((side - cropped.size[0]) // 2, (side - cropped.size[1]) // 2)
    square.paste(cropped, offset, cropped)
    square = apply_blue_brand_background(square)

    master = square.resize((size, size), Image.Resampling.LANCZOS)
    radius = int(size * CORNER_RATIO)
    mask = rounded_mask(size, radius)
    master.putalpha(mask)
    return master


def build_nav_icon(source: Path, size: int = CATALOG_SIZE) -> Image.Image:
    """Foreground artwork on transparent background for the top accent bar."""
    cropped = crop_source_artwork(source)
    arr = np.array(cropped)
    h, w = arr.shape[:2]
    out = np.zeros((h, w, 4), dtype=np.uint8)

    for y in range(h):
        for x in range(w):
            r, g, b, a = (int(v) for v in arr[y, x])
            if is_blue_tile_pixel(r, g, b, a):
                continue
            out[y, x] = (r, g, b, a if a > 0 else 255)

    foreground = Image.fromarray(out)
    bbox = foreground.getbbox()
    if not bbox:
        raise SystemExit("Could not isolate nav icon foreground from source render.")
    foreground = foreground.crop(bbox)

    side = max(foreground.size)
    pad = max(2, int(side * 0.04))
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    offset = (
        pad + (side - foreground.size[0]) // 2,
        pad + (side - foreground.size[1]) // 2,
    )
    canvas.paste(foreground, offset, foreground)
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


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
    dst.parent.mkdir(parents=True, exist_ok=True)
    resized = square_crop(master).resize((size, size), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", (size, size), TILE_BG)
    bg.paste(resized, mask=resized.split()[3])
    bg.save(dst, "PNG", optimize=True)
    print(f"  {dst.relative_to(ROOT)} ({size}x{size} RGB)")


def build_asset_box_outline(size: int = TEAMS_OUTLINE_SIZE) -> Image.Image:
    """White centered parcel glyph on transparent for Teams outline."""
    scale = 16
    canvas = size * scale
    glyph = Image.new("RGBA", (canvas, canvas), (255, 255, 255, 0))
    draw = ImageDraw.Draw(glyph)

    def pt(x: float, y: float) -> tuple[int, int]:
        return int(x * canvas), int(y * canvas)

    stroke = max(1, int(canvas * 0.085))
    radius = int(canvas * 0.035)

    # Big isometric shipping box filling most of the 32x32 slot so it reads clearly in
    # the Teams left rail, styled to match the parcel-box app logo.
    top = [pt(0.50, 0.06), pt(0.94, 0.29), pt(0.50, 0.52), pt(0.06, 0.29)]
    left = [pt(0.06, 0.29), pt(0.50, 0.52), pt(0.50, 0.94), pt(0.06, 0.71)]
    right = [pt(0.50, 0.52), pt(0.94, 0.29), pt(0.94, 0.71), pt(0.50, 0.94)]
    for polygon in (top, left, right):
        draw.line(polygon + [polygon[0]], fill=(255, 255, 255, 255), width=stroke, joint="curve")

    # Lid flap seam down the middle of the top face (the packing-tape line) — makes it
    # read as a closed shipping box, matching the logo, not an abstract cube.
    draw.line(
        [pt(0.50, 0.06), pt(0.50, 0.52)],
        fill=(255, 255, 255, 255),
        width=max(1, int(stroke * 0.7)),
        joint="curve",
    )

    # Barcode-style label on the front-left face, echoing the logo's asset tag.
    label = [pt(0.19, 0.54), pt(0.33, 0.61), pt(0.33, 0.72), pt(0.19, 0.64)]
    draw.line(label + [label[0]], fill=(255, 255, 255, 255), width=max(1, int(stroke * 0.5)), joint="curve")

    # Slight softening avoids jagged edges after downsampling.
    alpha = glyph.getchannel("A")
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=radius / 8))
    glyph.putalpha(alpha)
    return glyph.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    source = find_source()
    print(f"Generating icon assets from {source.name}...")
    master = build_master(source)

    save_rgba(master, BRAND_ICON, MASTER_SIZE)
    save_rgba(master, STORE_LISTING_ICON, PARTNER_CENTER_SIZE)
    save_catalog_rgb(master, SHAREPOINT_ICON, CATALOG_SIZE)
    save_catalog_rgb(master, TEAMS_APP_ICON, CATALOG_SIZE)
    save_rgba(master, TEAMS_COLOR, TEAMS_COLOR_SIZE)
    save_rgba(master, RUNTIME_BRAND_ICON, CATALOG_SIZE)
    save_rgba(build_nav_icon(source), RUNTIME_NAV_ICON, CATALOG_SIZE)

    outline = build_asset_box_outline(TEAMS_OUTLINE_SIZE)
    TEAMS_OUTLINE.parent.mkdir(parents=True, exist_ok=True)
    outline.save(TEAMS_OUTLINE, "PNG", optimize=True)
    print(f"  {TEAMS_OUTLINE.relative_to(ROOT)} ({TEAMS_OUTLINE_SIZE}x{TEAMS_OUTLINE_SIZE} outline)")

    # Keep a project copy for future regenerations.
    archive = ROOT / "assets" / "app-icon-source-v2.png"
    archive.parent.mkdir(parents=True, exist_ok=True)
    Image.open(source).convert("RGBA").save(archive, "PNG", optimize=True)
    print(f"  {archive.relative_to(ROOT)} (archived source)")

    subprocess.run([sys.executable, str(ROOT / "scripts" / "sync-webpart-icon.py")], check=True)
    print("Done — all icons derived from the branded source.")


if __name__ == "__main__":
    main()
