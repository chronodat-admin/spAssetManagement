"""Read canonical app version from config/package-solution.json."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_SOLUTION_PATH = ROOT / "config" / "package-solution.json"
VERSION_PATTERN = re.compile(r"^\d+\.\d+\.\d+\.\d+$")


def read_app_version() -> str:
    data = json.loads(PACKAGE_SOLUTION_PATH.read_text(encoding="utf-8"))
    version = str(data.get("solution", {}).get("version", "")).strip()
    if not VERSION_PATTERN.match(version):
        raise ValueError(f"Invalid solution.version in {PACKAGE_SOLUTION_PATH}: {version or '(empty)'}")
    return version
