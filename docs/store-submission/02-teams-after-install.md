# Teams enrollment — Asset Management Hub

**This is not a separate Microsoft Store submission.**

Asset Management Hub is published as a **SharePoint solution** (`.sppkg`). Teams support is
included in the same package via SPFx hosts `TeamsTab` and `TeamsPersonalApp`. Customers
enable Teams **after** the SharePoint solution is installed.

---

## Why there is no second store offer

| Question | Answer |
| --- | --- |
| Submit a Teams-only app to AppSource? | **No** — SPFx cannot be listed on the Teams Store without the SharePoint solution path. |
| Submit two Partner Center offers (SharePoint + Teams)? | **No** — one `.sppkg`, one offer type **SharePoint solution**. |
| How do Teams users get the app? | Tenant admin **Sync to Teams** from the App Catalog, or users pin the personal app after sync. |

The web part manifest declares Teams hosts:

```json
"supportedHosts": ["SharePointWebPart", "SharePointFullPage", "TeamsTab", "TeamsPersonalApp"]
```

Teams artifacts in this repo:

- `teams/manifest.json` — personal app (`staticTabs`) + configurable channel tab
- `m365/manifest.json` — Microsoft 365 unified app metadata
- `teams/build-package.ps1` — builds `teams/TeamsSPFxApp.zip` for catalog sync
- `scripts/fix-sppkg-teams.ps1` — historical diagnostic script only; **do not run before App Catalog upload**

---

## Why "Sync to Teams" is greyed out

The button stays disabled until **all** of the following are true:

1. **Tenant App Catalog** — you are in the tenant-wide catalog, not a site collection catalog.
2. **Package is Teams-eligible** — web part declares `TeamsTab` / `TeamsPersonalApp`,
   `isDomainIsolated` is `false`, and `skipFeatureDeployment` is `true`.
3. **Teams package is included by the normal SPFx package step** — the proven package shape keeps
   `TeamsSPFxApp.zip` under `ClientSideAssets/TeamsSPFxApp.zip`. Do **not** move it to
   `teams/TeamsSPFxApp.zip` at the `.sppkg` root.
4. **Solution is deployed tenant-wide** — select the catalog entry, click **Deploy**, and confirm
   **Make this solution available to all sites in the organization**. **Sync to Teams** enables
   only after a successful deploy.

Verify the built package before upload:

```powershell
npm run verify:sppkg-teams
```

---

## "Failed to sync solution to Teams" (troubleshooting)

Microsoft often returns only a toast — **Failed to sync solution to Teams** — with no detail.
The SharePoint API call is usually `SyncSolutionToTeams` returning **400** or **500**.

### Proven fix for this repo

The working package is the normal SPFx-generated package, matching the Risk Management app's
build path:

1. Run `npm run ship`.
2. Do **not** run `npm run fix:sppkg-teams`.
3. Upload `sharepoint/solution/asset-management.sppkg`.
4. Deploy tenant-wide with **Make this solution available to all sites in the organization**.
5. Select the deployed package and click **Sync to Teams**.

The successful validation package was:

| Item | Value |
| --- | --- |
| Solution version | `1.0.0.23` |
| Teams manifest version | `1.0.23` |
| Teams app / solution id | `120fe796-4604-4ea0-81e8-d69ac485cbc9` |
| Teams package location inside `.sppkg` | `ClientSideAssets/TeamsSPFxApp.zip` |
| Graph scopes in store package | `Mail.Send` only |

What failed: post-processing the `.sppkg` to move `TeamsSPFxApp.zip` to
`teams/TeamsSPFxApp.zip` at the package root caused persistent
**Failed to sync solution to Teams** / `SyncSolutionToTeams` 500 errors in the App Catalog.
Leaving the package in the SPFx-generated shape synced successfully.

### Fix that works most often (delete + re-sync)

SharePoint **does not reliably overwrite** an existing Teams catalog entry. If you previously
synced (even a failed or partial sync), delete the app from Teams first:

1. Open **Microsoft Teams admin center** → **Teams apps** → **Manage apps**.
2. Search for **Asset Management Hub**.
3. Open the app → **Delete** (or remove from **Built for your org** / tenant catalog).
4. Also check **Teams** (client) → **Apps** → **Built for \<your tenant\>** — delete any copy there.
5. Back in the **SharePoint tenant App Catalog**, select the `.sppkg` entry → **Sync to Teams** again.

> This is [documented Microsoft behavior](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/using-web-part-as-ms-teams-tab) — not specific to this project.

