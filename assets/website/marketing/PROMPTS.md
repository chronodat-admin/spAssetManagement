# Asset Management Hub — Marketing one-pager AI prompts (structured)

Generated from `scripts/amh_ai_prompts.py`. Regenerate: `python scripts/print-amh-prompts.py --export-md`

Use **Cursor image generation** (16:9). Attach reference screenshots listed per prompt.

## Critical rule — Chronodat logo

**Do NOT generate** Chronodat / CHRONODAT / CHRC text or any logo box in the image. Leave the header top-right ~42% × 12% as clean background. The official wordmark is composited afterward:

```bash
python scripts/fix-surfaces-showcase-ai.py          # surfaces sheet only
python scripts/embed-marketing-chronodat-logo.py    # stamp logo on masters
python scripts/generate-marketing-store-crops.py    # crops inherit the logo
```

## Partner Center output

| Rule | Value |
|------|-------|
| Store size | **1366×768** PNG, **≤ 1024 KB** |
| Upload path | `assets/store/listing/screenshots/marketing/` |
| AI masters | `assets/website/marketing/*-ai.png` (1536×1024) |

## Shared brand rules

```
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.
```

### Shared negative prompt

```
Chronodat, CHRONODAT, CHRC, wordmark, logo in header corner, white box behind logo, frosted pill behind logo,
logo border, rectangular logo background, Asset Management without Hub,
Microsoft 365, M365, SPFx, SharePoint Framework, Graph API badge,
footer logo, partner badge, chronodat.com, website URL, price tag, certification badge,
blurry, distorted text, gibberish UI, loading spinner, Risk & Compliance Hub, employee directory, time billing
```

---

## §1 — `asset-management-feature-grid-ai.png`

**Headline:** Track assets, assignments, and operations in one SharePoint-native hub

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
Canvas: 1536×1024 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Complete asset register and operations
HEADLINE: Track assets, assignments, and operations in one SharePoint-native hub

BACKGROUND:
Light gray-teal subtle triangle pattern on #ECEEF2. Clean enterprise marketing layout.

HEADER:
Left: app icon + bold Asset Management Hub + gray subtitle. Optional two pills: SharePoint Online, Microsoft Teams. Top-right: empty clear gradient — NO Chronodat logo or text.

MAIN LEFT:
4×4 grid of 16 white rounded feature cards with teal/blue icon dots. Cards: Dashboard, All Assets, Assigned To Me, Available, Assign, Return, Book, Request, Scan, Inventory, Licenses, Maintenance, Reports, Depreciation, Audit Log, Settings.

MAIN RIGHT:
Device mockups (laptop + tablet) showing Asset Management Hub asset register UI mirroring attached 02-all-assets.png — same sidebar, status pills, table columns.

FOOTER:
White bar: app icon + footer product line + tagline left; 4 outlined trust pills right. No logos in footer.

BRAND / STYLE RULES:
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.
```

---

## §2 — `asset-management-dashboard-showcase-ai.png`

**Headline:** Portfolio visibility with dashboards, KPI cards, and status charts

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
Canvas: 1536×1024 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Dashboard and portfolio visibility
HEADLINE: Portfolio visibility with dashboards, KPI cards, and status charts

BACKGROUND:
Soft gray #F7F8FA with subtle depth. Marketing showcase layout.

HEADER:
Left: app icon + Asset Management Hub + subtitle for SharePoint and Teams. Top-right empty.

MAIN CENTER:
Modern laptop with Asset Management Hub dashboard mirrored from attached 01-dashboard.png — KPI cards (Total, Available, Assigned, In Repair), Latest Assets table, category chart, status donut. NO loading spinners.

MAIN LEFT:
4 vertical KPI highlight cards: Total Assets, Assigned, Available, Overdue — large numbers with icons.

MAIN RIGHT:
White card titled Dashboard highlights with 4 bullets: real-time KPIs, actionable insights, operational efficiency, trusted SharePoint + Teams platform.

FOOTER:
Trust pills: Built on SharePoint Online, Built for Microsoft Teams, Secure. Compliant. Reliable., Trusted by IT Teams.

BRAND / STYLE RULES:
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.
```

---

## §3 — `asset-management-compliance-showcase-ai.png`

