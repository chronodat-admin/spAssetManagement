# Teams + Store Hardening Playbook (reusable across Chronodat apps)

This playbook captures every fix applied to **Asset Management Hub** to make the
package **AppSource / store ready** and to get **SharePoint App Catalog → Sync to
Teams** working reliably. Follow it in order for any other Chronodat SPFx app
(Risk & Compliance, People Hub, Service Desk, etc.).

Placeholders: replace `<app>` with the app short name (e.g. `asset-management`) and
`<App Display Name>` with the product title (e.g. `Asset Management Hub`).

---

## 0. TL;DR — the one that actually blocked Sync to Teams

**Do NOT post-process the `.sppkg` to move `TeamsSPFxApp.zip` to the package root.**

- The `gulp package-solution` output places the custom Teams package at
  `ClientSideAssets/TeamsSPFxApp.zip`. **Leave it there.**
- A "helper" step (`fix:sppkg-teams`) that rewrote the `.sppkg` to put
  `teams/TeamsSPFxApp.zip` at the OPC root caused a persistent
  **"Failed to sync solution to Teams"** / `SyncSolutionToTeams` **500** in the
  tenant App Catalog.
- Removing that rewrite step from `npm run ship` (matching the Risk & Compliance
  build path) made **Sync to Teams succeed**.

Everything else below is real hardening, but this was the blocker.

---

## 1. Ship pipeline: keep the SPFx-native package shape

In `package.json`, the `ship` script must **end at `gulp package-solution --ship`**.
Do not chain a `.sppkg` rewrite afterward.

```jsonc
// package.json → scripts
"ship": "node scripts/sync-publisher-manifests.mjs && node scripts/sync-version.mjs && npm run assets:icons && npm run teams:package:m365 && npm run assets:sppkg && node scripts/clean-release.mjs && gulp bundle --ship && gulp package-solution --ship"
```

- Keep `scripts/fix-sppkg-teams.ps1` in the repo for history/diagnostics, but **never
  wire it into `ship`** and **never run it before uploading**.
- The correct package contains `ClientSideAssets/TeamsSPFxApp.zip` and has **no**
  `teams/TeamsSPFxApp.zip` at the root.

### Verifier

`scripts/verify-sppkg-teams.mjs` enforces the correct shape. Run after every ship:

```powershell
npm run verify:sppkg-teams
```

It must confirm:
- `ClientSideAssets/TeamsSPFxApp.zip` **present**
- root `teams/TeamsSPFxApp.zip` **absent**
- Teams manifest version is 3-part (e.g. `1.0.24`, not `1.0.0.24`)
- Teams manifest `id` == solution `id`
- `contentUrl` references the web part component id
- `isDomainIsolated: false`, `skipFeatureDeployment: true`

---

## 2. Minimize Microsoft Graph permissions in the store package

High-privilege admin-consent scopes can leave the catalog package in a pending
API-access state and contribute to Sync/consent failures. Keep the store package
narrow.

- **Asset Management Hub:** reduced `webApiPermissionRequests` to **`Mail.Send` only**;
  removed `User.Read` and `DeviceManagementManagedDevices.Read.All`.
- Rule of thumb: only request scopes the default experience truly needs. Gate
  optional integrations (e.g. Intune device import needing
  `DeviceManagementManagedDevices.Read.All`) behind separate tenant planning, not the
  default package.

`config/package-solution.json`:

```jsonc
"webApiPermissionRequests": [
  { "resource": "Microsoft Graph", "scope": "Mail.Send" }
]
```

Verify in the built package (`AppManifest.xml`) that only the intended scopes appear.

---

## 3. When Sync still 500s after a clean package: fresh app identity

Only needed if a specific tenant's catalog entry is corrupted (500 survives a full
purge). Assign a brand-new identity so Teams treats it as a new app.

1. Generate a new GUID (`python -c "import uuid; print(uuid.uuid4())"`).
2. Replace the **solution id** consistently in every file:
   - `config/package-solution.json` → `solution.id`
   - `teams/manifest.json` → `id`
   - `m365/manifest.json` → `id`
   - web part manifest `preconfiguredEntries[0].groupId` (Chronodat convention)
   - `config/serve.json.example`, `README.md`, `docs/store-submission/README.md`
3. Keep component ids (web part / feature / form customizer) stable unless you must
   fully reset — changing them breaks existing page instances.
4. `teams/manifest.json` `id` **must equal** `package-solution.json` `solution.id`.

> Asset Management Hub new id: `120fe796-4604-4ea0-81e8-d69ac485cbc9`.

If a tenant's Sync is genuinely stuck, purge first: Teams Admin Center → Manage apps
delete; App Catalog delete; **empty both recycle bins**; wait 15–30 min; re-upload.

---

## 4. Teams icons (color + outline)

