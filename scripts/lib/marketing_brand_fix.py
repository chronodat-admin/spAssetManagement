"""Shared branding compositor helpers for AI marketing one-pager fixes."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SCREENSHOTS = ROOT / "docs" / "user-guide" / "images"
BRAND = ROOT / "assets" / "brand"
ICON = BRAND / "app-icon.png"
CHRONODAT_LOGO = BRAND / "chronodat-logo.png"

APP_NAME = "Asset Management Hub"
APP_SUBTITLE = "Hardware & software tracking for SharePoint and Teams"
FOOTER_PRODUCT = "Asset Management Hub for SharePoint and Teams"
FOOTER_TAGLINE = "One license per site collection  ·  no per-seat fees"
FOOTER_TRUST_PILLS = [
    "Built on SharePoint Online",
    "Your data stays in your tenant",
    "One license per site collection",
    "14-day free trial",
]
PLATFORM_BADGES: list[tuple[str, tuple[int, int, int]]] = [
    ("SharePoint Online", (0, 120, 212)),
    ("Microsoft Teams", (98, 100, 167)),
]

TEXT = (15, 35, 75)
MUTED = (90, 105, 130)
WHITE = (255, 255, 255)
BORDER = (210, 218, 230)
BRAND_BLUE = (0, 120, 212)
ACCENT_TEAL = (0, 128, 128)
ACCENT_PURPLE = (98, 100, 167)
ACCENT_GREEN = (16, 124, 16)

def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


FONT_MD = load_font(18)
FONT_XS = load_font(13)
FONT_BADGE = load_font(14, bold=True)
FONT_TITLE = load_font(15, bold=True)


def text_width(text: str, font: ImageFont.ImageFont) -> int:
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0]


def scale_box(box: tuple[int, int, int, int], w: int, h: int, ref_w: int, ref_h: int) -> tuple[int, int, int, int]:
    sx, sy = w / ref_w, h / ref_h
    return tuple(int(v * (sx if i % 2 == 0 else sy)) for i, v in enumerate(box))


def ensure_size(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Letterbox onto target canvas preserving aspect ratio."""
    tw, th = size
    if img.size == size:
        return img
    rgb = img.convert("RGB")
    scale = min(tw / rgb.width, th / rgb.height)
    nw, nh = max(1, int(rgb.width * scale)), max(1, int(rgb.height * scale))
    resized = rgb.resize((nw, nh), Image.Resampling.LANCZOS)
    bg = rgb.getpixel((nw // 2, nh // 2))
    canvas = Image.new("RGB", size, bg)
    x = (tw - nw) // 2
    y = (th - nh) // 2
    canvas.paste(resized, (x, y))
    return canvas


def clean_logo_edges(logo: Image.Image) -> Image.Image:
    """Keep ink and gold accent; drop white matte and gray anti-alias halos."""
    rgba = logo.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    arr[a < 40, 3] = 0
    visible = a >= 40
    gold = visible & (r > 140) & (g > 80) & (b < 130) & (lum < 185)
    ink = visible & (lum < 95)
    fringe = visible & ~gold & ~ink
    arr[fringe, 3] = 0
    return Image.fromarray(arr.astype(np.uint8))


def gradient_clear_zone(
    canvas: Image.Image,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    *,
    ref_x: int | None = None,
) -> None:
    """Paint a zone using per-pixel background color sampled from a reference column."""
    w, h = canvas.size
    sample_x = ref_x if ref_x is not None else max(24, int(w * 0.08))
    rgb = canvas.convert("RGB")
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    for x in range(max(0, x0), min(w, x1)):
        for y in range(max(0, y0), min(h, y1)):
            fill = rgb.getpixel((min(w - 1, max(0, sample_x)), min(h - 1, y)))
            layer.putpixel((x, y), (*fill, 255))
    out = Image.alpha_composite(canvas.convert("RGBA"), layer)
    canvas.paste(out.convert("RGB"))


def gradient_clear_header_right(canvas: Image.Image, y1: int = 110) -> None:
    w, _ = canvas.size
    gradient_clear_zone(canvas, w - int(w * 0.44), 0, w - 12, y1)


def wipe_dark_footer(canvas: Image.Image, footer_y0: int) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, footer_y0, canvas.width, canvas.height), fill=WHITE)


def redraw_header_left(canvas: Image.Image) -> None:
    """Redraw app icon and full product name in the header."""
    w = canvas.width
    gradient_clear_zone(canvas, 0, 0, int(w * 0.42), 112)
    draw = ImageDraw.Draw(canvas)
    paste_app_icon(canvas, (36, 28, 88, 80))
    draw.text((100, 34), APP_NAME, fill=TEXT, font=load_font(22, bold=True))
    draw.text((100, 62), APP_SUBTITLE, fill=MUTED, font=load_font(13))

