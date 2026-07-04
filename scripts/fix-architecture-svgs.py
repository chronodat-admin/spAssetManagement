#!/usr/bin/env python3
"""Fix bullet characters in architecture SVG files."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "assets" / "website"

for path in ROOT.glob("architecture-*.svg"):
    text = path.read_text(encoding="utf-8")
    text = text.replace('">" ', '">- ')
    text = text.replace(", &)", ", ...)")
    text = re.sub(r"  -  ", " - ", text)
    path.write_text(text, encoding="utf-8", newline="\n")
    print(f"fixed {path.name}")
