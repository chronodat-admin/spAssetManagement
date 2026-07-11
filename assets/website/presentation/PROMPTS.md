# Asset Management Hub — 90-second video presentation (AI slide prompts)

Generated from `scripts/amh_ai_prompts.py`. Regenerate:
`python scripts/print-amh-prompts.py --export-md`

Companion script: `docs/presentation/90-second-video-script.md`

Use **Cursor image generation** (16:9, 1920×1080). Attach the real `docs/user-guide/images/*.png` screenshots per slide so the app UI is authentic.
Save masters to `assets/website/presentation/_raw/pres-raw-*.png`.

Two-step pipeline (see `docs/presentation/image-generation-process.md`): the AI leaves the top band empty and draws no brand marks; the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward.

After generation:

```bash
npm run assets:presentation-brand   # composite real icon + header + Chronodat logo
```

## Shared presentation style

```
Video presentation slide, 16:9 landscape (1920×1080). Large bold headline readable on screen.
Soft light gray-teal gradient #F5F7FA with faint Fluent geometric shapes in corners. Microsoft Fluent flat design.
Teal #008080, Microsoft blue #0078D4, navy #0F234B accents. Bold clean Segoe-UI-style typography.
Product name always Asset Management Hub (full name). Platforms: SharePoint Online and Microsoft Teams only.
RESERVED: leave the entire TOP 12% of the slide as a clean empty header band — no text, no icons, no logos there.
Do NOT draw any app icon, product-name wordmark, box/QR/barcode logo, or company logo anywhere in the image
(the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward by
scripts/embed-presentation-brand.py). Where the layout shows app UI, attach and faithfully reproduce the real
docs/user-guide screenshots rather than inventing UI.
Minimal on-slide text (headline + 3–5 short bullets max). No website URL, no price tag.
Ultra-sharp vector infographic, no people photos, no stock photography.
```

### Negative prompt

```
Chronodat, CHRONODAT, CHRC, wordmark, logo box, app icon, product name in header,
box/QR/barcode app icon, M365, SPFx, Microsoft 365 badge,
tiny illegible text, dense paragraph blocks, blurry text, cluttered layout,
Asset Management without Hub, website URL, price tag, loading spinner, gibberish UI
```

## Slide timing map

| Slide | File | Time | Narration beat |
|-------|------|------|----------------|
| V1 | `presentation-slide-01-hook-ai.png` | 0:00–0:15 | Problem + product intro |
| V2–V3 | `02-intro`, `03-dashboard` | 0:15–0:30 | Dashboard & register |
| V4 | `presentation-slide-04-operations-ai.png` | 0:30–0:45 | Assign, return, book, scan |
| V5 | `presentation-slide-05-governance-ai.png` | 0:45–1:00 | Reports, audit, governance |
| V6 | `presentation-slide-06-cta-ai.png` | 1:00–1:30 | Deploy + trial CTA |

---

## §V1 — `presentation-slide-01-hook-ai.png`

**Headline:** Stop tracking assets in spreadsheets

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1920×1080 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Opening hook
HEADLINE: Stop tracking assets in spreadsheets

LAYOUT:
Split slide. Left: bold navy headline Stop tracking assets in spreadsheets with 3 red X icons beside pain points: Lost visibility, Manual updates, No audit trail. Right: faded spreadsheet grid morphing into clean SharePoint list UI silhouette.

FOOTER STRIP:
Thin teal bar: Asset Management Hub · SharePoint Online · Microsoft Teams. Bottom-right empty.

BRAND / STYLE RULES:
Video presentation slide, 16:9 landscape (1920×1080). Large bold headline readable on screen.
Soft light gray-teal gradient #F5F7FA with faint Fluent geometric shapes in corners. Microsoft Fluent flat design.
Teal #008080, Microsoft blue #0078D4, navy #0F234B accents. Bold clean Segoe-UI-style typography.
Product name always Asset Management Hub (full name). Platforms: SharePoint Online and Microsoft Teams only.
RESERVED: leave the entire TOP 12% of the slide as a clean empty header band — no text, no icons, no logos there.
Do NOT draw any app icon, product-name wordmark, box/QR/barcode logo, or company logo anywhere in the image
(the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward by
scripts/embed-presentation-brand.py). Where the layout shows app UI, attach and faithfully reproduce the real
docs/user-guide screenshots rather than inventing UI.
Minimal on-slide text (headline + 3–5 short bullets max). No website URL, no price tag.
Ultra-sharp vector infographic, no people photos, no stock photography.

