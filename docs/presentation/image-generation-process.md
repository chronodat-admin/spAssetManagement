# Presentation Image Generation Process

> Part of the end-to-end [Video Production Guide](./video-production-guide.md) (slides +
> thumbnail + voice + assembly, and how to reuse it for another app). This doc covers the
> **slide** step in depth.

How the Asset Management Hub **90-second video presentation** slides are produced.
This is a **two-step pipeline**: AI generates the layout + real screenshots, then a
Python script composites the true brand assets on top. This keeps the app icon,
product wordmark, and Chronodat logo pixel-accurate and identical on every slide —
something AI image generation cannot do reliably on its own.

---

## Why two steps?

| Problem with pure AI generation | Solution |
|---------------------------------|----------|
| AI redraws the app icon as a different (flat/wrong) box each time | Composite the real `assets/brand/app-icon.png` |
| AI cannot render the "CHRONODAT" wordmark correctly | Composite the real `assets/brand/chronodat-logo.png` |
| Headline/brand fonts drift between slides | Brand text drawn in real **Segoe UI** via Pillow |
| Invented UI doesn't match the product | Pass real app screenshots as generation **references** |

So the AI is only responsible for: background, headline/bullets, layout, and
**framing the real screenshots** inside device/browser mockups. Everything brand-
critical is stamped afterward.

---

## Pipeline overview

```
docs/user-guide/images/*.png   assets/brand/{app-icon,chronodat-logo}.png
        (real screenshots)              (real brand files)
              │                                  │
              ▼                                  │
   ┌──────────────────────┐                      │
   │  STEP 1 — AI slides  │                      │
   │  (reserved top band, │                      │
   │   no brand marks)    │                      │
   └──────────┬───────────┘                      │
              ▼                                  ▼
   assets/website/presentation/_raw/pres-raw-*.png
              │                                  │
              ▼                                  │
   ┌──────────────────────────────────────────────┐
   │  STEP 2 — embed-presentation-brand.py          │
   │  header lockup: icon + name + Chronodat logo   │
   └──────────┬─────────────────────────────────────┘
              ▼
   assets/website/presentation/presentation-slide-*-ai.png   (final)
```

---

## Step 1 — Generate raw slides (AI)

Generate each slide at **1920×1080 (16:9)** using Cursor image generation. Two rules
make step 2 possible:

1. **Reserve the top 12%** of the slide as a clean, empty header band (no text/logos).
2. **Do not draw** any app icon, product wordmark, box/QR/barcode logo, or company logo.

Real app screenshots are attached as **reference images** so the AI reproduces the
actual UI faithfully inside laptop/browser/phone frames.

### Shared style block (identical across every slide)

```
1920x1080 16:9 enterprise SaaS keynote slide. Clean soft light gray-teal gradient
background #F5F7FA with faint subtle Fluent geometric shapes in corners.
Accent colors ONLY teal #008080, Microsoft blue #0078D4, navy #0F234B.
Bold clean Segoe-UI-style typography.

RESERVED: leave the entire TOP 12% of the slide as a clean empty header band —
no text, no icons, no logos. Do NOT draw any app icon, product wordmark,
box/QR/barcode logo, or company logo anywhere. Ultra-sharp crisp flat vector,
no blur, no people, no stock photography, no website URLs, no price tags,
no Microsoft 365 or SPFx badges.
```

### Slides and their real-screenshot references

| Raw file | Slide | Reference screenshots attached |
|----------|-------|--------------------------------|
| `pres-raw-00-welcome.png` | Welcome / title | — (title only) |
| `pres-raw-01-hook.png` | Hook | `02-all-assets.png` |
| `pres-raw-02-intro.png` | One hub | `01-dashboard.png` |
| `pres-raw-03-dashboard.png` | Dashboard | `01-dashboard.png` |
| `pres-raw-04-operations.png` | Assign/return/book/scan | `05-assign-asset.png`, `09-scan-asset.png` |
| `pres-raw-05-governance.png` | Reports/depreciation/audit | `13-reports.png`, `14-depreciation.png`, `15-audit-log.png` |
| `pres-raw-06-cta.png` | Deploy / CTA | `02-all-assets.png` |
| `pres-raw-07-thankyou.png` | Thank you / closing | — (title only) |
| `pres-raw-endtoend-flow.png` | End-to-end lifecycle | `05-assign-asset.png`, `09-scan-asset.png`, `13-reports.png`, `15-audit-log.png` |

> Screenshots live in `docs/user-guide/images/`.

Save the AI outputs into `assets/website/presentation/_raw/` using the `pres-raw-*.png`
names above. The full per-slide prompts are in
[`assets/website/presentation/PROMPTS.md`](../../assets/website/presentation/PROMPTS.md)
(generated from `scripts/amh_ai_prompts.py`).

---

## Step 2 — Composite brand assets (script)

```bash
npm run assets:presentation-brand
# = python scripts/embed-presentation-brand.py
```

`scripts/embed-presentation-brand.py` reads every `_raw/pres-raw-*.png` and stamps a
**consistent header lockup**, then writes the final `presentation-slide-*-ai.png`.

### What it composites

| Element | Source | Placement |
|---------|--------|-----------|
| App icon | `assets/brand/app-icon.png` | Top-left, rounded, height = 7.0% of slide |
| Product name | text `"Asset Management Hub"` | Segoe UI Semibold, navy `#0F234B`, right of icon |
| Chronodat logo | `assets/brand/chronodat-logo.png` | Top-right, height = **3.04%** of slide (80% of original) |
| Hairline | drawn | Under the header band, faint navy |
| Large title | text `"Asset Management Hub"` | Title slides only, Segoe UI Bold, centered |

