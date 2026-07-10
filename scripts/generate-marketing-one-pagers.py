#!/usr/bin/env python3
"""Generate Asset Management marketing one-pagers (programmatic baseline).

Mirrors spEmployeeDirectory/assets/scripts/generate-marketing-one-pagers.py layout.
For polished AI sheets, see assets/website/marketing/PROMPTS.md and save as *-ai.png.

Run: npm run assets:marketing
Then: npm run assets:marketing:crops  (1366×768 store frames)
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "website" / "marketing"
SCREENSHOTS = ROOT / "docs" / "user-guide" / "images"
BRAND = ROOT / "assets" / "brand"
ICON = BRAND / "app-icon.png"

APP_NAME = "Asset Management Hub"
APP_SUBTITLE = "Hardware & software tracking for SharePoint and Teams"
FOOTER_PRODUCT = "Asset Management Hub for SharePoint and Teams"

FEATURE_SHEET = (2400, 1600)
SHOWCASE_SHEET = (2400, 1350)
ALL_FEATURES_SHEET = (2800, 2150)
SURFACES_SHEET = (2400, 1350)

PAGE_BG = (236, 240, 245)
TEXT = (15, 35, 75)
MUTED = (90, 105, 130)
WHITE = (255, 255, 255)
BORDER = (210, 218, 230)
BRAND_BLUE = (0, 120, 212)
BRAND_NAVY = (15, 35, 75)
ACCENT_TEAL = (0, 128, 128)
ACCENT_GREEN = (16, 124, 16)
ACCENT_PURPLE = (98, 100, 167)

FOOTER_TRUST_PILLS = [
    "Built on SharePoint Online",
    "Your data stays in your tenant",
    "One license per site collection",
    "14-day free trial",
]

PLATFORM_BADGES: list[tuple[str, tuple[int, int, int]]] = [
    ("SharePoint Online", BRAND_BLUE),
    ("Microsoft Teams", ACCENT_PURPLE),
]


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


FONT_XXL = load_font(52, bold=True)
FONT_XL = load_font(36, bold=True)
FONT_LG = load_font(26, bold=True)
FONT_MD = load_font(18)
FONT_SM = load_font(15)
FONT_XS = load_font(13)
FONT_FEATURE_TITLE = load_font(17, bold=True)
FONT_FEATURE_BODY = load_font(13)
FONT_BADGE = load_font(14, bold=True)


def save(path: Path, img: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = img.convert("RGB")
    rgb.save(path, "PNG", optimize=True, compress_level=9)
    kb = path.stat().st_size / 1024
    print(f"  {path.relative_to(ROOT)} ({rgb.size[0]}x{rgb.size[1]}, {kb:.0f} KB)")


def draw_text_width(text: str, font: ImageFont.ImageFont) -> int:
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0]


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
        if draw_text_width(trial, font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    x, y = xy
    lh = font.size + line_gap
    for line in lines:
        draw.text((x, y), line, fill=fill, font=font)
        y += lh


def draw_triangle_pattern(draw: ImageDraw.ImageDraw, size: tuple[int, int]) -> None:
    w, h = size
    step = 48
    for y in range(0, h + step, step):
        for x in range(0, w + step, step):
            if (x // step + y // step) % 2:
                draw.polygon([(x, y), (x + step, y), (x, y + step)], fill=(228, 233, 240))


def paste_app_icon(canvas: Image.Image, box: tuple[int, int, int, int]) -> None:
    if not ICON.is_file():
        return
    icon = Image.open(ICON).convert("RGBA")
    tw, th = box[2] - box[0], box[3] - box[1]
    scale = min(tw / icon.width, th / icon.height)
    nw, nh = max(1, int(icon.width * scale)), max(1, int(icon.height * scale))
    icon = icon.resize((nw, nh), Image.Resampling.LANCZOS)
    x = box[0] + (tw - nw) // 2
    y = box[1] + (th - nh) // 2
    canvas.paste(icon, (x, y), icon)


def place_chronodat_logo_header(canvas: Image.Image) -> None:
    for name in ("chronodat-logo.png", "chronodat-footer-mark.png"):
        path = BRAND / name
        if not path.is_file():
            continue
        logo = Image.open(path).convert("RGBA")
        target_h = 34
        target_w = max(1, int(logo.width * (target_h / logo.height)))
        logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
        x = canvas.width - 48 - target_w
        canvas.paste(logo, (x, 43), logo)
        return


def draw_header_bar(draw: ImageDraw.ImageDraw, w: int) -> None:
    draw.rectangle((0, 0, w, 120), fill=WHITE)
    draw.line((0, 120, w, 120), fill=BORDER, width=2)


def draw_outlined_pill(
    draw: ImageDraw.ImageDraw, x: int, y: int, label: str, color: tuple[int, int, int], height: int = 32
) -> int:
    tw = draw_text_width(label, FONT_BADGE) + 28
    draw.rounded_rectangle((x, y, x + tw, y + height), radius=height // 2, fill=WHITE, outline=color, width=2)
    draw.ellipse((x + 12, y + height // 2 - 4, x + 20, y + height // 2 + 4), fill=color)
    draw.text((x + 28, y + (height - FONT_BADGE.size) // 2 - 1), label, fill=TEXT, font=FONT_BADGE)
    return tw


def draw_footer_bar(canvas: Image.Image, w: int, h: int) -> None:
    y0 = h - 72
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, y0, w, h), fill=WHITE)
    draw.line((0, y0, w, y0), fill=BORDER, width=2)
    paste_app_icon(canvas, (48, y0 + 16, 88, y0 + 56))
    draw.text((100, y0 + 18), FOOTER_PRODUCT, fill=TEXT, font=FONT_MD)
    draw.text((100, y0 + 44), "One license per site collection  ·  no per-seat fees", fill=MUTED, font=FONT_XS)
    pill_colors = [BRAND_BLUE, ACCENT_TEAL, ACCENT_PURPLE, ACCENT_GREEN]
    gap = 12
    widths = [draw_text_width(label, FONT_BADGE) + 28 for label in FOOTER_TRUST_PILLS]
    total = sum(widths) + gap * (len(widths) - 1)
    x = w - 48 - total
    py = y0 + (72 - 32) // 2
    for label, color, pw in zip(FOOTER_TRUST_PILLS, pill_colors, widths):
        draw_outlined_pill(draw, x, py, label, color)
        x += pw + gap


def draw_platform_badges(draw: ImageDraw.ImageDraw, w: int, y: int = 96) -> None:
    x = w - 48
    for label, color in reversed(PLATFORM_BADGES):
        tw = draw_text_width(label, FONT_BADGE) + 24
        x -= tw
        draw_badge(draw, x, y, label, color)
        x -= 12


def draw_badge(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, fill: tuple[int, int, int]) -> None:
    tw = draw_text_width(label, FONT_BADGE) + 24
    draw.rounded_rectangle((x, y, x + tw, y + 32), radius=6, fill=fill)
    draw.text((x + 12, y + 7), label, fill=WHITE, font=FONT_BADGE)


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
    top = 0
    crop = fitted.crop((left, top, left + tw, top + th))
    canvas.paste(crop, (x0, y0))


FEATURES: list[tuple[str, str, tuple[int, int, int]]] = [
    ("Dashboard & KPIs", "Total, assigned, available, and overdue asset counts at a glance.", BRAND_BLUE),
    ("Status charts", "Distribution by status, category, and location.", ACCENT_TEAL),
    ("Asset register", "Search, filter, and manage hardware and software assets.", BRAND_NAVY),
    ("Lifecycle views", "Assigned, available, in repair, retired, and deleted views.", ACCENT_PURPLE),
    ("Assign assets", "Assign custodians with notes and optional due dates.", BRAND_BLUE),
    ("Book & request", "Reserve assets and submit or approve equipment requests.", ACCENT_TEAL),
    ("Return assets", "Confirm return condition and restore availability.", BRAND_NAVY),
    ("Scan & inventory", "Barcode/QR lookup and physical inventory cycles.", ACCENT_GREEN),
    ("Software licenses", "Track seats, vendors, and renewal dates.", ACCENT_TEAL),
    ("Maintenance", "Log repairs, inspections, and service schedules.", BRAND_BLUE),
    ("Report builder", "Pick columns and export CSV from any list.", ACCENT_PURPLE),
    ("Depreciation", "Review depreciation schedules on asset financials.", BRAND_NAVY),
    ("Audit log", "Search create, update, and delete actions.", ACCENT_TEAL),
    ("Lookup lists", "Categories, vendors, locations, and projects.", BRAND_BLUE),
    ("Settings & forms", "Appearance, tags, roles, and field visibility.", ACCENT_PURPLE),
    ("SharePoint & Teams", "Web part, form customizer, and Teams tabs.", ACCENT_GREEN),
]

ALL_FEATURES: list[tuple[str, tuple[int, int, int], list[tuple[str, str, str, tuple[int, int, int]]]]] = [
    (
        "Dashboard",
        BRAND_BLUE,
        [
            ("KPI cards", "Total, assigned, available, and overdue counts.", BRAND_BLUE),
            ("Status charts", "Breakdown by status and category.", ACCENT_TEAL),
            ("Location charts", "See where assets are deployed.", BRAND_NAVY),
            ("Drill-down", "Click cards to open matching lists.", ACCENT_PURPLE),
        ],
    ),
    (
        "Asset register",
        ACCENT_TEAL,
        [
            ("All assets", "Search, sort, table/list/card views.", ACCENT_TEAL),
            ("Create & edit", "Tabs for general, financial, assignment, maintenance.", BRAND_BLUE),
            ("Filtered views", "Assigned to me, available, repair, retired.", BRAND_NAVY),
            ("Attachments", "Files linked to each asset record.", ACCENT_GREEN),
        ],
    ),
    (
        "Operations",
        BRAND_NAVY,
        [
            ("Assign & return", "Custodian workflows with condition notes.", BRAND_NAVY),
            ("Book & request", "Reservations and approval queues.", BRAND_BLUE),
            ("Scan asset", "Locate items by barcode or QR label.", ACCENT_TEAL),
            ("Inventory", "Record scans during inventory cycles.", ACCENT_PURPLE),
        ],
    ),
    (
        "Analysis",
        ACCENT_GREEN,
        [
            ("Report builder", "Custom columns and CSV export.", ACCENT_GREEN),
            ("Depreciation", "Schedules on asset financial tab.", BRAND_BLUE),
            ("Audit log", "Administrator action history.", ACCENT_TEAL),
            ("Software licenses", "Seat usage and renewals.", BRAND_NAVY),
        ],
    ),
    (
        "Administration",
        ACCENT_PURPLE,
        [
            ("Settings", "General, appearance, forms, tags, subscription.", ACCENT_PURPLE),
            ("Roles", "App administrators and UI permissions.", BRAND_BLUE),
            ("Lookups", "Categories, vendors, locations, projects.", ACCENT_TEAL),
            ("Workflows", "Email notifications via Graph Mail.Send.", BRAND_NAVY),
        ],
    ),
    (
        "Deploy",
        BRAND_BLUE,
        [
            ("SharePoint", "Modern full-width pages and App Catalog.", BRAND_BLUE),
            ("Microsoft Teams", "Channel tab and personal app.", ACCENT_PURPLE),
            ("Native forms", "Form customizer on Assets list.", ACCENT_TEAL),
            ("Setup wizard", "Provision SharePoint lists in one click.", ACCENT_GREEN),
        ],
    ),
]


def build_feature_grid_sheet() -> Image.Image:
    w, h = FEATURE_SHEET
    canvas = Image.new("RGB", (w, h), PAGE_BG)
    draw = ImageDraw.Draw(canvas)
    draw_triangle_pattern(draw, (w, h))
    draw_header_bar(draw, w)
    paste_app_icon(canvas, (48, 28, 108, 88))
    draw.text((120, 34), APP_NAME, fill=TEXT, font=FONT_XL)
    draw.text((120, 78), APP_SUBTITLE, fill=MUTED, font=FONT_MD)
    place_chronodat_logo_header(canvas)
    draw_platform_badges(draw, w)
    draw.text((48, 148), "Track assets, assignments, and operations in one SharePoint-native hub", fill=TEXT, font=FONT_XXL)

    grid_x, grid_y, col_w, row_h = 48, 240, 280, 200
    for idx, (title, body, color) in enumerate(FEATURES):
        col, row = idx % 4, idx // 4
        x = grid_x + col * (col_w + 16)
        y = grid_y + row * (row_h + 12)
        draw.rounded_rectangle((x, y, x + col_w, y + row_h - 8), radius=10, fill=WHITE, outline=BORDER, width=1)
        draw.ellipse((x + 20, y + 20, x + 52, y + 52), fill=color)
        draw.text((x + 68, y + 22), title, fill=TEXT, font=FONT_FEATURE_TITLE)
        draw_multiline(draw, (x + 16, y + 58), body, FONT_FEATURE_BODY, MUTED, col_w - 32)

    paste_screenshot(canvas, "01-dashboard.png", (1280, 280, 2280, 980))
    paste_screenshot(canvas, "02-all-assets.png", (1780, 420, 2280, 920))
    draw_footer_bar(canvas, w, h)
    return canvas


def build_showcase_sheet(headline: str, screenshot: str, panel_title: str, panel_lines: list[str]) -> Image.Image:
    w, h = SHOWCASE_SHEET
    canvas = Image.new("RGB", (w, h), PAGE_BG)
    draw = ImageDraw.Draw(canvas)
    draw_triangle_pattern(draw, (w, h))
    draw_header_bar(draw, w)
    paste_app_icon(canvas, (48, 28, 108, 88))
    draw.text((120, 34), APP_NAME, fill=TEXT, font=FONT_XL)
    draw.text((120, 78), APP_SUBTITLE, fill=MUTED, font=FONT_MD)
    place_chronodat_logo_header(canvas)
    draw.text((w // 2, 160), headline, fill=TEXT, font=FONT_XL, anchor="mt")

    stats = [("142", "Total"), ("89", "Assigned"), ("38", "Available"), ("6", "Overdue")]
    sx = 48
    for value, label in stats:
        draw.rounded_rectangle((sx, 240, sx + 140, 340), radius=10, fill=WHITE, outline=BORDER)
        draw.text((sx + 70, 260), value, fill=ACCENT_TEAL, font=FONT_XXL, anchor="mt")
        draw.text((sx + 70, 310), label, fill=MUTED, font=FONT_SM, anchor="mt")
        sx += 160

    paste_screenshot(canvas, screenshot, (520, 220, 1680, 900))

    px0, py0 = 1720, 240
    draw.rounded_rectangle((px0, py0, px0 + 620, py0 + 660), radius=12, fill=WHITE, outline=BORDER, width=2)
    draw.text((px0 + 24, py0 + 24), panel_title, fill=TEXT, font=FONT_LG)
    y = py0 + 72
    for line in panel_lines:
        draw.ellipse((px0 + 24, y + 6, px0 + 36, y + 18), fill=ACCENT_TEAL)
        draw.text((px0 + 48, y), line, fill=MUTED, font=FONT_MD)
        y += 36

    draw_footer_bar(canvas, w, h)
    return canvas


def build_all_features_infographic() -> Image.Image:
    w, h = ALL_FEATURES_SHEET
    canvas = Image.new("RGB", (w, h), PAGE_BG)
    draw = ImageDraw.Draw(canvas)
    draw_triangle_pattern(draw, (w, h))
    draw_header_bar(draw, w)
    paste_app_icon(canvas, (48, 28, 108, 88))
    draw.text((120, 34), APP_NAME, fill=TEXT, font=FONT_XL)
    place_chronodat_logo_header(canvas)
    draw.text((48, 148), "All Asset Management Hub features — register, operations, and admin", fill=TEXT, font=FONT_XXL)

    y = 240
    card_w, card_h, gap = 640, 250, 24
    for row_idx, (category, color, items) in enumerate(ALL_FEATURES):
        draw.text((48, y), category, fill=color, font=FONT_LG)
        y += 44
        x = 48
        for i, (title, body, dot) in enumerate(items):
            cx = x + (i % 4) * (card_w + gap)
            cy = y + (i // 4) * (card_h + gap)
            draw.rounded_rectangle((cx, cy, cx + card_w, cy + card_h - 8), radius=10, fill=WHITE, outline=BORDER)
            draw.ellipse((cx + 20, cy + 20, cx + 44, cy + 44), fill=dot)
            draw.text((cx + 56, cy + 18), title, fill=TEXT, font=FONT_FEATURE_TITLE)
            draw_multiline(draw, (cx + 20, cy + 52), body, FONT_FEATURE_BODY, MUTED, card_w - 40)
        y += card_h + gap + 48
    draw_footer_bar(canvas, w, h)
    return canvas


def build_surfaces_showcase() -> Image.Image:
    w, h = SURFACES_SHEET
    canvas = Image.new("RGB", (w, h), PAGE_BG)
    draw = ImageDraw.Draw(canvas)
    draw_triangle_pattern(draw, (w, h))
    draw_header_bar(draw, w)
    paste_app_icon(canvas, (48, 28, 108, 88))
    draw.text((120, 34), APP_NAME, fill=TEXT, font=FONT_XL)
    place_chronodat_logo_header(canvas)
    draw.text(
        (w // 2, 160),
        "One asset hub across SharePoint, Teams, and native list forms",
        fill=TEXT,
        font=FONT_XL,
        anchor="mt",
    )

    columns = [
        (ACCENT_TEAL, "SharePoint Online", "01-dashboard.png", ["Modern full-width pages", "Tenant App Catalog", "Setup wizard"]),
        (ACCENT_PURPLE, "Microsoft Teams", "01-dashboard.png", ["Channel & personal tabs", "Same navigation", "Assign assets"]),
        (BRAND_BLUE, "Native Assets list", "02-all-assets.png", ["Form customizer", "Enhanced create/edit panel", "Same data model"]),
    ]
    col_w = (w - 96 - 48) // 3
    for i, (color, title, shot, bullets) in enumerate(columns):
        x0 = 48 + i * (col_w + 24)
        draw.rounded_rectangle((x0, 240, x0 + col_w, h - 100), radius=12, fill=WHITE, outline=BORDER)
        draw.rounded_rectangle((x0, 240, x0 + col_w, 300), radius=12, fill=color)
        draw.text((x0 + 20, 258), title, fill=WHITE, font=FONT_MD)
        paste_screenshot(canvas, shot, (x0 + 20, 320, x0 + col_w - 20, 720))
        by = 740
        for bullet in bullets:
            draw.ellipse((x0 + 24, by + 6, x0 + 36, by + 18), fill=color)
            draw.text((x0 + 48, by), bullet, fill=MUTED, font=FONT_SM)
            by += 32

    draw_footer_bar(canvas, w, h)
    return canvas


def main() -> None:
    print("Asset Management Hub marketing one-pagers (programmatic):")
    outputs = {
        "asset-management-feature-grid.png": build_feature_grid_sheet(),
        "asset-management-dashboard-showcase.png": build_showcase_sheet(
            "Portfolio visibility with dashboards, KPI cards, and status charts",
            "01-dashboard.png",
            "Dashboard highlights",
            ["KPI cards for total and assigned assets", "Status and category charts", "Location distribution", "Print-ready layout"],
        ),
        "asset-management-compliance-showcase.png": build_showcase_sheet(
            "Governed SharePoint lists with audit log and administrator controls",
            "15-audit-log.png",
            "Governance & audit",
            ["Provisioned list schema", "Audit log search", "Role-based settings", "Subscription licensing"],
        ),
        "asset-management-analysis-showcase.png": build_showcase_sheet(
            "Report builder, depreciation schedules, and CSV export",
            "13-reports.png",
            "Analysis tools",
            ["Custom column picker", "Filter by list source", "CSV download", "Depreciation views"],
        ),
        "asset-management-all-features-infographic.png": build_all_features_infographic(),
        "asset-management-surfaces-showcase.png": build_surfaces_showcase(),
    }
    for name, img in outputs.items():
        save(OUT / name, img)
    ai_count = len(list(OUT.glob("*-ai.png")))
    print(f"\nDone. {len(outputs)} programmatic + {ai_count} AI sheets in {OUT.relative_to(ROOT)}")
    if ai_count == 0:
        print("Tip: add AI sheets via assets/website/marketing/PROMPTS.md")


if __name__ == "__main__":
    main()
