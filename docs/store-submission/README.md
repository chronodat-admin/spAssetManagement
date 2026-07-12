# App Source Submission — Generation Guide

How every Microsoft Partner Center / AppSource submission artifact for **Asset
Management Hub** is generated from this repo: **images, AI prompts, the store
description, component/permission details, icons, screenshots, and version metadata.**

This is the index. Companion docs:

| Doc | Purpose |
|-----|---------|
| [`microsoft-store-submission.md`](../microsoft-store-submission.md) | Pre-submission checklist + upload rules |
| [`partner-center-long-description.html`](./partner-center-long-description.html) | Ready-to-paste store description |
| [`02-teams-after-install.md`](./02-teams-after-install.md) | Enable Teams via App Catalog Sync |
| [`03-teams-and-store-hardening-playbook.md`](./03-teams-and-store-hardening-playbook.md) | Reusable Teams/store hardening steps for any Chronodat app |
| [`partner-center-and-billing-setup.md`](./partner-center-and-billing-setup.md) | Paste-ready Partner Center + Stripe submission text |
| [`../presentation/image-generation-process.md`](../presentation/image-generation-process.md) | Presentation/video slide pipeline |
| [`../presentation/90-second-video-script.md`](../presentation/90-second-video-script.md) | Video narration + timing |

---

## Artifact map

