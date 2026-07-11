# Chronodat SPFx App Template — Reuse Guide

How to reuse this codebase as a **template for any new Chronodat app idea** (asset
management, risk management, time & billing, help desk, inventory, contracts, etc.).

This repo is already a proven multi-domain base: it ships an **Asset Management**
domain while retaining **risk** and **compliance** modules (`riskSeedData.ts`,
`RiskControlLinkService.ts`, `ComplianceService.ts`). The same skeleton — SPFx host,
Fluent UI shell, list provisioning, settings, RBAC, i18n, subscription/trial — is
domain-agnostic. Swap the domain layer and you have a new product.

---

## 1. What you get out of the box

| Capability | Where | Reusable as-is? |
|------------|-------|-----------------|
| SPFx host (web part + full-page + Teams tab/personal app) | `src/webparts/assetManagement` | ✅ rename only |
| Native list form customizer extension | `src/extensions/assetFormCustomizer` | ✅ rename only |
| Fluent UI v9 shell, nav, dashboard, list views | `src/components` | ✅ |
| One-time **setup wizard** + list provisioning | `src/services/ListProvisioningService.ts`, `src/models/IListDefinitions.ts` | ⚙️ swap list defs |
| **Settings** framework (30+ pages, sectioned) | `src/components/Settings/settingsPageMeta.ts` | ⚙️ trim to domain |
| **RBAC** roles/permissions/administrators | `src/services/RoleService.ts`, `src/utils/rbac.ts` | ✅ |
| **i18n** (en/es/fr/de + extensible) | `src/i18n` | ✅ add strings |
| **Subscription + 14-day free trial** gate | `src/services/SubscriptionService.ts`, `src/contexts/SubscriptionContext.tsx` | ⚙️ change slug |
| Email/notifications (Graph / Chronodat API / Power Automate) | `src/services/GraphEmailService.ts`, `NotificationService.ts` | ✅ |
| Audit log, import/export, report builder, reminders | `src/services/*` | ✅ / ⚙️ |
| Theming / appearance settings + print theme | `src/models/IAppearanceSettings.ts`, `src/utils/dashboardPrintTheme.ts` | ✅ |
| Build / ship / version sync / store verify | `scripts/*`, `package.json` | ✅ |
| Marketing + presentation + docs generation | `scripts/amh_ai_prompts.py`, `docs/` | ✅ |

Legend: ✅ keep · ⚙️ adapt to the new domain.

---

## 2. Tech stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | SharePoint Framework (SPFx) | 1.21.1 |
| Language | TypeScript | ~5.3.3 |
| UI | React | 17.0.1 |
| Component library | Fluent UI v9 (`@fluentui/react-components`, `react-icons`) | ^9.74 |
| SharePoint/Graph data | PnPjs (`@pnp/sp`, `@pnp/graph`) + `SPHttpClient`/`AadHttpClient` | ^4.4 |
| Charts | Recharts | ^2.12 |
| Files / export | `papaparse` (CSV), `xlsx`, `jspdf` (PDF) | — |
| Barcodes | `jsbarcode`, `qrcode` | — |
| Dates | `date-fns` | ^3.6 |
| Node | `>=22 <23` | — |
| Tests | node `--test` unit suites + Playwright e2e | — |

Deployment surfaces: SharePoint pages, SharePoint full-page app, Teams channel tab,
Teams personal app, and native SharePoint list forms (form customizer).

---

## 3. Repository structure

```
<app>-spfx/
├── config/            SPFx build config, publisher.json, package-solution.json, app configs
├── scripts/           version sync, ship, verify, docs, marketing/AI prompts, brand compositing
├── teams/             Teams manifest + build-package.ps1
├── m365/              Unified Microsoft 365 manifest
├── assets/            brand/, store/listing/, website/{marketing,infographic,presentation}
├── docs/              architecture, user-guide, store-submission, presentation, this guide
└── src/
    ├── webparts/<app>/            main web part host + property pane
    ├── extensions/<formCustomizer>/  native list form customizer
    ├── components/                UI: Layout/shell, Dashboard, list views, Settings, Subscription, Onboarding, dialogs
    ├── services/                  one class per domain entity + platform services (REST, provisioning, subscription, email)
    ├── models/                    TypeScript interfaces (entities, list defs, settings, subscription)
    ├── contexts/                  React contexts (Subscription, etc.)
    ├── hooks/                     reusable hooks (useTranslation, useMailSendApproval, ...)
    ├── utils/                     rbac, formatting, caching, print theme, version
    ├── i18n/                      locale dictionaries + merge/format helpers
    └── constants/                 GUIDs, product identity, seed data, choices, field defs
```