**Headline:** Governed SharePoint lists with audit log and administrator controls

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `docs/user-guide/images/15-audit-log.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1536×1024 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Governance and audit
HEADLINE: Governed SharePoint lists with audit log and administrator controls

BACKGROUND:
Dark navy gradient header #0F234B fading to lighter gray-teal below. Enterprise governance theme.

HEADER:
Left: app icon + white Asset Management Hub text. Top-right empty dark header — NO logo.

MAIN CENTER:
Laptop showing Audit Log UI from attached 15-audit-log.png — When, User, Action, Entity columns, Settings updated / Created pills, sidebar with Operations and Analysis.

MAIN RIGHT:
White rounded card Governance at every layer with 5 items and blue icons: audit trail, administrator controls, transparency, filter and review, secure and reliable.

FOOTER:
White bar: product line left; Built for SharePoint and Built for Teams badges right.

BRAND / STYLE RULES:
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.
```

---

## §4 — `asset-management-analysis-showcase-ai.png`

**Headline:** Report builder, depreciation schedules, and CSV export

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `docs/user-guide/images/13-reports.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1536×1024 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Reporting and analysis
HEADLINE: Report builder, depreciation schedules, and CSV export

BACKGROUND:
Light professional gray-teal marketing background.

HEADER:
App icon + product name + SharePoint and Teams subtitle. Top-right empty.

MAIN CENTER:
Laptop with Report Builder page from 13-reports.png — report list, filters, export actions, sidebar.

MAIN SIDES:
3 callout cards: Custom report builder, Depreciation schedules, CSV export from SharePoint lists.

FOOTER:
Standard footer with trust pills. No footer logos.

BRAND / STYLE RULES:
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.
```

---

## §5 — `asset-management-all-features-infographic-ai.png`

**Headline:** All Asset Management Hub features — register, operations, and admin

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
Canvas: 1536×1024 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Full feature map
HEADLINE: All Asset Management Hub features — register, operations, and admin

BACKGROUND:
Light infographic grid on soft gray-teal background.

HEADER:
App icon + product name. Top-right empty.

MAIN:
Six horizontal rows of feature cards:
1 Dashboard — KPIs and charts
2 Asset register — hardware and software
3 Operations — assign, return, book, request, scan, inventory
4 Analysis — reports, depreciation, audit log
5 Administration — settings, lookups, roles
6 Deploy — SharePoint pages and Teams tabs only

FOOTER:
Standard product footer + 4 trust pills.

BRAND / STYLE RULES:
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.

NOTES: Dense readable card grid; avoid tiny illegible text.
```

**Notes:** Dense readable card grid; avoid tiny illegible text.

---

## §6 — `asset-management-surfaces-showcase-ai.png`

**Headline:** One asset hub across SharePoint, Teams, and native list forms

**Attach:**

- `assets/brand/app-icon.png`
- `docs/user-guide/images/01-dashboard.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`
- `docs/user-guide/images/13-reports.png`
- `docs/user-guide/images/15-audit-log.png`
- `docs/user-guide/images/02-all-assets.png`
- `docs/user-guide/images/05-assign-asset.png`

**Prompt:**

```
Professional B2B SaaS marketing infographic for Asset Management Hub.
Canvas: 1536×1024 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Deploy everywhere
HEADLINE: One asset hub across SharePoint, Teams, and native list forms

BACKGROUND:
Light blue-white gradient #F5F7FA. Clean three-column layout.

HEADER:
App icon + Asset Management Hub. Top-right completely empty — no CHRC, no CHRONODAT, no divider, no logo box.

MAIN:
Three equal columns with SharePoint Online, Microsoft Teams, and Native Assets list form customizer headers.
Column 1: asset list UI from 02-all-assets.png.
Column 2: same hub in Teams-style frame.
Column 3: New Asset form from 05-assign-asset.png style.
Each window title must say Asset Management Hub (full name).

FOOTER:
White bar: icon + product line + tagline; 4 trust pills right.

BRAND / STYLE RULES:
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.

NOTES: Run scripts/fix-surfaces-showcase-ai.py after generation to swap mockups with live screenshots.
```

**Notes:** Run scripts/fix-surfaces-showcase-ai.py after generation to swap mockups with live screenshots.

## Regeneration commands

```bash
python scripts/print-amh-prompts.py --sheet surfaces   # copy one prompt
python scripts/embed-marketing-chronodat-logo.py       # stamp logo on masters
python scripts/generate-marketing-store-crops.py       # crops inherit the logo
npm run verify:store
```
