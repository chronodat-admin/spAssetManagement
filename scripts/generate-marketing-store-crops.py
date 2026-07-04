#!/usr/bin/env python3
"""Produce store-ready 1366x768 frames from 3:2 marketing sheets (AI or programmatic).

Scale each sheet to fit 768px height and extend edge pixels to fill 1366px width.
Output stays under the 1024 KB Microsoft Partner Center cap.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "website" / "marketing"
OUT = ROOT / "assets" / "store" / "listing" / "screenshots" / "marketing"

TARGET_W, TARGET_H = 1366, 768
STORE_SIZE_LIMIT_KB = 1024

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

    if missing:
        print("\nMissing AI sheets (see assets/website/marketing/PROMPTS.md or run npm run assets:marketing):")
        for name in sorted(set(missing)):
            print(f"  - {name}")

    print(f"\nDone. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