**Naming convention:** SharePoint lists use a **domain prefix** (`AM_` for Asset
Management: `AM_Assets`, `AM_Assignments`, `AM_AuditLog`, …). Pick a new prefix per
app (e.g. `RM_` risk, `TB_` time & billing) — it namespaces lists in a shared site.

---

## 4. Core subsystems (how they work)

### 4.1 List provisioning + setup wizard
`src/models/IListDefinitions.ts` declares every list as an `IListDefinition`
(title, description, typed `fields[]`, optional `seedData`). `ListProvisioningService`
creates missing lists/fields idempotently on first run via the setup wizard. To make a
new app: replace the list-title constants, field definitions, and seed data; keep the
provisioning engine.

```ts
export interface IListFieldDefinition {
  internalName: string; displayName: string;
  type: 'Text'|'Note'|'Choice'|'DateTime'|'Lookup'|'User'|'UserMulti'|'Boolean'|'LookupMulti'|'Number'|'Currency';
  required?: boolean; choices?: string[]; lookupListTitle?: string; /* ... */
}
export interface IListDefinition {
  title: string; description: string;
  fields: IListFieldDefinition[]; seedData?: Record<string, string|number|boolean>[];
}
```

### 4.2 Settings framework
`src/components/Settings/settingsPageMeta.ts` drives a sectioned settings UI
(`general` / `preferences` / `lookups`). Each page = `{ id, label, description, icon,
section }`. `SETTINGS_SELF_SAVE_PAGES` and `SETTINGS_LOOKUP_PAGES` control behavior.
Add/remove pages here to match the domain. Settings persist to the `AppSettings` list.

### 4.3 RBAC
`RoleService` + `src/utils/rbac.ts` + the `AM_Roles`/`AM_UserRoles`/
`AM_RolePermissions`/`AM_Administrators` lists provide app-level roles on top of
SharePoint permissions (which remain the security boundary). Role choices/seed live in
`constants/rolePermissionsSeedData.ts`.

### 4.4 Internationalization
`src/i18n` holds typed dictionaries. Base locale files (`en.ts`, `es.ts`, `fr.ts`,
`de.ts`) are merged with optional extension files (`*.extra.ts`) via `mergeLocales`.
`getDictionary(locale)` / `translate(locale, section, key, fallback)` and the
`useTranslation()` hook are used across the UI.

- **Add a string:** extend `types.ts` + each locale (or the `*.extra.ts` files).
- **Add a language:** add `<locale>.ts` + `<locale>.extra.ts`, register in `index.ts`
  and the `AppLocale` union.

### 4.5 Subscription + free trial
`SubscriptionService` calls the hosted subscription API
(`DEFAULT_SUBSCRIPTION_API_URL = https://subscription.chronodat.com`) keyed by
`SUBSCRIPTION_PRODUCT_SLUG`. `SubscriptionContext` exposes trial/subscription status;
`SubscriptionTrialBanner` / `SubscriptionPaywall` gate the UI after the **14-day free
trial**. Licensing is **one per site collection**. For a new app just change the
product slug (and trial length if the API supports it). Set the API URL to `''` to
disable gating during development.

### 4.6 Email & notifications
Three delivery modes in `Settings → Email Integration`: **Microsoft Graph** (default,
`Mail.Send` from the signed-in mailbox), **Chronodat Mail API** (hosted), and
**Power Automate** (bring-your-own flow). `GraphEmailService` + `NotificationService`
handle templating and delivery; `useMailSendApproval` drives the admin consent panel.

### 4.7 External integrations (pattern)
`IntuneGraphService` / `IntuneSyncService` show the pattern for optional Graph-backed
integrations: declare the scope in `package-solution.json → webApiPermissionRequests`,
gate it behind a settings page, and keep the app fully functional without it.

### 4.8 Cross-cutting
Audit log (`AuditService` + `AM_AuditLog`), import/export (`ImportExportService`,
CSV/XLSX), report builder (`ReportBuilderService`), reminders (`ReminderRunnerService`),
depreciation (`DepreciationService`) — all reusable modules; keep or drop per domain.

---

## 5. Fork checklist — create a new app from this template

> Goal: a clean new product (e.g. **Risk Management Hub**) sharing the skeleton.

**Identity & GUIDs (must change)**
- [ ] Generate **new GUIDs** for solution, feature, web part, and form customizer
      (`config/package-solution.json` + the two `*.manifest.json` + `spfxComponents.ts`).
      Never reuse another product's GUIDs — they define the store upgrade path.
