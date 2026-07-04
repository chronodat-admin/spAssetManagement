import json
import re
import base64
import zipfile
import io
from pathlib import Path

html = Path("playwright-report/index.html").read_text(encoding="utf-8")
m = re.search(r'<template id="playwrightReportBase64">data:application/zip;base64,([^<]+)</template>', html)
if not m:
    raise SystemExit("Report zip not found in index.html")

raw = base64.b64decode(m.group(1))
with zipfile.ZipFile(io.BytesIO(raw)) as zf:
    names = zf.namelist()
    report_name = next(n for n in names if n.endswith(".json") and "report" in n.lower())
    report = json.loads(zf.read(report_name))

stats = report.get("stats", {})
print("=== Playwright Report Summary ===")
print(f"Total:   {stats.get('total', '?')}")
print(f"Passed:  {stats.get('expected', stats.get('passed', '?'))}")
print(f"Failed:  {stats.get('unexpected', stats.get('failed', '?'))}")
print(f"Skipped: {stats.get('skipped', '?')}")
print(f"Flaky:   {stats.get('flaky', 0)}")
dur = stats.get("duration", 0)
print(f"Duration: {dur/1000/60:.1f} min ({dur/1000:.0f}s)")

failed = []
skipped = []

def walk_suite(suite, path=""):
    name = f"{path} › {suite.get('title', '')}".strip(" ›")
    for spec in suite.get("specs", []):
        full = f"{name} › {spec.get('title', '')}" if name else spec.get("title", "")
        for test in spec.get("tests", []):
            for result in test.get("results", []):
                st = result.get("status", "")
                if st == "unexpected":
                    failed.append((full, result.get("error", {}).get("message", "")[:120]))
                elif st == "skipped":
                    skipped.append(full)
    for child in suite.get("suites", []):
        walk_suite(child, name)

for f in report.get("files", []):
    for suite in f.get("suites", []):
        walk_suite(suite)

if failed:
    print("\n--- Failed ---")
    for title, err in failed:
        print(f"  x {title}")
        if err:
            print(f"    {err}")
else:
    # Count by status from all results
    counts = {}
    def count_suite(suite):
        for spec in suite.get("specs", []):
            for test in spec.get("tests", []):
                for result in test.get("results", []):
                    st = result.get("status", "unknown")
                    counts[st] = counts.get(st, 0) + 1
        for child in suite.get("suites", []):
            count_suite(child)
    for f in report.get("files", []):
        for suite in f.get("suites", []):
            count_suite(suite)
    if counts:
        print("\nResult statuses:", counts)

if skipped:
    print(f"\n--- Skipped ({len(skipped)}) ---")
    for s in skipped[:12]:
        print(f"  - {s}")
    if len(skipped) > 12:
        print(f"  ... and {len(skipped) - 12} more")