### Geometry (ratios of slide size — resolution independent)

All geometry lives in the config's `geometry` block (defaults shown):

```json
{
  "header_h_ratio": 0.115,   // header band height
  "pad_x_ratio":    0.028,   // left/right margin
  "icon_h_ratio":   0.070,   // app icon height
  "logo_h_ratio":   0.0304,  // logo height (80% of the former 0.038)
  "name_size_ratio":0.55,    // product-name font size vs icon height
  "icon_corner_ratio":0.22,  // app-icon corner rounding
  "name_gap_ratio": 0.30,    // gap between icon and product name
  "title_size_ratio":0.10,   // large title size (title slides)
  "title_y_ratio":  0.40     // large title vertical position
}
```

### Fonts (Windows Segoe UI)

| Face | File |
|------|------|
| Semibold (product name) | `C:/Windows/Fonts/seguisb.ttf` |
| Bold (title slides) | `C:/Windows/Fonts/segoeuib.ttf` |
| Regular | `C:/Windows/Fonts/segoeui.ttf` |

### Name mapping

```
pres-raw-<NN>-<slug>.png  ->  presentation-slide-<NN>-<slug>-ai.png
```

The script is **idempotent**: it always regenerates finals from the `_raw/` masters,
so you can safely re-run it after tweaking geometry (e.g. the logo size change).

---

## Brand rules (all presentation images)

- Product name is always **Asset Management Hub** (never "Asset Management" alone).
- Platforms referenced: **SharePoint Online** and **Microsoft Teams** only.
  Never show "Microsoft 365", "M365", "SPFx", or Graph badges.
- Palette: teal `#008080`, Microsoft blue `#0078D4`, navy `#0F234B`, background
  `#F5F7FA`.
- No website URLs, price tags, certification badges, people photos, or stock imagery.

> Note: the captured app screenshots show the in-product chrome as "Asset Management"
> and a "Chronodat © 2026" footer (taken before the Hub rename). The slide header and
> branding say "Asset Management Hub" correctly. Recapture the screenshots from the
> renamed build if you need the in-app chrome updated too.

---

## Full regeneration checklist

```bash
# 1. (Optional) refresh the prompt library / PROMPTS.md
npm run prompts:presentation      # print prompts to copy into Cursor
npm run prompts:export            # rewrite assets/website/*/PROMPTS.md

# 2. Generate each slide in Cursor (16:9), attaching the reference screenshots
#    from the table above. Save outputs to assets/website/presentation/_raw/.

# 3. Composite the real brand assets onto every slide
npm run assets:presentation-brand
```

## Reusing this in another app

The pipeline is **app-agnostic**. `scripts/embed-presentation-brand.py` reads all
app-specific values from a JSON config, with cross-platform font fallbacks (Windows /
macOS / Linux), so it drops into any repo unchanged.

### One-time setup in the other app

1. **Copy two files** into the other repo:
   - `scripts/embed-presentation-brand.py`
   - `config/presentation-brand.template.json` → save as `config/presentation-brand.json`
2. **Edit `config/presentation-brand.json`** for that app:
   - `product_name` — the app's full display name
   - `app_icon` — path to that app's brand icon (repo-root-relative)
   - `logo` — path to the company/partner logo (or omit / set `draw_product_name`/`--no-logo`)
   - `colors`, `geometry`, `fonts` — override only what differs; unset keys inherit defaults
3. **Add an npm script** (optional) to that app's `package.json`:
   ```json
   "assets:presentation-brand": "python scripts/embed-presentation-brand.py"
   ```

> Config paths are resolved relative to the **repo root** (the script's parent's parent),
> so a config in `config/` still points at `assets/...` correctly. A config may set
> `"base_dir"` (relative to the config file) to reference assets outside the repo.

### Per-deck usage (same as here)

```bash
# Generate raw slides in Cursor (16:9), reserving the top band, no brand marks,
# attaching that app's real screenshots. Save to <raw_dir>/<raw_prefix>*.png
npm run assets:presentation-brand      # auto-discovers config/presentation-brand.json
```

### Handy CLI overrides (no config edit needed)

```bash
# Point at an explicit config
python scripts/embed-presentation-brand.py --config config/presentation-brand.json

# Quick brand swap for a one-off deck
python scripts/embed-presentation-brand.py \
  --product-name "Risk & Compliance Hub" \
  --app-icon assets/brand/rc-icon.png \
  --logo assets/brand/company-logo.png

# Resize the logo relative to current (e.g. 80%), or drop it entirely
python scripts/embed-presentation-brand.py --logo-scale 0.8
python scripts/embed-presentation-brand.py --no-logo
```

If a configured font file is missing on the current OS, the script tries the next
candidate in the list and finally falls back to Pillow's built-in font (with a warning),
so it never hard-fails on a machine without Segoe UI.

## Related files

| Path | Purpose |
|------|---------|
| `docs/presentation/90-second-video-script.md` | Narration script + timing map |
| `assets/website/presentation/PROMPTS.md` | Per-slide AI prompts |
| `assets/website/presentation/_raw/` | AI masters (no branding) |
| `assets/website/presentation/presentation-slide-*-ai.png` | Final branded slides |
| `scripts/amh_ai_prompts.py` | Canonical prompt source (`PRESENTATION_PROMPTS`) |
| `scripts/print-amh-prompts.py` | Prints / exports prompts |
| `scripts/embed-presentation-brand.py` | Step-2 brand compositing (portable, config-driven) |
| `config/presentation-brand.json` | This app's brand config |
| `config/presentation-brand.template.json` | Copy-me template for other apps |
```
