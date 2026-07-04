# Asset Management (SPFx)

SharePoint Framework 1.21.1 client-side solution for **Asset Management** — track hardware, software licenses, assignments, maintenance, depreciation, and inventory on SharePoint Online and Microsoft Teams.

## Requirements

| Requirement | Detail |
|-------------|--------|
| Platform | SharePoint Online only (not on-premises) |
| Node.js | `>=22.0.0 <23.0.0` |
| SPFx | 1.21.1 |
| Browser | Modern Chromium, Edge, Firefox, Safari |
| Permissions | Site owner for setup; Graph Mail.Send for email notifications |
| Recommended | Dedicated subsite (not root team site) |

## Quick start

```bash
npm install
cp config/serve.json.example config/serve.json
# Edit serve.json pageUrl for your tenant/site
gulp trust-dev-cert   # once per machine
gulp serve            # https://localhost:4321
```

For local dev, set `skipSubscriptionCheck: true` on web part properties in `config/serve.json` (not in the property pane).

## Production build

```bash
# 1. Bump config/package-solution.json → solution.version
# 2. Ship
npm run ship
# Output: sharepoint/solution/asset-management.sppkg

# 3. Pre-upload verification
npm run verify:version && npm run verify:display-name && npm run verify:store
```

## Project structure

```
asset-management-spfx/
├── config/           SPFx + publisher + serve config
├── scripts/          Version sync, ship, verify, docs, marketing
├── teams/            Teams manifest + build-package.ps1
├── m365/             Unified M365 manifest
├── assets/           Brand, store listing, architecture SVGs
├── docs/             Architecture, user guide, store submission (tasks 24+)
├── sharepoint/       app-icon.png + solution output
└── src/
    ├── webparts/assetManagement/     Main web part
    ├── extensions/assetFormCustomizer/  AM_Assets form customizer
    ├── components/   UI shell, list views, subscription, dialogs
    ├── services/     SharePoint REST + domain services (tasks 12+)
    └── models/       IListDefinitions + entity interfaces (tasks 12+)
```

## Component GUIDs (fixed for store upgrade path)

| Component | GUID |
|-----------|------|
| Solution | `87724d54-e89b-4512-921c-b4d1e3532cc2` |
| Feature | `cbc74d6d-aa77-4c02-b177-05d8a3c5a702` |
| Web part | `4fa4ca04-c98a-4723-8671-f69956f65f26` |
| Form customizer | `013cb786-7445-49dc-aebd-9c4e8706fd98` |

## Status

Tasks 1–11 complete: project scaffold, build pipeline, UI shell, subscription gate architecture, layout components, and `gulp bundle` compile successfully. Domain services, provisioning, dashboard, and settings pages follow in tasks 12–32.
