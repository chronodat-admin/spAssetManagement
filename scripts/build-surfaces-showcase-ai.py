#!/usr/bin/env python3
"""Build a clean 1536×1024 surfaces showcase (replaces glitchy AI composite).

Run: python scripts/build-surfaces-showcase-ai.py
Then: python scripts/generate-marketing-store-crops.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.marketing_brand_fix import (  # noqa: E402
    APP_NAME,
    APP_SUBTITLE,
    FOOTER_PRODUCT,
    FOOTER_TAGLINE,
    FOOTER_TRUST_PILLS,
    TEXT,
    MUTED,
    WHITE,
    BORDER,
    BRAND_BLUE,
    ACCENT_TEAL,
    ACCENT_PURPLE,
    ACCENT_GREEN,
    paste_app_icon,
    paste_screenshot,
    place_chronodat_logo,
    load_font,
    text_width,
)

OUT = ROOT / "assets" / "website" / "marketing" / "asset-management-surfaces-showcase-ai.png"
W, H = 1536, 1024
HEADLINE_BLUE = (0, 120, 212)
BG_TOP = (245, 248, 252)
BG_BOTTOM = (232, 240, 248)

FONT_H1 = load_font(40, bold=True)
FONT_H1_BLUE = load_font(40, bold=True)
FONT_COL_TITLE = load_font(17, bold=True)
FONT_COL_BODY = load_font(14)
FONT_BADGE = load_font(13, bold=True)

COLUMNS = [
    (
        BRAND_BLUE,
        "SharePoint Online",
        "Manage assets in SharePoint lists with rich views, search and reporting.",
        "02-all-assets.png",
    ),
    (
        ACCENT_PURPLE,
        "Microsoft Teams",
        "Collaborate and act on assets without leaving Teams.",
        "02-all-assets.png",
    ),
    (
        ACCENT_TEAL,
        "Native Assets list form customizer",
        "Capture the right details with custom forms and validation.",
        "05-assign-asset.png",
    ),
]


def gradient_background() -> Image.Image:
    canvas = Image.new("RGB", (W, H), BG_TOP)
    draw = ImageDraw.Draw(canvas)
    for y in range(H):
        t = y / max(H - 1, 1)
        r = int(BG_TOP[0] * (1 - t) + BG_BOTTOM[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOTTOM[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOTTOM[2] * t)
        draw.line((0, y, W, y), fill=(r, g, b))
    return canvas


def draw_headline(draw: ImageDraw.ImageDraw) -> None:
    line1 = "One asset hub across"
    line2 = "SharePoint, Teams and native list forms."
    y = 128
    draw.text((W // 2, y), line1, fill=TEXT, font=FONT_H1, anchor="mt")
    draw.text((W // 2, y + 52), line2, fill=HEADLINE_BLUE, font=FONT_H1_BLUE, anchor="mt")


def draw_column(
    canvas: Image.Image,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: tuple[int, int, int],
    title: str,
    body: str,
    screenshot: str,
) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=14, fill=WHITE, outline=BORDER, width=2)
    header_h = 88
    draw.rounded_rectangle((x0, y0, x1, y0 + header_h), radius=14, fill=color)
    draw.rectangle((x0, y0 + header_h - 14, x1, y0 + header_h), fill=color)
    draw.ellipse((x0 + 18, y0 + 30, x0 + 34, y0 + 46), fill=WHITE)
    draw.text((x0 + 44, y0 + 22), title, fill=WHITE, font=FONT_COL_TITLE)
    draw_multiline(draw, (x0 + 18, y0 + 58), body, FONT_COL_BODY, WHITE, x1 - x0 - 36, line_gap=2)

    shot_box = (x0 + 14, y0 + header_h + 10, x1 - 14, y1 - 14)
    paste_screenshot(canvas, screenshot, shot_box)
    if screenshot != "05-assign-asset.png":
        ox0, oy0, ox1, oy1 = 100, 6, 300, 30
        sx0, sy0, _, _ = shot_box
        rect = (sx0 + ox0, sy0 + oy0, sx0 + ox1, sy0 + oy1)
        draw.rectangle(rect, fill=WHITE)
        draw.text((rect[0] + 4, rect[1] + 2), APP_NAME, fill=TEXT, font=load_font(14, bold=True))


def draw_multiline(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    max_width: int,
    line_gap: int = 4,
) -> None:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if text_width(trial, font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    x, y = xy
    for line in lines:
        draw.text((x, y), line, fill=fill, font=font)
        y += font.size + line_gap


def draw_footer(canvas: Image.Image) -> None:
    y0 = H - 166
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, y0, W, H), fill=WHITE)
    draw.line((0, y0, W, y0), fill=BORDER, width=2)
    paste_app_icon(canvas, (36, y0 + 28, 76, y0 + 68))
    draw.text((88, y0 + 28), FOOTER_PRODUCT, fill=TEXT, font=load_font(18))
    draw.text((88, y0 + 54), FOOTER_TAGLINE, fill=MUTED, font=load_font(13))

    pill_colors = [BRAND_BLUE, ACCENT_TEAL, ACCENT_PURPLE, ACCENT_GREEN]
    gap = 8
    badge_font = FONT_BADGE
    for size in range(FONT_BADGE.size, 9, -1):
        badge_font = load_font(size, bold=True)
        widths = [text_width(label, badge_font) + 24 for label in FOOTER_TRUST_PILLS]
        total = sum(widths) + gap * (len(widths) - 1)
        if total <= W - 500:
            break
    py = y0 + 46
    x = W - 24 - total
    for label, color, pw in zip(FOOTER_TRUST_PILLS, pill_colors, widths):
        height = 26
        draw.rounded_rectangle((x, py, x + pw, py + height), radius=height // 2, fill=WHITE, outline=color, width=2)
        draw.ellipse((x + 10, py + height // 2 - 4, x + 18, py + height // 2 + 4), fill=color)
        draw.text((x + 24, py + (height - badge_font.size) // 2 - 1), label, fill=TEXT, font=badge_font)
        x += pw + gap


def build() -> Image.Image:
    canvas = gradient_background()
    draw = ImageDraw.Draw(canvas)

    paste_app_icon(canvas, (36, 28, 88, 80))
    draw.text((100, 34), APP_NAME, fill=TEXT, font=load_font(22, bold=True))
    draw.text((100, 62), APP_SUBTITLE, fill=MUTED, font=load_font(13))
    place_chronodat_logo(canvas)

    draw_headline(draw)

    margin_x = 48
    gap = 28
    col_w = (W - margin_x * 2 - gap * 2) // 3
    y0, y1 = 268, 842
    for i, (color, title, body, shot) in enumerate(COLUMNS):
        x0 = margin_x + i * (col_w + gap)
        x1 = x0 + col_w
        draw_column(canvas, x0, y0, x1, y1, color, title, body, shot)

    draw_footer(canvas)
    return canvas


def main() -> None:
    img = build()
    img.save(OUT, "PNG", optimize=True)
    kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT.relative_to(ROOT)} ({W}x{H}, {kb:.0f} KB)")


if __name__ == "__main__":
    main()
