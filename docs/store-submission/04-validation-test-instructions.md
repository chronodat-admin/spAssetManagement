# AppSource / Teams validation — test instructions

Use these steps when Microsoft validation reports **"Unable to test the highlighted
functionality"** for components declared in the store listing (policy 1170.1).

## Prerequisites

1. Upload and deploy `sharepoint/solution/asset-management.sppkg` tenant-wide.
2. Approve **Microsoft Graph `Mail.Send`** in SharePoint Admin Center → API access
   (optional for these tests).
3. Open the **Asset Management Hub** web part on a modern SharePoint page (or the
   **Asset-Management** full-page app) and complete **Settings → Setup** so lists
   (`AM_Assets`, `AM_Assignments`, `AM_AssetStatuses`, etc.) are provisioned.

---

## 1. Client-side web part + full-page app

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Add the **Asset Management Hub** web part to a modern team site page and publish | Dashboard loads with asset counts and navigation |
| 2 | Open **Operations → Assign Asset**, pick an available asset and assignee, submit | Asset status becomes **Assigned**; no SharePoint REST error |
| 3 | Open **Operations → Return Asset**, return the same asset | Status becomes **Available** |
| 4 | Open **Operations → Book Asset**, book an asset with expected return date | Booking row appears in **Booking Details** |
| 5 | Open **Operations → Scan Asset** | Camera preview or manual barcode field; search finds matching asset |
| 6 | Navigate via **breadcrumb (Home)** and the **hamburger menu** in Microsoft Teams | No persistent icon-only left rail beside Teams primary navigation |

**Full-page app:** Site contents → **Asset-Management** page (or
`SitePages/Asset-Management.aspx`) — same experience as the web part.

---

## 2. Form customizer extension (AM_Assets list forms)

The form customizer **only runs in SharePoint** when opening native list forms. It does
**not** appear inside Microsoft Teams tabs.

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Go to **Site contents → AM_Assets** | Assets list opens |
| 2 | Click **+ New** (or edit an existing item) | Custom form shows **Asset Management** heading and guidance text |
| 3 | Click **Open Asset Management** | Browser navigates to the Asset Management Hub page for full create/edit |

**Note:** After setup, the extension is registered automatically on `AM_Assets`. If the
native form still appears, re-run **Settings → Setup → Repair lists** as a site owner.

---

## 3. Microsoft Teams tab

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Sync the solution to Teams from the App Catalog | App appears in Teams app store / built for your org |
| 2 | Pin **Asset Management Hub** as a personal or channel tab | App loads inside Teams |
| 3 | Use the **hamburger (☰) button** in the page header to open navigation | Full-text menu drawer; sidebar is not a persistent icon rail |
| 4 | Use **Home / {page}** breadcrumbs to move between sections | In-app navigation without mimicking Teams left rail |

---

## 4. Quick demo video (optional)

Record a 2–3 minute walkthrough covering:

1. Dashboard overview
2. Assign → Return → Book (Operations)
3. Scan Asset (camera or manual code)
4. AM_Assets list → New item → form customizer → Open Asset Management

Attach the video link in Partner Center validation notes when resubmitting.