| Artifact | Source of truth | Generated into | Command |
|----------|-----------------|----------------|---------|
| Short / long description | `config/package-solution.json` → `metadata` | package + manifests | `npm run sync:version` (via `ship`) |
| Partner Center HTML description | this repo (hand-authored from code) | `docs/store-submission/partner-center-long-description.html` | manual + review |
| App icons (96/color/outline/store logo) | `assets/brand/app-icon.png` | `assets/`, `teams/`, `sharepoint/`, `src/assets/` | `npm run assets:icons` |
| Marketing one-pagers (AI) | `scripts/amh_ai_prompts.py` → `MARKETING_PROMPTS` | `assets/website/marketing/*-ai.png` | see [Marketing images](#2-marketing-one-pagers) |
| Store screenshots (1366×768) | marketing masters | `assets/store/listing/screenshots/marketing/` | `npm run assets:marketing:crops` |
| Store screenshots v2 (screenshot-blended, 1366×768) | `_raw` AI sheets + real screenshots | `assets/store-submission/` | `python scripts/embed-presentation-brand.py --config config/store-submission-brand.json` (see [folder README](../../assets/store-submission/README.md)) |
| Architecture infographics (AI) | `scripts/amh_ai_prompts.py` → `INFOGRAPHIC_PROMPTS` | `assets/website/infographic/` | `npm run assets:infographic` |
| Presentation / video slides (AI) | `scripts/amh_ai_prompts.py` → `PRESENTATION_PROMPTS` | `assets/website/presentation/` | `npm run assets:presentation-brand` |
| `.sppkg` package | `config/package-solution.json` | `sharepoint/solution/asset-management.sppkg` | `npm run ship` |

All AI prompts are **generated from one canonical Python source**
(`scripts/amh_ai_prompts.py`) and exported to `PROMPTS.md` files with
`npm run prompts:export`. Never hand-edit the `PROMPTS.md` files.

---

## 1. Store description & metadata

### Short / long description (in-package)

Edit `config/package-solution.json` → `solution.metadata`:

```json
"shortDescription": { "default": "Asset management for Microsoft 365 SharePoint Online" },
"longDescription":  { "default": "Asset Management Hub is a SharePoint Framework (SPFx) solution ..." }
```

These flow into the Teams/M365 manifests during `npm run sync:version` (run by
`npm run ship`).

### Partner Center long description (HTML)

The rich store description lives at
[`docs/store-submission/partner-center-long-description.html`](./partner-center-long-description.html)
and is **derived directly from the codebase** so it stays truthful. When features
change, update these sources and regenerate the relevant section:

| Description section | Derived from |
|---------------------|--------------|
| Key Features | `src/components/Settings/settingsPageMeta.ts` + app navigation |
| Microsoft Teams Integration | web part `supportedHosts` (`TeamsTab`, `TeamsPersonalApp`) |
| Email Notifications | `Settings → Email Integration` (Graph / Chronodat API / Power Automate) |
| Microsoft Intune Sync | Optional Intune import flow; not requested in the default store package |
| Component Information (policy 1170.1) | the two SPFx manifests (see §5) |
| Prerequisites / Limitations | provisioning + `webApiPermissionRequests` + platform constraints |
| Licensing / Get Started | subscription model (one license per site collection) |

Paste it into **Marketplace offers → [offer] → Offer setup → Properties →
Description** and use **Preview** before publishing. The `!important` inline button
styles are intentional — they render the Product page / Knowledge base / Support
links as buttons in the store UI.

---

## 2. Marketing one-pagers

Six landscape sheets (dashboard, feature grid, compliance, analysis, all-features,
surfaces). Two-step: AI generates with an empty top-right corner, then the Chronodat
wordmark is composited on.

```bash
# 1. Print prompts to paste into Cursor image generation (16:9)
npm run prompts:marketing

# 2. Save AI masters to assets/website/marketing/<name>-ai.png (1536×1024)

# 3. Composite the real Chronodat logo onto the empty corner
python scripts/embed-marketing-chronodat-logo.py

# 4. Generate 1366×768 Partner Center crops (logo inherited)
npm run assets:marketing:crops
```

**Brand rules** (enforced in prompts): product name always "Asset Management Hub";
platforms **SharePoint Online + Microsoft Teams only** (no M365/SPFx badges); leave
the header top-right empty for the composited logo. Full prompts:
[`assets/website/marketing/PROMPTS.md`](../../assets/website/marketing/PROMPTS.md).

---

## 3. Architecture infographics

Five 1600×900 diagrams (overview, data flow, components, surfaces, modules).

```bash
npm run prompts:export          # refresh assets/website/infographic/PROMPTS.md
# Generate in Cursor, save to assets/website/infographic/_raw/
npm run assets:infographic      # letterbox + embed Chronodat logo
```

Prompts: [`assets/website/infographic/PROMPTS.md`](../../assets/website/infographic/PROMPTS.md).

---

## 4. Presentation / video slides

Full pipeline documented in
[`../presentation/image-generation-process.md`](../presentation/image-generation-process.md).
Summary: AI generates 1920×1080 slides with real app screenshots blended in and a
clean top band; `scripts/embed-presentation-brand.py` composites the real app icon,
"Asset Management Hub" header (Segoe UI), and Chronodat logo consistently.

```bash
npm run prompts:presentation        # print the slide prompts
# Generate in Cursor, save to assets/website/presentation/_raw/pres-raw-*.png
npm run assets:presentation-brand   # composite brand assets
```

This pipeline is **config-driven and reusable in other apps** via
`config/presentation-brand.json` (template: `config/presentation-brand.template.json`).

---

## 5. SPFx components & permissions (policy 1170.1)

Declare **every** component type in the store description. Source of truth is the two
manifests; current package:

| Component | Manifest | Host types |
|-----------|----------|------------|
| Client-side web part "Asset Management Hub" | `src/webparts/assetManagement/AssetManagementWebPart.manifest.json` | `SharePointWebPart`, `SharePointFullPage`, `TeamsTab`, `TeamsPersonalApp` |
| Form customizer extension (AM_Assets forms) | `src/extensions/assetFormCustomizer/AssetFormCustomizer.manifest.json` | `SharePointForm` (FormCustomizer) |

**Microsoft Graph permissions** (`config/package-solution.json` →
`webApiPermissionRequests`) — a tenant admin approves these once in SharePoint Admin
Center → API access:

| Scope | Used for |
|-------|----------|
| `Mail.Send` | Microsoft Graph workflow email notifications |

The default store package intentionally keeps Graph consent narrow. Optional Intune
managed-device import requires separate tenant planning because
`DeviceManagementManagedDevices.Read.All` can block SharePoint App Catalog
Sync-to-Teams in tenants where the API permission is pending or not approved.

**Component GUIDs** (fixed for the store upgrade path — never change):

| Component | GUID |
|-----------|------|
| Solution | `120fe796-4604-4ea0-81e8-d69ac485cbc9` |
| Feature | `cbc74d6d-aa77-4c02-b177-05d8a3c5a702` |
| Web part | `4fa4ca04-c98a-4723-8671-f69956f65f26` |
| Form customizer | `013cb786-7445-49dc-aebd-9c4e8706fd98` |

---

## 6. Icons & screenshots specs

| Asset | Spec | Location |
|-------|------|----------|
| Partner Center logo | 300×300 PNG | `assets/store/listing/logo-300x300.png` |
| Store screenshots | **1366×768 PNG, ≤ 1024 KB** | `assets/store/listing/screenshots/marketing/` |
| AI marketing masters | 1536×1024 (do **not** upload) | `assets/website/marketing/*-ai.png` |
| Catalog / web part icon | 96×96 branded | generated by `npm run assets:icons` |

All icons derive from the single branded source `assets/brand/app-icon.png`.

---

## 7. Version, verify, ship

```bash
# 1. Bump both versions in config/package-solution.json (solution.version + feature version)
# 2. Sync everything and build the package
npm run ship
# 3. Gate checks
npm run verify:version && npm run verify:display-name && npm run verify:store && npm run verify:sppkg-teams
```

`verify:store` runs readiness + icon + screenshot validators. The full ordered
checklist lives in [`microsoft-store-submission.md`](../microsoft-store-submission.md).

For SharePoint App Catalog **Sync to Teams**, upload the `.sppkg` produced directly
by `npm run ship`. Do **not** run `npm run fix:sppkg-teams` before upload; the package
shape that successfully synced keeps `TeamsSPFxApp.zip` under
`ClientSideAssets/TeamsSPFxApp.zip`. Full runbook:
[`02-teams-after-install.md`](./02-teams-after-install.md).

---

## End-to-end regeneration (all artifacts)

```bash
# Descriptions:   edit config/package-solution.json + partner-center-long-description.html
# Prompts:        npm run prompts:export
# Marketing:      (generate) -> python scripts/embed-marketing-chronodat-logo.py -> npm run assets:marketing:crops
# Infographics:   (generate) -> npm run assets:infographic
# Presentation:   (generate) -> npm run assets:presentation-brand
# Icons:          npm run assets:icons
# Package:        npm run ship
# Verify:         npm run verify:version && npm run verify:display-name && npm run verify:store
```
