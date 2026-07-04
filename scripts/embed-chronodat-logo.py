#!/usr/bin/env python3
"""Embed the Chronodat logo on architecture infographic PNGs."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "assets" / "brand" / "chronodat-logo.png"
INFOGRAPHIC = ROOT / "assets" / "website" / "infographic"
RAW = INFOGRAPHIC / "_raw"
WEBSITE = ROOT / "assets" / "website"
FLAT_RAW = WEBSITE / "_flat"
DOCS_ARCH = ROOT / "docs" / "architecture"

TARGET_SIZE = (1600, 900)
BG_RGB = (248, 250, 252)

# Target logo width as fraction of canvas width (1600px baseline)
LOGO_WIDTH_RATIO = 0.12
MARGIN_X_RATIO = 0.032
MARGIN_Y_RATIO = 0.055

# Letterbox padding — keeps titles and footer logo inside the frame
SAFE_TOP_RATIO = 0.015
SAFE_BOTTOM_RATIO = 0.14
SAFE_SIDE_RATIO = 0.02


def load_logo() -> Image.Image:
    if not LOGO.exists():
        raise SystemExit(f"Logo not found: {LOGO}")
    return Image.open(LOGO).convert("RGBA")


def normalize_canvas(source: Path) -> Image.Image:
    """Letterbox AI output onto 16:9 canvas without cropping header or footer."""
    img = Image.open(source).convert("RGBA")
    target_w, target_h = TARGET_SIZE

    if img.size == TARGET_SIZE:
        return img

    safe_top = int(target_h * SAFE_TOP_RATIO)
    safe_bottom = int(target_h * SAFE_BOTTOM_RATIO)
    safe_side = int(target_w * SAFE_SIDE_RATIO)
    inner_w = target_w - safe_side * 2
    inner_h = target_h - safe_top - safe_bottom

    scale = min(inner_w / img.width, inner_h / img.height)
    new_w = max(1, int(img.width * scale))
    new_h = max(1, int(img.height * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", TARGET_SIZE, (*BG_RGB, 255))
    x = (target_w - new_w) // 2
    y = safe_top + (inner_h - new_h) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def clear_logo_zone(canvas: Image.Image) -> Image.Image:
    """Remove AI-placed branding in the bottom-right reserved strip."""
    w, h = canvas.size
    pad_x = int(w * 0.02)
    pad_y = int(h * 0.02)
    zone_w = int(w * 0.24)
    zone_h = int(h * 0.11)
    x0 = w - zone_w - pad_x
    y0 = h - zone_h - pad_y

    sample_points = [
        (x0 - 8, y0 + zone_h // 2),
        (x0 + zone_w // 2, y0 - 8),
        (pad_x + 4, pad_y + 4),
    ]
    rgb = canvas.convert("RGB")
    colors = [rgb.getpixel((max(0, min(w - 1, px)), max(0, min(h - 1, py)))) for px, py in sample_points]
    fill = tuple(sum(c[i] for c in colors) // len(colors) for i in range(3))

    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rectangle((x0, y0, w - pad_x, h - pad_y), fill=(*fill, 255))
    return Image.alpha_composite(canvas, layer)


def draw_frosted_backing(
    canvas: Image.Image,
    box: tuple[int, int, int, int],
    *,
    radius: int = 10,
) -> Image.Image:
    """Soft white-teal frosted pill behind the wordmark for diagram blending."""
    x0, y0, x1, y1 = box
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (x0 + 1, y0 + 3, x1 + 1, y1 + 3),
        radius=radius,
        fill=(15, 23, 42, 36),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=3))
    canvas = Image.alpha_composite(canvas, shadow)

    draw.rounded_rectangle(box, radius=radius, fill=(255, 255, 255, 168))
    draw.rounded_rectangle(box, radius=radius, outline=(0, 128, 128, 48), width=1)
    return Image.alpha_composite(canvas, layer)


def embed_logo(
    source: Path,
    dest: Path,
    logo: Image.Image,
    *,
    logo_width: int | None = None,
    normalize: bool = False,
) -> None:
    base = normalize_canvas(source) if normalize else Image.open(source).convert("RGBA")
    if normalize:
        base = clear_logo_zone(base)

    canvas_w, canvas_h = base.size
    target_w = logo_width or max(100, int(canvas_w * LOGO_WIDTH_RATIO))
    scale = target_w / logo.width
    target_h = max(1, int(logo.height * scale))
    mark = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)

    margin_x = int(canvas_w * MARGIN_X_RATIO)
    margin_y = int(canvas_h * MARGIN_Y_RATIO)
    x = canvas_w - target_w - margin_x
    y = canvas_h - target_h - margin_y

    pad_x, pad_y = 12, 8
    backing = (x - pad_x, y - pad_y, x + target_w + pad_x, y + target_h + pad_y)
    base = draw_frosted_backing(base, backing)
    base.alpha_composite(mark, (x, y))

    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        base.convert("RGB").save(dest, "PNG", optimize=True)
        print(f"  {dest.relative_to(ROOT)}")
    except OSError as err:
        print(f"  SKIP {dest.relative_to(ROOT)} ({err})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Embed Chronodat logo on architecture PNGs.")
    parser.add_argument(
        "--ai",
        action="store_true",
        help="Use AI-generated sources from infographic/_raw/ and publish to all output folders.",
    )
    parser.add_argument(
        "--svg",
        action="store_true",
        help="Use SVG-rendered sources from assets/website/_flat/.",
    )
    args = parser.parse_args()

    logo = load_logo()
    print(f"Using logo: {logo.size[0]}x{logo.size[1]} ({LOGO.relative_to(ROOT)})")

    RAW.mkdir(parents=True, exist_ok=True)
    INFOGRAPHIC.mkdir(parents=True, exist_ok=True)
    DOCS_ARCH.mkdir(parents=True, exist_ok=True)

    infographic_sources = sorted(RAW.glob("architecture-*.png"))
    flat_sources = sorted(FLAT_RAW.glob("architecture-*.png"))

    use_ai = args.ai or (not args.svg and bool(infographic_sources) and not flat_sources)
    use_svg = args.svg or (not args.ai and bool(flat_sources))

    if use_ai:
        if not infographic_sources:
            raise SystemExit(f"No AI infographics in {RAW}. Generate images into _raw first.")
        print("Embedding Chronodat logo (AI infographics from _raw, letterboxed):")
        for src in infographic_sources:
            embed_logo(src, INFOGRAPHIC / src.name, logo, normalize=True)
            embed_logo(src, WEBSITE / src.name, logo, normalize=True)
            embed_logo(src, DOCS_ARCH / src.name, logo, normalize=True)
        return

    if not flat_sources:
        raise SystemExit(f"No SVG renders in {FLAT_RAW}. Run npm run assets:architecture first.")

    print("Embedding Chronodat logo (SVG infographic exports):")
    for src in flat_sources:
        embed_logo(src, WEBSITE / src.name, logo)
        embed_logo(src, DOCS_ARCH / src.name, logo)
        embed_logo(src, INFOGRAPHIC / src.name, logo)


if __name__ == "__main__":
    main()
