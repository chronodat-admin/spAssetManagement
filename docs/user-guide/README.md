# Asset Management — User Guide Screenshots

End-user documentation is generated from live UI captures against your SharePoint-hosted web part.

## Target site

```
https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx
```

## One-time authentication

E2E tests require a saved Microsoft 365 session at `e2e/.auth/user.json`.

### Option A — Sign in when the browser opens (recommended)

```powershell
cd c:\spAssetManagement
$env:PLAYWRIGHT_BASE_URL = "https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx"
$env:PLAYWRIGHT_AUTH_TIMEOUT_MS = "600000"
npm run test:e2e:setup
```

A Chromium window opens on the Microsoft sign-in page. Complete sign-in within 10 minutes. When the Asset Management web part loads, Playwright saves `e2e/.auth/user.json`.

### Option B — Reuse Edge profile (close Edge first)

```powershell
$env:PLAYWRIGHT_USE_EDGE_PROFILE = "1"
npm run test:e2e:setup
```

Close all Edge windows before running. Playwright uses your default Edge profile where you are already signed in to M365.

## Capture screenshots and build the guide

```powershell
$env:PLAYWRIGHT_BASE_URL = "https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx"
npm run docs:user-guide:all
```

This runs:

1. `e2e/screenshots/capture-user-guide.spec.ts` — saves 24 PNG files to `docs/user-guide/images/`
2. `scripts/build-user-guide.py` — produces:
   - `docs/Asset-Management-User-Guide.docx`
   - `docs/Asset-Management-User-Guide.md`

## Run full E2E suite

```powershell
$env:PLAYWRIGHT_BASE_URL = "https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx"
npm run test:e2e
```

## Screenshot list

| File | Page |
|------|------|
| 01-dashboard.png | Dashboard |
| 02-all-assets.png | All Assets |
| 03-assigned-to-me.png | Assigned To Me |
| 04-available-assets.png | Available |
| 05-assign-asset.png | Assign Asset |
| 06-return-asset.png | Return Asset |
| 07-book-asset.png | Book Asset |
| 08-request-asset.png | Request Asset |
| 09-scan-asset.png | Scan Asset |
| 10-inventory.png | Inventory |
| 11-software-licenses.png | Software Licenses |
| 12-maintenance.png | Maintenance |
| 13-reports.png | Reports |
| 14-depreciation.png | Depreciation |
| 15-audit-log.png | Audit Log |
| 16-categories.png | Categories |
| 17-vendors.png | Vendors |
| 18-locations.png | Locations |
| 19-settings-general.png | Settings → General |
| 20-settings-appearance.png | Settings → Appearance |
| 21-settings-forms.png | Settings → Forms |
| 22-settings-tags.png | Settings → Tags |
| 23-settings-subscription.png | Settings → Subscription |
| 24-settings-roles.png | Settings → Roles & Permissions |