NOTES: Video segment 0:00–0:15. Keep headline under 8 words.
```

**Notes:** Video segment 0:00–0:15. Keep headline under 8 words.

---

## §V2 — `presentation-slide-02-intro-ai.png`

**Headline:** Meet Asset Management Hub

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `assets/brand/app-icon.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1920×1080 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Product introduction
HEADLINE: Meet Asset Management Hub

LAYOUT:
Center hero: large app icon + Meet Asset Management Hub headline + subtitle Hardware & software tracking for SharePoint and Teams. Below: hub-and-spoke mini diagram — center Asset Management Hub, four spokes: SharePoint Pages, Teams Tab, Teams Personal App, Native List Forms.

CALLOUT:
Teal pill: One hub · Your tenant · Your data.

LOGO ZONE:
Bottom-right empty for Chronodat compositing.

BRAND / STYLE RULES:
Video presentation slide, 16:9 landscape (1920×1080). Large bold headline readable on screen.
Soft light gray-teal gradient #F5F7FA with faint Fluent geometric shapes in corners. Microsoft Fluent flat design.
Teal #008080, Microsoft blue #0078D4, navy #0F234B accents. Bold clean Segoe-UI-style typography.
Product name always Asset Management Hub (full name). Platforms: SharePoint Online and Microsoft Teams only.
RESERVED: leave the entire TOP 12% of the slide as a clean empty header band — no text, no icons, no logos there.
Do NOT draw any app icon, product-name wordmark, box/QR/barcode logo, or company logo anywhere in the image
(the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward by
scripts/embed-presentation-brand.py). Where the layout shows app UI, attach and faithfully reproduce the real
docs/user-guide screenshots rather than inventing UI.
Minimal on-slide text (headline + 3–5 short bullets max). No website URL, no price tag.
Ultra-sharp vector infographic, no people photos, no stock photography.

NOTES: Video segment 0:15–0:30. Pair with dashboard narration.
```

**Notes:** Video segment 0:15–0:30. Pair with dashboard narration.

---

## §V3 — `presentation-slide-03-dashboard-ai.png`

**Headline:** See your entire portfolio at a glance

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `docs/user-guide/images/01-dashboard.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1920×1080 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Dashboard visibility
HEADLINE: See your entire portfolio at a glance

LAYOUT:
Left third: headline + 4 bullets with icons — Real-time KPIs, Status charts, Latest assets table, Category breakdown. Right two-thirds: laptop mockup showing dashboard from 01-dashboard.png — Total, Available, Assigned, In Repair cards, donut chart, no spinners.

LOGO ZONE:
Bottom-right empty.

BRAND / STYLE RULES:
Video presentation slide, 16:9 landscape (1920×1080). Large bold headline readable on screen.
Soft light gray-teal gradient #F5F7FA with faint Fluent geometric shapes in corners. Microsoft Fluent flat design.
Teal #008080, Microsoft blue #0078D4, navy #0F234B accents. Bold clean Segoe-UI-style typography.
Product name always Asset Management Hub (full name). Platforms: SharePoint Online and Microsoft Teams only.
RESERVED: leave the entire TOP 12% of the slide as a clean empty header band — no text, no icons, no logos there.
Do NOT draw any app icon, product-name wordmark, box/QR/barcode logo, or company logo anywhere in the image
(the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward by
scripts/embed-presentation-brand.py). Where the layout shows app UI, attach and faithfully reproduce the real
docs/user-guide screenshots rather than inventing UI.
Minimal on-slide text (headline + 3–5 short bullets max). No website URL, no price tag.
Ultra-sharp vector infographic, no people photos, no stock photography.

NOTES: Video segment 0:15–0:30.
```

**Notes:** Video segment 0:15–0:30.

---

## §V4 — `presentation-slide-04-operations-ai.png`

**Headline:** Assign, return, book, and scan — in one flow

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/09-scan-asset.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1920×1080 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Day-to-day operations
HEADLINE: Assign, return, book, and scan — in one flow

LAYOUT:
Horizontal 5-step workflow with numbered teal circles and arrows: 1 Assign · 2 Return · 3 Book · 4 Request · 5 Scan. Below each step: small UI panel silhouette. Center bottom: tablet showing scan/barcode screen style from 09-scan-asset.png.

SUBTITLE:
Every action updates governed SharePoint lists instantly.

LOGO ZONE:
Bottom-right empty.

BRAND / STYLE RULES:
Video presentation slide, 16:9 landscape (1920×1080). Large bold headline readable on screen.
Soft light gray-teal gradient #F5F7FA with faint Fluent geometric shapes in corners. Microsoft Fluent flat design.
Teal #008080, Microsoft blue #0078D4, navy #0F234B accents. Bold clean Segoe-UI-style typography.
Product name always Asset Management Hub (full name). Platforms: SharePoint Online and Microsoft Teams only.
RESERVED: leave the entire TOP 12% of the slide as a clean empty header band — no text, no icons, no logos there.
Do NOT draw any app icon, product-name wordmark, box/QR/barcode logo, or company logo anywhere in the image
(the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward by
scripts/embed-presentation-brand.py). Where the layout shows app UI, attach and faithfully reproduce the real
docs/user-guide screenshots rather than inventing UI.
Minimal on-slide text (headline + 3–5 short bullets max). No website URL, no price tag.
Ultra-sharp vector infographic, no people photos, no stock photography.

NOTES: Video segment 0:30–0:45.
```

