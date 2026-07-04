"""Copy branded app catalog icon into the sharepoint/ root for .sppkg packaging.

The icon MUST sit at the sharepoint/ root (not a subfolder) and iconPath must be the bare
filename. SPFx writes AppIconPath in AppManifest.xml as the basename only, so an icon placed
in sharepoint/assets/ resolves to /<name>.png at the package root and shows a broken tile.
Keeping it at the root (matching People Hub Enterprise) makes AppIconPath resolve correctly.

Screenshots are intentionally omitted from the .sppkg. SPFx duplicates listing images into
ClientSideAssets when screenshotPaths is set, which can break the catalog tile until deploy.
Partner Center listing images live under assets/store/listing/screenshots/ instead.

SharePoint requires a 96×96 PNG at iconPath. The upload/trust dialog may show a broken tile
until you click Deploy — client-side assets (and the catalog tile URL) finalize on deploy.
"""

from __future__ import annotations

import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SHAREPOINT_ROOT = ROOT / "sharepoint"
SHAREPOINT_ASSETS = ROOT / "sharepoint" / "assets"
TEAMS = ROOT / "teams"
ICON_NAME = "app-icon.png"
LEGACY_ICON_NAME = "asset-management-icon-96.png"
STALE_ICON_NAMES = (
    "app-icon-1-0-2-10.png",
    "app-icon-1-0-2-11.png",
    "app-icon-1-0-2-12.png",
    LEGACY_ICON_NAME,
)
TEAMS_COLOR_ICON = "4fa4ca04-c98a-4723-8671-f69956f65f26_color.png"
CATALOG_SIZE = 96
# Light neutral tile background used by the brand/store artwork.
TILE_BG = (245, 247, 250)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def save_catalog_icon(img: Image.Image, dst: Path, size: int = CATALOG_SIZE) -> None:
    """SharePoint app catalog requires a 96×96 RGB PNG."""
    square = img.convert("RGBA")
    if square.size[0] != square.size[1]:
        side = min(square.size)
        left = (square.size[0] - side) // 2
        top = (square.size[1] - side) // 2
        square = square.crop((left, top, left + side, top + side))
    resized = square.resize((size, size), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", (size, size), TILE_BG)
    bg.paste(resized, mask=resized.split()[3])
    ensure_dir(dst.parent)
    bg.save(dst, "PNG", optimize=True)
    print(f"  {dst.relative_to(ROOT)} ({size}x{size} RGB)")


def copy_app_icon() -> None:
    # Icon lives at the sharepoint/ root so AppIconPath (basename) resolves correctly, AND in
    # teams/ so the SPFx Teams-tab feature sweeps it into the package ClientSideAssets. SharePoint
    # serves the catalog tile from ClientSideAssets/<solutionId>/<AppIconPath>, so the file must be
    # in ClientSideAssets or the tile 404s. (People Hub Enterprise keeps its app-icon.png in teams/
    # for exactly this reason.)
    dst = SHAREPOINT_ROOT / ICON_NAME
    teams_dst = TEAMS / ICON_NAME
    brand_dst = ASSETS / "brand" / ICON_NAME
    candidates = [
        TEAMS / TEAMS_COLOR_ICON,
        ASSETS / "brand" / ICON_NAME,
        ASSETS / "brand" / LEGACY_ICON_NAME,
        ASSETS / "store" / "sharepoint" / ICON_NAME,
        ASSETS / "store" / "sharepoint" / LEGACY_ICON_NAME,
        SHAREPOINT_ASSETS / ICON_NAME,
        SHAREPOINT_ASSETS / LEGACY_ICON_NAME,
        SHAREPOINT_ROOT / ICON_NAME,
        SHAREPOINT_ROOT / LEGACY_ICON_NAME,
    ]

    for source in candidates:
        if source.exists():
            with Image.open(source) as img:
                save_catalog_icon(img, dst)
                save_catalog_icon(img, teams_dst)
                save_catalog_icon(img, brand_dst)
            # Remove the stale subfolder copy so it isn't packaged where AppIconPath can't reach it.
            for stale_name in STALE_ICON_NAMES:
                for stale in (SHAREPOINT_ASSETS / stale_name, SHAREPOINT_ROOT / stale_name, TEAMS / stale_name):
                    if stale.exists():
                        stale.unlink()
            return

    raise SystemExit(
        "Missing app icon sources. Add one of: "
        + ", ".join(str(p.relative_to(ROOT)) for p in candidates)
    )


def main() -> None:
    print("Preparing sharepoint/assets for .sppkg (catalog icon only)...")
    copy_app_icon()
    print("Done.")


if __name__ == "__main__":
    main()
