#!/usr/bin/env python3
"""Produce store-ready 1366x768 frames from 3:2 marketing sheets (AI or programmatic).

Scale each sheet to fit 768px height and extend edge pixels to fill 1366px width.
Output stays under the 1024 KB Microsoft Partner Center cap.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image
from PIL import ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "website" / "marketing"
OUT = ROOT / "assets" / "store" / "listing" / "screenshots" / "marketing"

TARGET_W, TARGET_H = 1366, 768
STORE_SIZE_LIMIT_KB = 1024
BG = (245, 247, 250)
CARD = (255, 255, 255)
INK = (15, 23, 42)
MUTED = (71, 85, 105)
BLUE = (37, 99, 235)
GREEN = (22, 163, 74)
AMBER = (217, 119, 6)

# Prefer AI sheets for Partner Center store images; keep programmatic sheets as fallback.
# The AI prompt requires the current package icon anywhere the app logo appears.
SHEETS = {
    "asset-management-feature-grid-ai.png": "feature-grid-1366x768.png",
    "asset-management-feature-grid.png": "feature-grid-1366x768.png",
    "asset-management-dashboard-showcase-ai.png": "dashboard-1366x768.png",
    "asset-management-dashboard-showcase.png": "dashboard-1366x768.png",
    "asset-management-compliance-showcase-ai.png": "compliance-1366x768.png",
    "asset-management-compliance-showcase.png": "compliance-1366x768.png",
    "asset-management-analysis-showcase-ai.png": "analysis-1366x768.png",
    "asset-management-analysis-showcase.png": "analysis-1366x768.png",
    "asset-management-all-features-infographic-ai.png": "all-features-1366x768.png",
    "asset-management-all-features-infographic.png": "all-features-1366x768.png",
    "asset-management-surfaces-showcase-ai.png": "surfaces-1366x768.png",
    "asset-management-surfaces-showcase.png": "surfaces-1366x768.png",
}

FALLBACK_FRAMES = {
    "dashboard-1366x768.png": (
        "Asset Management Dashboard",
        ["Portfolio KPIs", "Status and category charts", "Assignment and warranty visibility"],
    ),
    "feature-grid-1366x768.png": (
        "Complete Asset Register",
        ["Hardware and software tracking", "Assignments, bookings, and returns", "Configurable forms and lookups"],
    ),
    "compliance-1366x768.png": (
        "Governed SharePoint Lists",
        ["Provisioned list schema", "Audit log and administrator controls", "Microsoft Graph mail approval flow"],
    ),
    "analysis-1366x768.png": (
        "Operations and Reporting",
        ["Depreciation schedules", "Inventory scans", "Report builder exports"],
    ),
    "all-features-1366x768.png": (
        "Asset Management for Microsoft 365",
        ["SharePoint Framework app", "Teams and M365 manifests", "Store-ready packaging checks"],
    ),
}


def make_frame(src: Image.Image) -> Image.Image:
    scale = TARGET_H / src.height
    scaled_w = max(1, round(src.width * scale))
    scaled = src.resize((scaled_w, TARGET_H), Image.Resampling.LANCZOS)

    if scaled_w >= TARGET_W:
        left = (scaled_w - TARGET_W) // 2
        frame = scaled.crop((left, 0, left + TARGET_W, TARGET_H))
    else:
        canvas = Image.new("RGB", (TARGET_W, TARGET_H))
        pad_total = TARGET_W - scaled_w
        pad_left = pad_total // 2
        pad_right = pad_total - pad_left

        if pad_left:
            left_edge = scaled.crop((0, 0, 1, TARGET_H)).resize((pad_left, TARGET_H))
            canvas.paste(left_edge, (0, 0))
        canvas.paste(scaled, (pad_left, 0))
        if pad_right:
            right_edge = scaled.crop((scaled_w - 1, 0, scaled_w, TARGET_H)).resize((pad_right, TARGET_H))
            canvas.paste(right_edge, (pad_left + scaled_w, 0))
        frame = canvas

    if frame.size != (TARGET_W, TARGET_H):
        frame = frame.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
    return frame


def save_under_cap(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # Partner Center requires exact pixel dimensions — RGB PNG, no alpha/metadata.
    clean = img.convert("RGB")
    assert clean.size == (TARGET_W, TARGET_H), f"{path.name}: expected {TARGET_W}x{TARGET_H}, got {clean.size}"

    clean.save(path, format="PNG", optimize=True, compress_level=9)
    if path.stat().st_size / 1024 > STORE_SIZE_LIMIT_KB:
        clean.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGB").save(
            path, format="PNG", optimize=True, compress_level=9
        )

    # Re-open to confirm IHDR matches Partner Center requirement.
    with Image.open(path) as saved:
        if saved.size != (TARGET_W, TARGET_H):
            raise SystemExit(f"{path}: saved size {saved.size} != {TARGET_W}x{TARGET_H}")

    kb = path.stat().st_size / 1024
    print(f"  {path.relative_to(ROOT)} ({TARGET_W}x{TARGET_H}, {kb:.0f} KB)")


def load_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = ["arialbd.ttf" if bold else "arial.ttf", "segoeuib.ttf" if bold else "segoeui.ttf"]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_fallback_frame(title: str, bullets: list[str]) -> Image.Image:
    img = Image.new("RGB", (TARGET_W, TARGET_H), BG)
    draw = ImageDraw.Draw(img)
    title_font = load_font(52, bold=True)
    subtitle_font = load_font(26)
    body_font = load_font(30)
    small_font = load_font(20)

    draw.rounded_rectangle((72, 72, 1294, 696), radius=28, fill=CARD, outline=(203, 213, 225), width=2)
    draw.rounded_rectangle((110, 112, 198, 200), radius=22, fill=BLUE)
    draw.rectangle((149, 132, 159, 180), fill=(255, 255, 255))
    draw.rectangle((130, 151, 178, 161), fill=(255, 255, 255))
    draw.text((226, 118), "Chronodat", fill=MUTED, font=subtitle_font)
    draw.text((226, 154), title, fill=INK, font=title_font)

    chart_left, chart_top = 118, 292
    for index, height in enumerate([180, 122, 220, 154, 96]):
        x = chart_left + index * 82
        draw.rounded_rectangle((x, chart_top + 230 - height, x + 44, chart_top + 230), radius=10, fill=[BLUE, GREEN, AMBER, BLUE, GREEN][index])
    draw.line((chart_left - 8, chart_top + 230, chart_left + 430, chart_top + 230), fill=(148, 163, 184), width=2)

    panel_x = 640
    for index, bullet in enumerate(bullets):
        y = 300 + index * 86
        draw.ellipse((panel_x, y + 7, panel_x + 18, y + 25), fill=BLUE)
        draw.text((panel_x + 36, y), bullet, fill=INK, font=body_font)

    draw.rounded_rectangle((640, 580, 1164, 630), radius=16, fill=(239, 246, 255), outline=(191, 219, 254), width=1)
    draw.text((666, 594), "SharePoint Online • Microsoft Teams • AppSource readiness", fill=BLUE, font=small_font)
    return img


def main() -> None:
    print(f"Store crops ({TARGET_W}x{TARGET_H}) from marketing sheets:")
    written: set[str] = set()
    missing: list[str] = []

    for source_name, out_name in SHEETS.items():
        if out_name in written:
            continue
        source_path = SRC / source_name
        if not source_path.exists():
            if source_name.endswith("-ai.png"):
                missing.append(source_name)
            continue
        frame = make_frame(Image.open(source_path).convert("RGB"))
        save_under_cap(frame, OUT / out_name)
        written.add(out_name)

    for out_name, (title, bullets) in FALLBACK_FRAMES.items():
        if out_name not in written:
            frame = draw_fallback_frame(title, bullets)
            save_under_cap(frame, OUT / out_name)
            written.add(out_name)

    if missing:
        print("\nMissing AI sheets (see assets/website/marketing/PROMPTS.md or run npm run assets:marketing):")
        for name in sorted(set(missing)):
            print(f"  - {name}")

    print(f"\nDone. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
