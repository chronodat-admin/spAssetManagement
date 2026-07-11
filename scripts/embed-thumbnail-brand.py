#!/usr/bin/env python3
"""Composite the real app icon + Chronodat logo onto an AI-generated thumbnail base.

Two-step thumbnail pipeline (mirrors the presentation-slide pipeline):
  1. AI generates the thumbnail layout with the real product screenshot blended in and
     clean reserved zones for the app icon (top-left) and the company logo (bottom-right).
  2. This script stamps the pixel-accurate brand marks into those reserved zones.

Config-driven so it can be reused for any Chronodat app: point --config at a JSON file
(see config/thumbnail-brand.json) and change the file paths / placement ratios.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parent.parent


def resolve(base: Path, rel: str) -> Path:
    p = Path(rel)
    return p if p.is_absolute() else (base / p)


def rounded_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask


def fit_height(img: Image.Image, target_h: int) -> Image.Image:
    w, h = img.size
    target_w = max(1, round(w * target_h / h))
    return img.resize((target_w, target_h), Image.Resampling.LANCZOS)


def tint(img: Image.Image, rgb: list[int]) -> Image.Image:
    """Recolor an alpha logo to a solid RGB while keeping its alpha (for dark logos on dark bg)."""
    img = img.convert("RGBA")
    solid = Image.new("RGBA", img.size, (rgb[0], rgb[1], rgb[2], 0))
    solid.putalpha(img.getchannel("A"))
    return solid


def cover_boxes(base: Image.Image, cfg: dict) -> None:
    """Paint out unwanted baked-in elements (e.g. a DEMO badge) by copying a clean
    nearby region of the background over them. Each box is given in width/height ratios,
    with an offset (from_dx_ratio / from_dy_ratio) pointing at the clean source region."""
    W, H = base.size
    for c in cfg.get("cover_boxes", []):
        x0, y0, x1, y1 = c["box"]
        rx0, ry0, rx1, ry1 = round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)
        dx = round(c.get("from_dx_ratio", 0.0) * W)
        dy = round(c.get("from_dy_ratio", 0.0) * H)
        region = base.crop((rx0 + dx, ry0 + dy, rx1 + dx, ry1 + dy))
        base.paste(region, (rx0, ry0))


def paste_icon(base: Image.Image, cfg: dict, base_dir: Path) -> None:
    icon_cfg = cfg["icon"]
    W, H = base.size
    icon = Image.open(resolve(base_dir, cfg["app_icon_file"])).convert("RGBA")
    target_h = round(icon_cfg["height_ratio"] * H)
    icon = fit_height(icon, target_h)
    iw, ih = icon.size
    cx = round(icon_cfg["cx_ratio"] * W)
    cy = round(icon_cfg["cy_ratio"] * H)
    x = cx - iw // 2
    y = cy - ih // 2

    if icon_cfg.get("shadow", True):
        from PIL import ImageFilter

        shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        pad = max(2, round(iw * 0.05))
        radius = max(4, round(iw * 0.18))
        sd.rounded_rectangle(
            [x + pad, y + pad, x + iw + pad, y + ih + pad], radius=radius, fill=(0, 0, 0, 90)
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(pad))
        base.alpha_composite(shadow)

    base.alpha_composite(icon, (x, y))


def paste_logo(base: Image.Image, cfg: dict, base_dir: Path) -> None:
    logo_cfg = cfg["logo"]
    W, H = base.size
    logo = Image.open(resolve(base_dir, cfg["logo_file"])).convert("RGBA")
    if cfg.get("logo_tint"):
        logo = tint(logo, cfg["logo_tint"])
    target_h = round(logo_cfg["height_ratio"] * H)
    logo = fit_height(logo, target_h)
    lw, lh = logo.size
    cx = round(logo_cfg["cx_ratio"] * W)
    cy = round(logo_cfg["cy_ratio"] * H)
    x = cx - lw // 2
    y = cy - lh // 2

    if logo_cfg.get("scrim"):
        pad_x = round(lh * logo_cfg.get("scrim_pad_x_ratio", 0.7))
        pad_y = round(lh * logo_cfg.get("scrim_pad_y_ratio", 0.55))
        scrim = Image.new("RGBA", base.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(scrim)
        color = tuple(logo_cfg.get("scrim_color", [10, 22, 46, 160]))
        sd.rounded_rectangle(
            [x - pad_x, y - pad_y, x + lw + pad_x, y + lh + pad_y],
            radius=round(lh * 0.5),
            fill=color,
        )
        base.alpha_composite(scrim)

    base.alpha_composite(logo, (x, y))


def compose(config_path: Path) -> Path:
    cfg = json.loads(config_path.read_text(encoding="utf-8"))
    base_dir = REPO_ROOT
    base = Image.open(resolve(base_dir, cfg["raw"])).convert("RGBA")

    cover_boxes(base, cfg)
    paste_icon(base, cfg, base_dir)
    paste_logo(base, cfg, base_dir)

    out = resolve(base_dir, cfg["out"])
    out.parent.mkdir(parents=True, exist_ok=True)
    final = base.convert("RGB")
    size = cfg.get("output_size")
    if size:
        final = final.resize((int(size[0]), int(size[1])), Image.Resampling.LANCZOS)
    final.save(out, "PNG", optimize=True)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default="config/thumbnail-brand.json", help="Path to thumbnail brand config JSON")
    args = parser.parse_args()
    config_path = resolve(REPO_ROOT, args.config)
    out = compose(config_path)
    print(f"Thumbnail written: {out}")


if __name__ == "__main__":
    main()
