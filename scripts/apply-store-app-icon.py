#!/usr/bin/env python3
"""Apply the current app icon to AI store images without changing other content."""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ICON = ROOT / "sharepoint" / "assets" / "asset-management-icon-96.png"
MARKETING = ROOT / "assets" / "website" / "marketing"
PREVIEW_SIZE = (1024, 683)


TARGETS: dict[str, list[tuple[int, int, int, int]]] = {
    "asset-management-dashboard-showcase-ai.png": [
        (20, 10, 72, 64),
        (18, 620, 66, 670),
    ],
    "asset-management-feature-grid-ai.png": [
        (22, 12, 80, 76),
        (42, 606, 94, 662),
    ],
    "asset-management-compliance-showcase-ai.png": [
        (24, 22, 64, 62),
    ],
    "asset-management-analysis-showcase-ai.png": [
        (18, 16, 78, 80),
        (20, 602, 78, 664),
    ],
    "asset-management-all-features-infographic-ai.png": [
        (14, 10, 100, 96),
    ],
    "asset-management-surfaces-showcase-ai.png": [
        (24, 24, 76, 76),
    ],
}


def crop_to_blue_mark(source: Image.Image) -> Image.Image:
    """Crop a large reference image down to the blue app mark before masking."""
    img = source.convert("RGBA")
    if img.width <= 200 and img.height <= 200:
        return img

    pixels = img.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if a > 0 and b > 120 and b > r + 35 and b > g + 10:
                xs.append(x)
                ys.append(y)

    if not xs:
        return img

    pad = 24
    return img.crop(
        (
            max(0, min(xs) - pad),
            max(0, min(ys) - pad),
            min(img.width, max(xs) + pad),
            min(img.height, max(ys) + pad),
        )
    )


def remove_edge_background(source: Image.Image) -> Image.Image:
    """Make the flat tile background transparent while preserving the white check."""
    img = source.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    bg = pixels[0, 0][:3]
    threshold = 30

    def is_background(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        return sum(abs(c - bc) for c, bc in zip((r, g, b), bg)) <= threshold

    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not (0 <= x < width and 0 <= y < height):
            continue
        if not is_background(x, y):
            continue
        visited.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    for x, y in visited:
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def fit_icon(icon: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    max_w = box[2] - box[0]
    max_h = box[3] - box[1]
    scale = min(max_w / icon.width, max_h / icon.height)
    size = (max(1, round(icon.width * scale)), max(1, round(icon.height * scale)))
    return icon.resize(size, Image.Resampling.LANCZOS)


def paste_centered(canvas: Image.Image, icon: Image.Image, box: tuple[int, int, int, int]) -> None:
    fitted = fit_icon(icon, box)
    x = box[0] + (box[2] - box[0] - fitted.width) // 2
    y = box[1] + (box[3] - box[1] - fitted.height) // 2
    canvas.paste(fitted, (x, y), fitted)


def clear_box(canvas: Image.Image, box: tuple[int, int, int, int], fill: tuple[int, int, int] = (255, 255, 255)) -> None:
    clear = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (*fill, 255))
    canvas.paste(clear, (box[0], box[1]))


def scale_box(box: tuple[int, int, int, int], size: tuple[int, int]) -> tuple[int, int, int, int]:
    sx = size[0] / PREVIEW_SIZE[0]
    sy = size[1] / PREVIEW_SIZE[1]
    return (
        round(box[0] * sx),
        round(box[1] * sy),
        round(box[2] * sx),
        round(box[3] * sy),
    )


def main() -> None:
    icon_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_ICON
    if not icon_path.exists():
        raise SystemExit(f"Missing icon: {icon_path}")

    icon = remove_edge_background(crop_to_blue_mark(Image.open(icon_path)))
    print(f"Applying app icon from {icon_path}")

    for name, boxes in TARGETS.items():
        path = MARKETING / name
        if not path.exists():
            raise SystemExit(f"Missing marketing image: {path}")
        img = Image.open(path).convert("RGBA")
        for box in boxes:
            scaled_box = scale_box(box, img.size)
            clear_box(img, scaled_box)
            paste_centered(img, icon, scaled_box)
        img.convert("RGB").save(path, "PNG", optimize=True, compress_level=9)
        print(f"  updated {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