def paste_screenshot(canvas: Image.Image, name: str, box: tuple[int, int, int, int]) -> None:
    path = SCREENSHOTS / name
    if not path.is_file():
        return
    img = Image.open(path).convert("RGB")
    x0, y0, x1, y1 = box
    tw, th = x1 - x0, y1 - y0
    scale = max(tw / img.width, th / img.height)
    nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
    fitted = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    crop = fitted.crop((left, 0, left + tw, th))
    canvas.paste(crop, (x0, y0))


def overlay_app_title(canvas: Image.Image, box: tuple[int, int, int, int], title_overlay: tuple[int, int, int, int]) -> None:
    x0, y0, _, _ = box
    ox0, oy0, ox1, oy1 = title_overlay
    rect = (x0 + ox0, y0 + oy0, x0 + ox1, y0 + oy1)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle(rect, fill=WHITE)
    draw.text((rect[0] + 4, rect[1] + 2), APP_NAME, fill=TEXT, font=FONT_TITLE)


def paste_app_icon(canvas: Image.Image, box: tuple[int, int, int, int]) -> None:
    if not ICON.is_file():
        return
    icon = Image.open(ICON).convert("RGBA")
    x0, y0, x1, y1 = box
    tw, th = x1 - x0, y1 - y0
    scale = min(tw / icon.width, th / icon.height)
    nw, nh = max(1, int(icon.width * scale)), max(1, int(icon.height * scale))
    icon = icon.resize((nw, nh), Image.Resampling.LANCZOS)
    x = x0 + (tw - nw) // 2
    y = y0 + (th - nh) // 2
    canvas.paste(icon, (x, y), icon)


def place_chronodat_logo(canvas: Image.Image) -> None:
    if not CHRONODAT_LOGO.is_file():
        return
    gradient_clear_header_right(canvas, y1=int(canvas.height * 0.12))
    logo = clean_logo_edges(Image.open(CHRONODAT_LOGO).convert("RGBA"))
    target_h = max(28, int(canvas.height * 0.042))
    target_w = max(1, int(logo.width * (target_h / logo.height)))
    logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = canvas.width - target_w - int(canvas.width * 0.022)
    y = int(canvas.height * 0.034)
    canvas.paste(logo, (x, y), logo)


def clear_header_right(canvas: Image.Image, y1: int = 110) -> None:
    gradient_clear_header_right(canvas, y1=y1)


def draw_platform_badges(canvas: Image.Image, y: int = 100) -> None:
    draw = ImageDraw.Draw(canvas)
    x = canvas.width - 36
    for label, color in reversed(PLATFORM_BADGES):
        tw = text_width(label, FONT_BADGE) + 24
        x -= tw
        draw.rounded_rectangle((x, y, x + tw, y + 32), radius=6, fill=color)
        draw.text((x + 12, y + 7), label, fill=WHITE, font=FONT_BADGE)
        x -= 12


def draw_footer_pills(draw: ImageDraw.ImageDraw, w: int, y0: int, h: int) -> None:
    pill_colors = [BRAND_BLUE, ACCENT_TEAL, ACCENT_PURPLE, ACCENT_GREEN]
    gap = 8
    max_right = w - 20
    badge_font = FONT_BADGE

    for size in range(FONT_BADGE.size, 9, -1):
        badge_font = load_font(size, bold=True)
        pill_widths = [text_width(label, badge_font) + 24 for label in FOOTER_TRUST_PILLS]
        total = sum(pill_widths) + gap * (len(pill_widths) - 1)
        if total <= max_right - 420:
            break

    py = y0 + int((h - y0 - 26) / 2)
    x = max_right - total
    for label, color, pw in zip(FOOTER_TRUST_PILLS, pill_colors, pill_widths):
        height = 26
        draw.rounded_rectangle((x, py, x + pw, py + height), radius=height // 2, fill=WHITE, outline=color, width=2)
        draw.ellipse((x + 10, py + height // 2 - 4, x + 18, py + height // 2 + 4), fill=color)
        draw.text((x + 24, py + (height - badge_font.size) // 2 - 1), label, fill=TEXT, font=badge_font)
        x += pw + gap


def redraw_footer(canvas: Image.Image, footer_y0: int) -> None:
    w, h = canvas.size
    y0 = footer_y0
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, y0, w, h), fill=WHITE)
    draw.line((0, y0, w, y0), fill=BORDER, width=2)

    icon_y0 = y0 + int((h - y0 - 40) * 0.25)
    paste_app_icon(canvas, (36, icon_y0, 76, icon_y0 + 40))
    draw.text((88, y0 + 20), FOOTER_PRODUCT, fill=TEXT, font=FONT_MD)
    draw.text((88, y0 + 46), FOOTER_TAGLINE, fill=MUTED, font=FONT_XS)
    draw_footer_pills(draw, w, y0, h)


def fix_header_branding(canvas: Image.Image) -> None:
    w, _ = canvas.size
    # Remove all AI header branding artifacts (CHRC, duplicate logos, white boxes)
    gradient_clear_zone(canvas, int(w * 0.30), 0, w - 12, 115)
    redraw_header_left(canvas)
    place_chronodat_logo(canvas)
