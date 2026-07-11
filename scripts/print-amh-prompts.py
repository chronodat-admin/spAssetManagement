#!/usr/bin/env python3
"""Print structured Asset Management Hub AI image prompts for copy-paste into Cursor image generation.

Usage:
  python scripts/print-amh-prompts.py              # all marketing prompts
  python scripts/print-amh-prompts.py --infographic
  python scripts/print-amh-prompts.py --presentation
  python scripts/print-amh-prompts.py --sheet hook
  python scripts/print-amh-prompts.py --list
  python scripts/print-amh-prompts.py --export-md   # refresh PROMPTS.md files
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from amh_ai_prompts import (
    INFOGRAPHIC_NEGATIVE,
    INFOGRAPHIC_PROMPTS,
    MARKETING_PROMPTS,
    PRESENTATION_NEGATIVE,
    PRESENTATION_PROMPTS,
    PRESENTATION_SUFFIX,
    SHARED_NEGATIVE,
    ImagePrompt,
)

ROOT = Path(__file__).resolve().parents[1]


def print_prompt(p: ImagePrompt, *, show_negative: bool = True) -> None:
    print("=" * 72)
    print(f"§{p.section}  {p.output_file}")
    print(f"Canvas: {p.canvas}  Aspect: {p.aspect_ratio}")
    print("Attach:")
    for ref in p.references:
        print(f"  - {ref}")
    print("-" * 72)
    print(p.full_prompt())
    if show_negative:
        neg = p.negative_prompt() if p in MARKETING_PROMPTS else INFOGRAPHIC_NEGATIVE
        print("-" * 72)
        print("NEGATIVE:")
        print(neg)
    print()


def export_marketing_md() -> str:
    from amh_ai_prompts import SHARED_BRAND_RULES

    lines = [
        "# Asset Management Hub — Marketing one-pager AI prompts (structured)",
        "",
        "Generated from `scripts/amh_ai_prompts.py`. Regenerate: `python scripts/print-amh-prompts.py --export-md`",
        "",
        "Use **Cursor image generation** (16:9). Attach reference screenshots listed per prompt.",
        "",
        "## Critical rule — Chronodat logo",
        "",
        "**Do NOT generate** Chronodat / CHRONODAT / CHRC text or any logo box in the image. "
        "Leave the header top-right ~42% × 12% as clean background. "
        "The official wordmark is composited afterward:",
        "",
        "```bash",
        "python scripts/fix-surfaces-showcase-ai.py          # surfaces sheet only",
        "python scripts/embed-marketing-chronodat-logo.py    # stamp logo on masters",
        "python scripts/generate-marketing-store-crops.py    # crops inherit the logo",
        "```",
        "",
        "## Partner Center output",
        "",
        "| Rule | Value |",
        "|------|-------|",
        "| Store size | **1366×768** PNG, **≤ 1024 KB** |",
        "| Upload path | `assets/store/listing/screenshots/marketing/` |",
        "| AI masters | `assets/website/marketing/*-ai.png` (1536×1024) |",
        "",
        "## Shared brand rules",
        "",
        "```",
        SHARED_BRAND_RULES,
        "```",
        "",
        "### Shared negative prompt",
        "",
        "```",
        SHARED_NEGATIVE,
        "```",
        "",
    ]
    for p in MARKETING_PROMPTS:
        lines += [
            "---",
            "",
            f"## §{p.section} — `{p.output_file}`",
            "",
            f"**Headline:** {p.headline}",
            "",
            "**Attach:**",
            "",
        ]
        for ref in p.references:
            lines.append(f"- `{ref}`")
        lines += ["", "**Prompt:**", "", "```", p.full_prompt(), "```", ""]
        if p.notes:
            lines += [f"**Notes:** {p.notes}", ""]
    lines += [
        "## Regeneration commands",
        "",
        "```bash",
        "python scripts/print-amh-prompts.py --sheet surfaces   # copy one prompt",
        "python scripts/embed-marketing-chronodat-logo.py       # stamp logo on masters",
        "python scripts/generate-marketing-store-crops.py       # crops inherit the logo",
        "npm run verify:store",
        "```",
        "",
    ]
    return "\n".join(lines)


def export_infographic_md() -> str:
    from amh_ai_prompts import INFOGRAPHIC_SUFFIX, SHARED_BRAND_RULES

    lines = [
        "# Asset Management Hub — Architecture infographic AI prompts (structured)",
        "",
        "Generated from `scripts/amh_ai_prompts.py`. Save raw outputs to `assets/website/infographic/_raw/`.",
        "",
        "```bash",
        "npm run assets:infographic   # letterbox + embed Chronodat logo",
        "```",
        "",
        "## Shared suffix (append to every prompt)",
        "",
        "```",
        INFOGRAPHIC_SUFFIX,
        "```",
        "",
        "### Negative prompt",
        "",
        "```",
        INFOGRAPHIC_NEGATIVE,
        "```",
        "",
    ]
    for p in INFOGRAPHIC_PROMPTS:
        lines += [
            f"## §{p.section} — `{p.output_file}`",
            "",
            f"**Headline:** {p.headline}",
            "",
            "**Prompt:**",
            "",
            "```",
            p.full_prompt(),
            "```",
            "",
        ]
    return "\n".join(lines)


def export_presentation_md() -> str:
    lines = [
        "# Asset Management Hub — 90-second video presentation (AI slide prompts)",
        "",
        "Generated from `scripts/amh_ai_prompts.py`. Regenerate:",
        "`python scripts/print-amh-prompts.py --export-md`",
        "",
        "Companion script: `docs/presentation/90-second-video-script.md`",
        "",
        "Use **Cursor image generation** (16:9, 1920×1080). Attach the real "
        "`docs/user-guide/images/*.png` screenshots per slide so the app UI is authentic.",
        "Save masters to `assets/website/presentation/_raw/pres-raw-*.png`.",
        "",
        "Two-step pipeline (see `docs/presentation/image-generation-process.md`): the AI "
        "leaves the top band empty and draws no brand marks; the real app icon, "
        "\"Asset Management Hub\" header, and Chronodat logo are composited afterward.",
        "",
        "After generation:",
        "",
        "```bash",
        "npm run assets:presentation-brand   # composite real icon + header + Chronodat logo",
        "```",
        "",
        "## Shared presentation style",
        "",
        "```",
        PRESENTATION_SUFFIX,
        "```",
        "",
        "### Negative prompt",
        "",
        "```",
        PRESENTATION_NEGATIVE,
        "```",
        "",
        "## Slide timing map",
        "",
        "| Slide | File | Time | Narration beat |",
        "|-------|------|------|----------------|",
        "| V1 | `presentation-slide-01-hook-ai.png` | 0:00–0:15 | Problem + product intro |",
        "| V2–V3 | `02-intro`, `03-dashboard` | 0:15–0:30 | Dashboard & register |",
        "| V4 | `presentation-slide-04-operations-ai.png` | 0:30–0:45 | Assign, return, book, scan |",
        "| V5 | `presentation-slide-05-governance-ai.png` | 0:45–1:00 | Reports, audit, governance |",
        "| V6 | `presentation-slide-06-cta-ai.png` | 1:00–1:30 | Deploy + trial CTA |",
        "",
    ]
    for p in PRESENTATION_PROMPTS:
        lines += [
            "---",
            "",
            f"## §{p.section} — `{p.output_file}`",
            "",
            f"**Headline:** {p.headline}",
            "",
            "**Attach:**",
            "",
        ]
        for ref in p.references:
            lines.append(f"- `{ref}`")
        lines += ["", "**Prompt:**", "", "```", p.full_prompt(), "```", ""]
        if p.notes:
            lines += [f"**Notes:** {p.notes}", ""]
    lines += [
        "## Regeneration commands",
        "",
        "```bash",
        "python scripts/print-amh-prompts.py --presentation",
        "python scripts/print-amh-prompts.py --sheet hook",
        "npm run assets:presentation-brand",
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Print AMH structured AI prompts")
    parser.add_argument("--infographic", action="store_true", help="Print architecture infographic prompts")
    parser.add_argument("--presentation", action="store_true", help="Print 90-second video slide prompts")
    parser.add_argument("--list", action="store_true", help="List output filenames only")
    parser.add_argument("--export-md", action="store_true", help="Write PROMPTS.md files from structured data")
    parser.add_argument(
        "--sheet",
        help="Print one sheet by keyword (dashboard, feature, compliance, analysis, all-features, surfaces, overview, data-flow, components, surfaces-arch, modules, hook, intro, operations, governance, cta)",
    )
    args = parser.parse_args()

    if args.export_md:
        (ROOT / "assets/website/marketing/PROMPTS.md").write_text(
            export_marketing_md(), encoding="utf-8"
        )
        (ROOT / "assets/website/infographic/PROMPTS.md").write_text(
            export_infographic_md(), encoding="utf-8"
        )
        (ROOT / "assets/website/presentation").mkdir(parents=True, exist_ok=True)
        (ROOT / "assets/website/presentation/PROMPTS.md").write_text(
            export_presentation_md(), encoding="utf-8"
        )
        print("Wrote assets/website/marketing/PROMPTS.md")
        print("Wrote assets/website/infographic/PROMPTS.md")
        print("Wrote assets/website/presentation/PROMPTS.md")
        return 0

    if args.infographic:
        prompts = list(INFOGRAPHIC_PROMPTS)
    elif args.presentation:
        prompts = list(PRESENTATION_PROMPTS)
    else:
        prompts = list(MARKETING_PROMPTS)

    if args.list:
        for p in prompts:
            print(p.output_file)
        return 0

    if args.sheet:
        key = args.sheet.lower().replace("_", "-")
        aliases = {
            "grid": "feature-grid",
            "feature": "feature-grid",
            "governance": "compliance",
            "report": "analysis",
            "reports": "analysis",
            "all": "all-features",
            "deploy": "surfaces",
            "overview-arch": "overview",
            "data": "data-flow",
            "workflow": "components",
            "surfaces-arch": "architecture-surfaces",
            "hook": "slide-01-hook",
            "intro": "slide-02-intro",
            "ops": "slide-04-operations",
            "operations": "slide-04-operations",
            "governance": "slide-05-governance",
            "cta": "slide-06-cta",
        }
        key = aliases.get(key, key)
        matched = [
            p
            for p in (*MARKETING_PROMPTS, *INFOGRAPHIC_PROMPTS, *PRESENTATION_PROMPTS)
            if key in p.output_file
        ]
        if not matched:
            print(f"No prompt matching '{args.sheet}'", file=sys.stderr)
            return 1
        for p in matched:
            print_prompt(p)
        return 0

    label = (
        "PRESENTATION"
        if args.presentation
        else ("INFOGRAPHIC" if args.infographic else "MARKETING")
    )
    print(f"Asset Management Hub — structured {label} AI prompts\n")
    for p in prompts:
        print_prompt(p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
