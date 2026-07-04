#!/usr/bin/env python3
"""Inspect asset-management.sppkg contents (mirrors spEmployeeDirectory/scripts/inspect-sppkg.py)."""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPPKG = ROOT / "sharepoint" / "solution" / "asset-management.sppkg"
NS = "{http://schemas.microsoft.com/sharepoint/2012/app/manifest}"


def main() -> None:
    if not SPPKG.exists():
        raise SystemExit(f"Missing {SPPKG} — run npm run ship")

    with zipfile.ZipFile(SPPKG) as zf:
        names = zf.namelist()
        uncompressed_kb = round(sum(zf.getinfo(n).file_size for n in names) / 1024)
        manifest = zf.read("AppManifest.xml").decode("utf-8")
        root = ET.fromstring(manifest)
        title = root.find(f".//{NS}Title")
        bundles = [
            n
            for n in names
            if n.startswith("ClientSideAssets/asset-management-web-part") and n.endswith(".js")
        ]

    print(f"compressed_kb={round(SPPKG.stat().st_size / 1024)}")
    print(f"uncompressed_kb={uncompressed_kb}")
    print(f"version={root.attrib.get('Version')}")
    print(f"name={root.attrib.get('Name')}")
    print(f"title={title.text if title is not None else 'none'}")
    print(f"product_id={root.attrib.get('ProductID')}")
    print(f"has_screenshots_tag={'<Screenshots>' in manifest}")
    print(f"screenshot_files={[n for n in names if 'screenshot' in n.lower()]}")
    print(f"icon_in_assets={'assets/asset-management-icon-96.png' in names}")
    print(f"web_part_bundles={bundles}")


if __name__ == "__main__":
    main()
