#!/usr/bin/env python3
"""Build People Hub-style marketing hero images from Asset Management app screenshots.

Layout, canvas size (1536x1024), typography, and window placement mirror
C:\\spEmployeeDirectory\\assets\\website\\hero-banner.png.
"""

from __future__ import annotations

import textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PEOPLE_HUB_BRAND = Path(r"C:\spEmployeeDirectory\assets\brand")
SCREENSHOTS = ROOT / "docs" / "user-guide" / "images"
ICON = ROOT / "sharepoint" / "assets" / "asset-management-icon-96.png"
CHRONODAT_MARK = PEOPLE_HUB_BRAND / "chronodat-footer-mark.png"
OUT_MARKETING = ROOT / "sharepoint" / "assets" / "marketing"
OUT_WEBSITE = ROOT / "assets" / "website"

# Measured from user-guide screenshots — removes trial/subscribe MessageBar band.
CROP_OVERRIDES: dict[str, int] = {
    "01-dashboard.png": 268,
    "02-all-risks.png": 228,
    "03-risk-rating.png": 228,
    "08-report-builder.png": 228,
}

# Match People Hub hero-banner.png exactly
CANVAS_W = 1536
CANVAS_H = 1024
SUPERSAMPLE = 2

FONT_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SEMI = "C:/Windows/Fonts/seguisb.ttf"

# Sampled from People Hub hero-banner.png
TITLE_COLOR = (0, 3, 47)
SUBTITLE_COLOR = (100, 116, 139)
FEATURE_HEADING = (0, 120, 212)  # Microsoft blue
FEATURE_BODY = (100, 116, 139)
ICON_BLUE = (0, 120, 212)
WHITE = (255, 255, 255)

LEFT_X = 80
LEFT_PANEL_W = 480
ICON_SIZE = 56
TITLE_X = 152

# Window boxes measured from People Hub hero-banner.png (1536x1024)
BACK_WINDOW = (510, 72, 1500, 632)
FRONT_WINDOW = (840, 418, 1520, 982)


def s(value: int) -> int:
    return value * SUPERSAMPLE


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, s(size))


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def detect_trial_banner_bottom(img: Image.Image) -> int:
    """Return y-coordinate to start crop (below trial/subscribe banner if present)."""
    arr = np.array(img.convert("RGB"))
    height = arr.shape[0]

    def is_banner_row(y: int) -> bool:
        row = arr[y].astype(np.int16)
        light = (row[:, 0] > 225) & (row[:, 1] > 225) & (row[:, 2] > 225)
        flat = (np.abs(row[:, 0] - row[:, 1]) < 16) & (np.abs(row[:, 1] - row[:, 2]) < 16)
        return bool(np.mean(light & flat) > 0.65)

    start: int | None = None
    end: int | None = None
    for y in range(80, min(350, height - 80)):
        if is_banner_row(y):
            if start is None:
                start = y
            end = y
        elif start is not None and end is not None and y - end > 12:
            break

    if end is not None:
        return min(end + 84, height - 120)
    return 155


def prepare_screenshot(path: Path, *, crop_top: int | None = None, crop_box: tuple[int, int, int, int] | None = None) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    if crop_box:
        img = img.crop(crop_box)
    else:
        if crop_top is None:
            crop_top = CROP_OVERRIDES.get(path.name, detect_trial_banner_bottom(img))
        w, h = img.size
        top = min(max(crop_top, 0), h - 200)
        img = img.crop((0, top, w, h))
    return img