### Before you sync — verify the uploaded package

Only packages built with `npm run ship` are valid. Then run:

```powershell
npm run verify:sppkg-teams
```

Must pass:

- `ClientSideAssets/TeamsSPFxApp.zip` exists in the `.sppkg`
- `teams/TeamsSPFxApp.zip` is **not** present at the `.sppkg` root
- Teams manifest version **3-part** semver (e.g. `1.0.19`, not `1.0.0.19`)
- `supportedHosts` includes `TeamsTab` and `TeamsPersonalApp`

Upload **`sharepoint/solution/asset-management.sppkg`**, then **Deploy** (tenant-wide), then **Sync to Teams**.

### Other common causes

| Cause | What to do |
| --- | --- |
| `.sppkg` was rewritten with `fix:sppkg-teams` | Rebuild with `npm run ship` only; upload the unmodified `.sppkg` |
| Previous auto-sync used web part id, custom zip uses solution id | Delete **all** Asset Management Hub entries in Teams admin, sync once |
| Same Teams manifest version already synced | Bump version (`npm run ship` after editing `package-solution.json`), re-upload, delete Teams app, sync |
| Package uploaded but not **Deployed** tenant-wide | Deploy with **Make available to all sites**, then sync |
| Site collection app catalog | Use the **tenant** App Catalog instead |
| Stale browser session | Hard refresh or InPrivate; check **F12 → Network** for `SyncSolutionToTeams` response body |

### Validate the Teams zip locally (optional)

Upload `teams/TeamsSPFxApp.zip` to the [Teams developer portal validator](https://dev.teams.microsoft.com/) (App package validator) to catch manifest issues (HTTPS URLs, version format, icon problems).

---

After `asset-management.sppkg` is deployed to the tenant App Catalog:

1. Open **SharePoint Admin Center** → **More features** → **Apps** → **Open** (App Catalog site).
2. Open **Apps for SharePoint** → select **Asset Management Hub**.
3. Click **Deploy** → enable **Make this solution available to all sites in the organization**.
4. After deploy completes, select the app again → click **Sync to Teams**.
5. Wait for sync to complete (typically a few minutes).

### What customers get in Teams

| Surface | Description |
| --- | --- |
| **Channel tab** | Add **Asset Management Hub** when configuring a channel tab; uses the team’s SharePoint site context. |
| **Personal app** | Users can pin Asset Management Hub in the Teams app bar (same SPFx experience, SharePoint-backed data). |

**Not available in Teams:** The **AM_Assets list form customizer** applies to native SharePoint list forms only, not Teams.

---

## Teams-specific UI layout

When hosted in Teams, the app detects the host via `context.sdks.microsoftTeams` and applies a
compact layout:

- Full viewport height (no SharePoint canvas letterboxing)
- SharePoint suite bar / page bar / left nav hiding disabled (Teams provides its own chrome)
- Compact content-header action layout (`isTeamsHost` forces content-actions mode)
- Teams-specific onboarding messaging in `DedicatedSubsiteWarning`

This matches the pattern used in [spfxRiskManagement](https://github.com/chronodat-admin/spfxRiskManagement).

---

## Teams validation checklist

- [ ] `skipFeatureDeployment: true` and `isDomainIsolated: false` in `package-solution.json`
- [ ] `npm run ship` completed and `npm run verify:sppkg-teams` passes
- [ ] Do **not** run `npm run fix:sppkg-teams` before App Catalog upload
- [ ] **Deploy** (tenant-wide) then **Sync to Teams** succeeds in test tenant
- [ ] Web part loads in **Teams desktop** and **Teams web**
- [ ] Compact Teams header layout visible (no duplicate app top bar)
- [ ] No hard-coded tenant or site URLs in `teams/manifest.json`
- [ ] Cold load under 10 seconds in Teams tab

Test hosts: Teams desktop app, [https://teams.microsoft.com](https://teams.microsoft.com).

---

## Quick reference

| Path | Artifact | Store? |
| --- | --- | --- |
| Public marketplace | `sharepoint/solution/asset-management.sppkg` | **Yes** — SharePoint solution offer |
| Teams for customers | Sync to Teams after catalog deploy | **Included** in same offer |
| Teams validation package | `teams/dist/asset-management-teams.zip` | Internal validation only |
| Form customizer | Same `.sppkg` | SharePoint lists only |

See also: [`01-sharepoint-marketplace-offer.md`](./01-sharepoint-marketplace-offer.md) (if present),
[`../microsoft-store-submission.md`](../microsoft-store-submission.md).
