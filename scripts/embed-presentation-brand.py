#!/usr/bin/env python3
"""Composite real brand assets onto AI-generated presentation slides.

PORTABLE / REUSABLE: this script is app-agnostic. All app-specific values (product
name, brand files, palette, fonts, geometry, folders) come from a JSON config so the
same script can be dropped into any repo. See docs/presentation/image-generation-process.md.

The slide masters (in the configured raw_dir) are AI-generated with an intentionally
empty top header band and NO brand marks. This script stamps, identically on every
slide, using the ACTUAL brand files (never AI redraws):

  * <app_icon>  -> top-left, fixed size
  * <product_name> -> semibold font, next to the icon
  * <logo>      -> top-right, fixed size (optional)

Title slides additionally get the large centered product title composited.

Raw -> final name mapping:  <raw_prefix><slug>.<ext>  ->  out_template.format(slug=slug)

Usage:
  python scripts/embed-presentation-brand.py
  python scripts/embed-presentation-brand.py --config config/presentation-brand.json
  python scripts/embed-presentation-brand.py --logo-scale 0.8      # quick logo resize
  python scripts/embed-presentation-brand.py --product-name "My App" --app-icon path.png
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

# ---------------------------------------------------------------------------
# Defaults (match Asset Management Hub). Every value is overridable via config.
# ---------------------------------------------------------------------------
DEFAULT_CONFIG: dict[str, Any] = {
    "product_name": "Asset Management Hub",
    "app_icon": "assets/brand/app-icon.png",
    "logo": "assets/brand/chronodat-logo.png",
    "raw_dir": "assets/website/presentation/_raw",
    "out_dir": "assets/website/presentation",
    "raw_glob": "pres-raw-*.png",
    "raw_prefix": "pres-raw-",
    "out_template": "presentation-slide-{slug}-ai.png",
    "title_slides": ["00-welcome"],
    "draw_hairline": True,
    "draw_product_name": True,
    # Optional [w, h]: resize the final composited image to exact dimensions
    # (e.g. [1366, 768] for Partner Center store screenshots). null = keep native size.
    "output_size": None,
    "colors": {
        "name": [15, 35, 75],
        "title": [15, 35, 75],
        "hairline": [15, 35, 75, 28],
    },
    # Font candidates are tried in order; first that exists wins. Cross-platform.
    "fonts": {
        "semibold": [
            "C:/Windows/Fonts/seguisb.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ],
        "bold": [
            "C:/Windows/Fonts/segoeuib.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ],
    },
    "geometry": {
        "header_h_ratio": 0.115,
        "pad_x_ratio": 0.028,
        "icon_h_ratio": 0.070,
        "logo_h_ratio": 0.0304,
        "name_size_ratio": 0.55,
        "icon_corner_ratio": 0.22,
        "name_gap_ratio": 0.30,
        "title_size_ratio": 0.10,
        "title_y_ratio": 0.40,
    },
}


def _deep_merge(base: dict, override: dict) -> dict:
    out = dict(base)
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def load_config(config_path: Path | None) -> tuple[dict, Path]:
    """Return (merged config, base_dir).

    Config paths are resolved relative to the repo root (the script's parent's
    parent) by default, so a config living in config/ still references
    assets/... at the repo root. A config may set "base_dir" (relative to the
    config file's own folder) to point elsewhere.
    """
    cfg = DEFAULT_CONFIG
    base_dir = REPO_ROOT
    if config_path is not None:
        data = json.loads(config_path.read_text(encoding="utf-8"))
        cfg = _deep_merge(cfg, data)
        if "base_dir" in data:
            base_dir = (config_path.parent / data["base_dir"]).resolve()
    return cfg, base_dir


def resolve(base_dir: Path, rel: str) -> Path:
    p = Path(rel)
    return p if p.is_absolute() else (base_dir / p)


def load_font(candidates: list[str] | str, size: int) -> ImageFont.FreeTypeFont:
    if isinstance(candidates, str):
        candidates = [candidates]
    for cand in candidates:
        try:
            return ImageFont.truetype(cand, size)
        except OSError:
            continue
    print(f"  WARN: no font found in {candidates}; using PIL default", file=sys.stderr)
    return ImageFont.load_default()


def round_corners(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, img.width - 1, img.height - 1], radius=radius, fill=255
    )
    out = img.copy()
    out.putalpha(mask)
    return out


def text_center_y(font: ImageFont.FreeTypeFont, box_top: int, box_h: int) -> int:
    ascent, descent = font.getmetrics()
    return box_top + (box_h - (ascent + descent)) // 2


def compose(raw_path: Path, cfg: dict, base_dir: Path, icon: Image.Image, logo: Image.Image | None) -> Path:
    g = cfg["geometry"]
    colors = cfg["colors"]
    base = Image.open(raw_path).convert("RGBA")
    W, H = base.size
    draw = ImageDraw.Draw(base)

    header_h = int(H * g["header_h_ratio"])
    pad_x = int(W * g["pad_x_ratio"])
    icon_h = int(H * g["icon_h_ratio"])
    name_size = int(icon_h * g["name_size_ratio"])

    # app icon (top-left)
    icon_r = round_corners(
        icon.resize((icon_h, icon_h), Image.Resampling.LANCZOS),
        int(icon_h * g["icon_corner_ratio"]),
    )
    base.alpha_composite(icon_r, (pad_x, (header_h - icon_h) // 2))

    # product name next to icon
    if cfg["draw_product_name"]:
        name_font = load_font(cfg["fonts"]["semibold"], name_size)
        name_x = pad_x + icon_h + int(icon_h * g["name_gap_ratio"])
        draw.text(
            (name_x, text_center_y(name_font, 0, header_h)),
            cfg["product_name"],
            font=name_font,
            fill=tuple(colors["name"]),
        )

    # logo (top-right) — optional
    if logo is not None:
        logo_h = int(H * g["logo_h_ratio"])
        logo_w = max(1, int(logo.width * (logo_h / logo.height)))
        logo_r = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        base.alpha_composite(logo_r, (W - logo_w - pad_x, (header_h - logo_h) // 2))

    # hairline under header band
    if cfg["draw_hairline"]:
        draw.line([(pad_x, header_h), (W - pad_x, header_h)], fill=tuple(colors["hairline"]), width=2)

    # title slides: large centered product title
    slug = re.sub(rf"^{re.escape(cfg['raw_prefix'])}", "", raw_path.stem)
    if slug in set(cfg["title_slides"]):
        title_font = load_font(cfg["fonts"]["bold"], int(H * g["title_size_ratio"]))
        bbox = draw.textbbox((0, 0), cfg["product_name"], font=title_font)
        tw = bbox[2] - bbox[0]
        draw.text(
            ((W - tw) // 2 - bbox[0], int(H * g["title_y_ratio"])),
            cfg["product_name"],
            font=title_font,
            fill=tuple(colors["title"]),
        )

    out_path = resolve(base_dir, cfg["out_dir"]) / cfg["out_template"].format(slug=slug)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final = base.convert("RGB")
    size = cfg.get("output_size")
    if size:
        final = final.resize((int(size[0]), int(size[1])), Image.Resampling.LANCZOS)
    final.save(out_path, "PNG", optimize=True)
    return out_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Composite brand assets onto presentation slides.")
    ap.add_argument("--config", type=Path, help="Path to a brand config JSON (see docs).")
    ap.add_argument("--raw-dir", help="Override raw_dir.")
    ap.add_argument("--out-dir", help="Override out_dir.")
    ap.add_argument("--product-name", help="Override product_name.")
    ap.add_argument("--app-icon", help="Override app_icon path.")
    ap.add_argument("--logo", help="Override logo path.")
    ap.add_argument("--no-logo", action="store_true", help="Skip the logo entirely.")
    ap.add_argument("--logo-scale", type=float, help="Multiply logo_h_ratio (e.g. 0.8).")
    args = ap.parse_args()

    # Auto-discover a repo config if none passed.
    config_path = args.config
    if config_path is None:
        default_cfg = REPO_ROOT / "config" / "presentation-brand.json"
        if default_cfg.is_file():
            config_path = default_cfg

    cfg, base_dir = load_config(config_path)

    # CLI overrides
    if args.raw_dir:
        cfg["raw_dir"] = args.raw_dir
    if args.out_dir:
        cfg["out_dir"] = args.out_dir
    if args.product_name:
        cfg["product_name"] = args.product_name
    if args.app_icon:
        cfg["app_icon"] = args.app_icon
    if args.logo:
        cfg["logo"] = args.logo
    if args.logo_scale:
        cfg["geometry"]["logo_h_ratio"] *= args.logo_scale

    icon_path = resolve(base_dir, cfg["app_icon"])
    if not icon_path.is_file():
        raise SystemExit(f"Missing app icon: {icon_path}")
    icon = Image.open(icon_path).convert("RGBA")

    logo = None
    if not args.no_logo and cfg.get("logo"):
        logo_path = resolve(base_dir, cfg["logo"])
        if logo_path.is_file():
            logo = Image.open(logo_path).convert("RGBA")
        else:
            print(f"  WARN: logo not found ({logo_path}); skipping logo", file=sys.stderr)

    raw_dir = resolve(base_dir, cfg["raw_dir"])
    raws = sorted(raw_dir.glob(cfg["raw_glob"]))
    if not raws:
        raise SystemExit(f"No raw slides matching {cfg['raw_glob']} in {raw_dir}")

    src = config_path if config_path else "built-in defaults"
    print(f"Branding {len(raws)} slide(s) for '{cfg['product_name']}' (config: {src}):")
    for raw in raws:
        out = compose(raw, cfg, base_dir, icon, logo)
        print(f"  {raw.name} -> {out.name}")
    print("Done.")


if __name__ == "__main__":
    main()