def fit_cover(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Scale to fill the frame; anchor top-center (matches People Hub screenshots)."""
    scale = max(target_w / img.width, target_h / img.height)
    new_w = max(1, int(img.width * scale))
    new_h = max(1, int(img.height * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = max(0, (new_w - target_w) // 2)
    top = 0
    return resized.crop((left, top, left + target_w, top + target_h))


def add_drop_shadow(
    base: Image.Image,
    overlay: Image.Image,
    xy: tuple[int, int],
    *,
    radius: int = 12,
) -> None:
    shadow = Image.new("RGBA", overlay.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (0, 0, overlay.size[0] - 1, overlay.size[1] - 1),
        radius=radius,
        fill=(15, 23, 42, 55),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(s(14)))
    base.alpha_composite(shadow, (xy[0] + s(5), xy[1] + s(8)))
    base.alpha_composite(overlay, xy)


def place_screenshot(
    canvas: Image.Image,
    path: Path,
    box: tuple[int, int, int, int],
    *,
    radius: int = 12,
    crop_top: int | None = None,
    crop_box: tuple[int, int, int, int] | None = None,
) -> None:
    img = prepare_screenshot(path, crop_top=crop_top, crop_box=crop_box)
    x0, y0, x1, y1 = (s(v) for v in box)
    target_w = x1 - x0
    target_h = y1 - y0

    fitted = fit_cover(img, target_w, target_h)
    frame = Image.new("RGBA", (target_w, target_h), (255, 255, 255, 255))
    frame.paste(fitted, (0, 0), fitted if fitted.mode == "RGBA" else None)

    chrome = ImageDraw.Draw(frame)
    chrome.rounded_rectangle(
        (0, 0, target_w - 1, target_h - 1),
        radius=s(radius),
        outline=(226, 232, 240, 255),
        width=s(1),
    )

    mask = rounded_mask((target_w, target_h), s(radius))
    framed = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    framed.paste(frame, (0, 0), mask)
    add_drop_shadow(canvas, framed, (x0, y0), radius=radius)


def draw_background() -> Image.Image:
    """Background blobs aligned with People Hub hero-banner.png."""
    canvas = Image.new("RGBA", (s(CANVAS_W), s(CANVAS_H)), WHITE + (255,))

    blobs = [
        ((s(1380), s(-80)), s(460), (224, 242, 254, 200)),
        ((s(1480), s(920)), s(380), (191, 219, 254, 160)),
        ((s(620), s(980)), s(320), (219, 234, 254, 120)),
        ((s(-40), s(380)), s(240), (186, 230, 253, 90)),
    ]
    for center, radius, color in blobs:
        blob = Image.new("RGBA", (s(CANVAS_W), s(CANVAS_H)), (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(blob)
        bdraw.ellipse(
            (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius),
            fill=color,
        )
        blob = blob.filter(ImageFilter.GaussianBlur(s(36)))
        canvas = Image.alpha_composite(canvas, blob)

    return canvas


def wrap_text(text: str, width: int) -> list[str]:
    return textwrap.wrap(text, width=width) or [text]


def draw_wrapped_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    *,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    width_chars: int,
    line_gap: int = 6,
) -> int:
    x, y = xy
    lines = wrap_text(text, width_chars)
    line_height = font.size + s(line_gap)
    for line in lines:
        draw.text((x, y), line, fill=fill, font=font)
        y += line_height
    return y


def draw_feature_icon(draw: ImageDraw.ImageDraw, cx: int, cy: int, kind: str) -> None:
    r = s(22)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ICON_BLUE + (255,))

    if kind == "dashboard":
        draw.rectangle((cx - s(10), cy - s(8), cx - s(2), cy + s(2)), fill=WHITE)
        draw.rectangle((cx + s(2), cy - s(8), cx + s(10), cy + s(2)), fill=WHITE)
        draw.rectangle((cx - s(10), cy + s(6), cx + s(10), cy + s(10)), fill=WHITE)
    elif kind == "matrix":
        colors = [(255, 255, 255), (255, 230, 200), (255, 200, 180)]
        for i, col in enumerate(colors):
            draw.rectangle(
                (cx - s(10) + i * s(7), cy - s(8), cx - s(4) + i * s(7), cy + s(8)),
                fill=col,
            )
    elif kind == "compliance":
        draw.polygon(
            [
                (cx, cy - s(10)),
                (cx + s(10), cy - s(4)),
                (cx + s(10), cy + s(6)),
                (cx, cy + s(12)),
                (cx - s(10), cy + s(6)),
                (cx - s(10), cy - s(4)),
            ],
            fill=WHITE,
        )
        draw.line([(cx - s(4), cy + s(1)), (cx - s(1), cy + s(4)), (cx + s(6), cy - s(4))], fill=ICON_BLUE, width=s(2))
    elif kind == "report":
        draw.rounded_rectangle(
            (cx - s(8), cy - s(10), cx + s(8), cy + s(10)),
            radius=s(2),
            outline=WHITE,
            width=s(2),
        )
        draw.line([(cx - s(4), cy - s(2)), (cx + s(4), cy - s(2))], fill=WHITE, width=s(2))
        draw.line([(cx - s(4), cy + s(4)), (cx + s(4), cy + s(4))], fill=WHITE, width=s(2))
    elif kind == "register":
        draw.rounded_rectangle(
            (cx - s(9), cy - s(8), cx + s(9), cy + s(10)),
            radius=s(2),
            outline=WHITE,
            width=s(2),
        )
        for offset in (-3, 2):
            draw.line(
                [(cx - s(5), cy + s(offset)), (cx + s(5), cy + s(offset))],
                fill=WHITE,
                width=s(2),
            )
    elif kind == "m365":
        half = s(8)
        draw.rectangle((cx - half, cy - half, cx + half, cy + half), fill=WHITE)
        draw.rectangle((cx - half, cy - half, cx, cy), fill=(242, 80, 34))
        draw.rectangle((cx, cy - half, cx + half, cy), fill=(127, 186, 0))
        draw.rectangle((cx - half, cy, cx, cy + half), fill=(0, 164, 239))
        draw.rectangle((cx, cy, cx + half, cy + half), fill=(255, 185, 0))


def draw_left_panel(
    canvas: Image.Image,
    *,
    title: str,
    subtitle: str,
    features: list[tuple[str, str, str]],
) -> None:
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(FONT_BOLD, 46)
    title_line2_font = load_font(FONT_BOLD, 46)
    subtitle_font = load_font(FONT_REG, 24)
    feat_title_font = load_font(FONT_SEMI, 24)
    feat_body_font = load_font(FONT_REG, 18)

    if ICON.is_file():
        icon = Image.open(ICON).convert("RGBA").resize((s(ICON_SIZE), s(ICON_SIZE)), Image.Resampling.LANCZOS)
        canvas.alpha_composite(icon, (s(LEFT_X), s(92)))

    draw.text((s(TITLE_X), s(94)), "Asset", fill=TITLE_COLOR, font=title_font)
    draw.text((s(TITLE_X), s(148)), "Management", fill=TITLE_COLOR, font=title_line2_font)
    draw_wrapped_text(
        draw,
        (s(LEFT_X), s(206)),
        subtitle,
        font=subtitle_font,
        fill=SUBTITLE_COLOR,
        width_chars=34,
        line_gap=4,
    )

    y = s(318)
    icon_x = s(LEFT_X + 18)
    text_x = s(LEFT_X + 64)
    for icon_kind, feat_title, feat_body in features:
        draw_feature_icon(draw, icon_x, y + s(22), icon_kind)
        draw.text((text_x, y), feat_title, fill=FEATURE_HEADING, font=feat_title_font)
        draw_wrapped_text(
            draw,
            (text_x, y + s(34)),
            feat_body,
            font=feat_body_font,
            fill=FEATURE_BODY,
            width_chars=38,
            line_gap=3,
        )
        y += s(108)

    if CHRONODAT_MARK.is_file():
        mark = Image.open(CHRONODAT_MARK).convert("RGBA")
        mark_h = s(28)
        mark_w = int(mark.width * (mark_h / mark.height))
        mark = mark.resize((mark_w, mark_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(mark, (s(LEFT_X), s(CANVAS_H - 72)))


def finalize(canvas: Image.Image) -> Image.Image:
    if SUPERSAMPLE == 1:
        return canvas.convert("RGB")
    down = canvas.resize((CANVAS_W, CANVAS_H), Image.Resampling.LANCZOS)
    return down.convert("RGB")


def build_hero_dashboard() -> Image.Image:
    canvas = draw_background()
    draw_left_panel(
        canvas,
        title="Asset Management",
        subtitle="Risk Register & Compliance for Microsoft 365",
        features=[
            ("dashboard", "See the big picture.", "Dashboards, heat maps, and financial exposure at a glance."),
            ("matrix", "Assess and prioritize.", "Inherent and residual risk matrices for your full register."),
            ("m365", "Built for Microsoft 365.", "SharePoint-native lists, Teams tabs, and Graph notifications."),
        ],
    )
    place_screenshot(canvas, SCREENSHOTS / "01-dashboard.png", BACK_WINDOW)
    place_screenshot(canvas, SCREENSHOTS / "03-risk-rating.png", FRONT_WINDOW)
    return finalize(canvas)


def build_hero_register() -> Image.Image:
    canvas = draw_background()
    draw_left_panel(
        canvas,
        title="Asset Management",
        subtitle="Enterprise Risk Register for SharePoint Online",
        features=[
            ("register", "Track every risk.", "Search, filter, and manage risks across business units and projects."),
            ("dashboard", "Workflow built in.", "Status, priority, assignments, and due-date tracking out of the box."),
            ("compliance", "Compliance ready.", "Framework assessments and audit-ready reporting."),
        ],
    )
    place_screenshot(canvas, SCREENSHOTS / "02-all-risks.png", BACK_WINDOW)
    # Crop to the right-hand form panel only (avoids double-stacked dashboards).
    place_screenshot(
        canvas,
        SCREENSHOTS / "12-create-risk-form.png",
        FRONT_WINDOW,
        crop_box=(640, 0, 1280, 672),
    )
    return finalize(canvas)


def build_hero_analysis() -> Image.Image:
    canvas = draw_background()
    draw_left_panel(
        canvas,
        title="Asset Management",
        subtitle="Analysis, Reporting & GRC for Microsoft 365",
        features=[
            ("matrix", "Rate with confidence.", "5×5 inherent and residual matrices with drill-down."),
            ("report", "Build custom reports.", "Pick columns, export CSV, and share insights."),
            ("m365", "Native to SharePoint.", "Data stays in your tenant — no external database required."),
        ],
    )
    place_screenshot(canvas, SCREENSHOTS / "03-risk-rating.png", BACK_WINDOW)
    place_screenshot(canvas, SCREENSHOTS / "08-report-builder.png", FRONT_WINDOW)
    return finalize(canvas)


def main() -> None:
    outputs = {
        OUT_MARKETING / "marketing-hero-dashboard.png": build_hero_dashboard(),
        OUT_MARKETING / "marketing-hero-register.png": build_hero_register(),
        OUT_MARKETING / "marketing-hero-analysis.png": build_hero_analysis(),
        OUT_WEBSITE / "hero-banner.png": build_hero_dashboard(),
        OUT_WEBSITE / "hero-banner-register.png": build_hero_register(),
        OUT_WEBSITE / "hero-banner-analysis.png": build_hero_analysis(),
    }

    for out_path, image in outputs.items():
        out_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(out_path, "PNG", optimize=True)
        print(f"Created {out_path} ({out_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