Requirements enforced by Teams / AppSource:
- `teams/color.png` — **192×192** RGBA
- `teams/outline.png` — **32×32**, transparent, **white glyph**

Fix applied: the outline glyph was too small/top-aligned and rendered as a tiny mark
in the Teams "Outline icon" preview. `scripts/generate-app-icons.py` now draws a
**larger, centered** white glyph filling most of the 32×32 canvas.

- Icons regenerate from the single branded source via `npm run assets:icons`.
- Re-run `npm run teams:package:m365` and `npm run ship` after icon changes.
- Sanity check dimensions/transparency:

```powershell
python -c "from PIL import Image; [print(p, Image.open(p).size, Image.open(p).mode) for p in ['teams/color.png','teams/outline.png']]"
```

---

## 5. First-load rendering in Teams (unstyled/bad font)

Symptom: in a Teams tab **edit mode**, the web part first rendered with fallback
fonts/unstyled; after interacting with the property pane it looked correct.

Cause: the edit-mode placeholder rendered **outside** the app's Fluent theme
provider.

Fix: wrap the edit-mode placeholder in the same `AppearanceThemeProvider` used by the
rest of the app so the first render gets the correct Fluent theme, fonts, and CSS
variables. In `src/webparts/<app>/components/<App>.tsx`:

```tsx
if (displayMode === DisplayMode.Edit) {
  return (
    <AppearanceThemeProvider settings={settings} webUrl={webUrl} isTeamsHost={isTeamsHost}>
      <EditModePlaceholder isTeamsHost={isTeamsHost} />
    </AppearanceThemeProvider>
  );
}
```

General rule: **every early-return branch** (loading, paywall, onboarding, edit
placeholder, errors) should be wrapped in the theme provider so no state renders
unstyled.

---

## 6. Publisher / developer name

Use the legal entity **`Chronodat LLC`** (not `Chronodat`) so the Teams "Built for
your org" listing matches the other Chronodat apps.

Single source of truth: `config/publisher.json` → `name`. Then:

```powershell
npm run sync:publisher   # writes package-solution.json, teams/manifest.json, m365/manifest.json
```

---

## 7. Tagline / short description

Positioning is **SharePoint + Teams**, not Teams-only or "Microsoft 365" generic.

- Standard short description: **`Asset management for SharePoint and Teams`**
  (adapt the noun per app, e.g. `Risk and compliance for SharePoint and Teams`).
- Apply consistently to:
  - `teams/manifest.json` → `description.short`
  - `m365/manifest.json` → `description.short`
  - `config/package-solution.json` → `metadata.shortDescription.default`

---

## 8. Version bump discipline

- Bump `config/package-solution.json` `solution.version` **and** the feature
  `version` (4-part, e.g. `1.0.0.24`) before every catalog upload.
- `sync-version.mjs` maps the 4-part SPFx version to the 3-part Teams/M365 manifest
  version (`major.minor.build`, e.g. `1.0.24`) — the first segment must not be `0`.
- Bump even for "same content, new upload" so the App Catalog/Teams cache doesn't
  serve a stale package after a failed attempt.

---

## 9. Reusable order of operations for a new app

1. `config/publisher.json` → set `name: "Chronodat LLC"`.
2. Confirm `webApiPermissionRequests` is minimal (usually just `Mail.Send`).
3. Set short descriptions to `<Domain> for SharePoint and Teams`.
4. Ensure `package.json` `ship` ends at `gulp package-solution --ship` (no
   `.sppkg` rewrite).
5. Ensure `generate-app-icons.py` produces a large centered 32×32 white outline.
6. Wrap all early-return render branches in the theme provider.
7. Bump versions.
8. `npm run ship` → `npm run verify:sppkg-teams` (must pass).
9. Upload `sharepoint/solution/<app>.sppkg` → **Deploy** tenant-wide → **Sync to
   Teams** (do **not** run `fix:sppkg-teams`).
10. If a tenant's Sync is stuck: purge (catalog + both recycle bins + Teams admin),
    wait, retry; only then assign a fresh solution id (§3).

---

## 10. Applied results for Asset Management Hub (reference)

| Item | Value |
|------|-------|
| Solution / Teams app id | `120fe796-4604-4ea0-81e8-d69ac485cbc9` |
| Package version | `1.0.0.24` (Teams `1.0.24`) |
| Publisher | `Chronodat LLC` |
| Short description | `Asset management for SharePoint and Teams` |
| Graph scopes | `Mail.Send` only |
| Teams package location | `ClientSideAssets/TeamsSPFxApp.zip` (SPFx-native) |
| Sync to Teams | **Success** |

See also: [`02-teams-after-install.md`](./02-teams-after-install.md),
[`README.md`](./README.md), [`../chronodat-app-template.md`](../chronodat-app-template.md).