**Notes:** Video segment 0:30–0:45.

---

## §V5 — `presentation-slide-05-governance-ai.png`

**Headline:** Reports, depreciation, and a full audit trail

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1920×1080 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Reporting and governance
HEADLINE: Reports, depreciation, and a full audit trail

LAYOUT:
Three equal cards with teal top bars: Report Builder (laptop with 13-reports.png), Depreciation schedules (simple chart icon), Audit Log (15-audit-log.png columns When/User/Action). Navy header band: Governance you can prove.

BULLETS:
Under cards: CSV export · Administrator controls · Filter and review.

LOGO ZONE:
Bottom-right empty.

BRAND / STYLE RULES:
Video presentation slide, 16:9 landscape (1920×1080). Large bold headline readable on screen.
Soft light gray-teal gradient #F5F7FA with faint Fluent geometric shapes in corners. Microsoft Fluent flat design.
Teal #008080, Microsoft blue #0078D4, navy #0F234B accents. Bold clean Segoe-UI-style typography.
Product name always Asset Management Hub (full name). Platforms: SharePoint Online and Microsoft Teams only.
RESERVED: leave the entire TOP 12% of the slide as a clean empty header band — no text, no icons, no logos there.
Do NOT draw any app icon, product-name wordmark, box/QR/barcode logo, or company logo anywhere in the image
(the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward by
scripts/embed-presentation-brand.py). Where the layout shows app UI, attach and faithfully reproduce the real
docs/user-guide screenshots rather than inventing UI.
Minimal on-slide text (headline + 3–5 short bullets max). No website URL, no price tag.
Ultra-sharp vector infographic, no people photos, no stock photography.

NOTES: Video segment 0:45–1:00.
```

**Notes:** Video segment 0:45–1:00.

---

## §V6 — `presentation-slide-06-cta-ai.png`

**Headline:** Deploy everywhere. Start your free trial.

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `docs/user-guide/images/02-all-assets.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1920×1080 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Deploy and get started
HEADLINE: Deploy everywhere. Start your free trial.

LAYOUT:
Left: bold CTA headline Deploy everywhere. Start your free trial. Three trust bullets with checkmarks: Your data stays in your tenant, One license per site collection, 14-day free trial. Right: three device frames — SharePoint page, Teams tab, list form — each titled Asset Management Hub.

FOOTER:
Full-width navy bar: Asset Management Hub for SharePoint and Teams. Bottom-right empty.

BRAND / STYLE RULES:
Video presentation slide, 16:9 landscape (1920×1080). Large bold headline readable on screen.
Soft light gray-teal gradient #F5F7FA with faint Fluent geometric shapes in corners. Microsoft Fluent flat design.
Teal #008080, Microsoft blue #0078D4, navy #0F234B accents. Bold clean Segoe-UI-style typography.
Product name always Asset Management Hub (full name). Platforms: SharePoint Online and Microsoft Teams only.
RESERVED: leave the entire TOP 12% of the slide as a clean empty header band — no text, no icons, no logos there.
Do NOT draw any app icon, product-name wordmark, box/QR/barcode logo, or company logo anywhere in the image
(the real app icon, "Asset Management Hub" header, and Chronodat logo are composited afterward by
scripts/embed-presentation-brand.py). Where the layout shows app UI, attach and faithfully reproduce the real
docs/user-guide screenshots rather than inventing UI.
Minimal on-slide text (headline + 3–5 short bullets max). No website URL, no price tag.
Ultra-sharp vector infographic, no people photos, no stock photography.

NOTES: Video segment 1:00–1:30. Hold 3 seconds on final frame.
```

**Notes:** Video segment 1:00–1:30. Hold 3 seconds on final frame.

## Regeneration commands

```bash
python scripts/print-amh-prompts.py --presentation
python scripts/print-amh-prompts.py --sheet hook
npm run assets:presentation-brand
```