- [ ] `src/constants/spfxComponents.ts`: `DEFAULT_APP_TITLE`, `SUBSCRIPTION_PRODUCT_SLUG`,
      component ID constants, custom action name.
- [ ] `config/package-solution.json`: `solution.name`, `title`, `metadata`
      (short/long description), `webApiPermissionRequests`.
- [ ] `package.json`: `name`. Rename the `webparts/<app>` and `extensions/<...>` folders.
- [ ] `teams/manifest.json`, `m365/manifest.json`: ids, names, descriptions, icons.

**Domain layer (adapt)**
- [ ] Choose a new **list prefix** (`RM_`, `TB_`, …). Replace list-title constants,
      `IListDefinition`s, and seed data in `src/constants/*` + `IListDefinitions.ts`.
- [ ] Replace entity models (`src/models/I*.ts`) and services (`src/services/*Service.ts`)
      with the new domain's entities; keep platform services (REST, provisioning,
      subscription, email, audit, role).
- [ ] Trim `settingsPageMeta.ts` to the domain's settings/lookups.
- [ ] Update dashboard cards/charts and list views for the new entities.

**Brand & content**
- [ ] Replace `assets/brand/app-icon.png` (keep `chronodat-logo.png`). Run
      `npm run assets:icons`.
- [ ] Update i18n strings (`src/i18n/*`), navigation labels, and page titles.
- [ ] Regenerate marketing/infographic/presentation assets — set
      `config/presentation-brand.json` `product_name` + `app_icon`, then follow
      `docs/store-submission/README.md`.
- [ ] Write the store description from
      `docs/store-submission/partner-center-long-description.html` as a model.

**Verify**
- [ ] `npm run lint && npm test`
- [ ] `npm run verify:version && npm run verify:display-name && npm run verify:store`
- [ ] `npm run ship`

### Keep vs. change at a glance

| Keep (platform) | Change (product) |
|-----------------|------------------|
| Provisioning engine, settings framework, RBAC, i18n engine, subscription/trial, email, audit, import/export, report builder, build/ship/verify scripts, Fluent shell | GUIDs, product name + slug, list prefix + definitions, entity models/services, seed data, settings page list, dashboard/list views, brand icon, i18n strings, manifests, store description |

---

## 6. Build, ship & release pipeline (shared)

```bash
npm install
gulp serve                       # local dev (set skipSubscriptionCheck in serve.json)
npm run ship                     # sync versions + icons + Teams/M365 + bundle + package
npm run verify:version && npm run verify:display-name && npm run verify:store
```

Version is single-sourced in `config/package-solution.json` and propagated by
`scripts/sync-version.mjs` (run inside `ship`) to `package.json`, `appVersion.ts`, and
the Teams/M365 manifests. Bump **both** `solution.version` and the feature `version`.

---

## 7. Related generation docs

| Doc | Purpose |
|-----|---------|
| `docs/store-submission/README.md` | Generate all store artifacts (images, prompts, description, details) |
| `docs/store-submission/partner-center-long-description.html` | Store description model |
| `docs/presentation/image-generation-process.md` | AI slide + brand-compositing pipeline (config-driven, reusable) |
| `docs/microsoft-store-submission.md` | Upload checklist |

---

## 8. Gaps & recommendations to harden the template

These make the skeleton cleaner to fork. None block reuse today; they reduce manual
find-and-replace.

1. **Central app-identity config.** Introduce `config/app-identity.json`
   (`productName`, `productSlug`, `listPrefix`, `subscriptionApiUrl`, component GUIDs)
   and read it in `spfxComponents.ts` + a codegen step, instead of scattering constants.
2. **Scaffolding script.** Add `scripts/new-app-from-template.mjs` that clones the repo,
   swaps GUIDs, renames folders, applies the list prefix, and resets seed data.
3. **Domain-neutral folder names.** The `AM_`-prefixed and `asset*`/`risk*` names are
   product-specific; a template branch could use neutral names (`entityA`, `lookupX`)
   documented for search-replace.
4. **Extract a `@chronodat/spfx-core` layer.** Provisioning, settings, RBAC, i18n,
   subscription, and email are genuinely shared — publishing them as an internal package
   would let each app depend on a versioned core instead of copy-forking.
5. **List-definition-driven UI.** Generating basic list views/forms from
   `IListDefinition` metadata would cut per-app UI work.
6. **Config-driven subscription trial length** and pricing surfaced from one place.
7. **Template test seam.** A smoke suite that runs against the neutral definitions to
   confirm provisioning + settings + RBAC still pass after a fork.

> Recommended next step if you plan several apps: implement #1 (`app-identity.json`) and
> #2 (scaffolding script) first — they remove ~80% of the manual fork work.
