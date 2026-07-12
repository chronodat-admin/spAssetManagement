# Partner Center & Stripe Setup — Paste-Ready Text

Copy-paste reference for **Asset Management Hub** marketplace submission and Stripe
product configuration. Package version at time of writing: **1.0.0.30**.

---

## Partner Center — Search & classification

### Search keywords (max 3)

1. asset management
2. IT asset tracking
3. SharePoint asset management

### Categories (max 3)

- IT/admin
- Productivity
- Workflow & Process Management

### Industries (max 2)

- Professional Services
- Education

Check **Apps** under *Is your offer applicable to*.

### Search results summary (max 100 characters)

```
Asset management for SharePoint and Teams - track hardware, software, assignments, and licenses.
```

(93 characters)

---

## Partner Center — Notes for certification

Paste into **Review and publish → Notes for certification**. Put real test account
passwords in Partner Center **secure notes** or an **Additional certification info** PDF.

```
TEST SITE: https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx
PACKAGE: asset-management.sppkg v1.0.0.30

ACCOUNTS (credentials in secure submission notes):
1) SharePoint/tenant admin - deploy .sppkg tenant-wide, approve Graph Mail.Send, Sync to Teams
2) Site owner - add web part to modern page, run setup wizard
3) Member - test asset CRUD, assignments, lookup lists

DEPLOY:
1. Upload asset-management.sppkg to tenant App Catalog and Deploy
2. SharePoint Admin Center > Advanced > API access > Approve Microsoft Graph Mail.Send
3. Add Asset Management Hub web part to a modern page; complete setup wizard

CORE TESTS (no extra services):
- Dashboard KPIs and charts
- All Assets: create, view, edit, delete
- Assign/Return asset; Bookings; Asset requests
- Lookup lists: Categories, Sub-Categories, Vendors, Locations, Projects
- Reports/CSV export; Settings tabs; AM_Assets form customizer

OPTIONAL:
- Teams: App Catalog > Sync to Teams; open personal app or channel tab
- Email: Settings > Email Integration (Graph mode); assign asset to mailbox user
- Intune import is optional and NOT in package permissions

LICENSING: 14-day trial per site collection. Support: https://www.chronodat.com/wiki/asset-management-hub
```

---

## Partner Center — API justification (Mail.Send)

Only `Mail.Send` is declared in `config/package-solution.json` →
`webApiPermissionRequests`.

```
Microsoft Graph Mail.Send is the only API permission in the package (config/package-solution.json). It sends workflow email notifications (assignment acknowledgements, reminders, and related alerts) from the signed-in user mailbox via tenant-resident Microsoft Graph. Mail is optional: Settings > Email Integration also supports Chronodat Mail API or customer Power Automate flows without Mail.Send. Tenant admin approves Mail.Send once in SharePoint Admin Center > API access. No other Graph scopes are requested; Intune device import is optional and excluded from the store package.
```

Short version (248 characters) if a tighter field appears:

```
Mail.Send sends optional workflow emails (assignments, reminders) from the signed-in user mailbox via Microsoft Graph. Tenant admin approves once in SharePoint Admin Center > API access. No other Graph scopes are in the package; Intune is excluded.
```

---

## Stripe — Product setup

Subscription is **one license per SharePoint site collection**, **$999 USD/year**,
**unlimited users** in the licensed site. Product slug in the SPFx app:
`asset-management` (`src/constants/spfxComponents.ts`).

### Product name

```
Asset Management Hub — Annual Site License
```

### Product description

```
Annual subscription for Asset Management Hub on one SharePoint Online site collection. Track hardware, software licenses, assignments, bookings, maintenance, depreciation, and reports in SharePoint and Microsoft Teams. Includes unlimited users in the licensed site collection. All asset data stays in your Microsoft 365 tenant. Includes a 14-day free trial. Sold by Chronodat.
```

### Short description

```
Annual license for one SharePoint site collection. Unlimited users. 14-day free trial. Asset tracking in SharePoint and Teams; data stays in your Microsoft 365 tenant.
```

### Suggested Stripe fields

| Field | Value |
|-------|-------|
| Metadata | `productSlug: asset-management` |
| Billing | Recurring, yearly |
| Price | $999.00 USD / year |
| Price nickname | `Asset Management Hub Annual` |
| Statement descriptor | `CHRONODAT AMH` (max 22 chars) |

### Price description (invoices / receipts)

```
Covers one SharePoint site collection for 12 months. Renews annually until canceled. Manage billing in the app under Settings → Subscription.
```

### Internal note (Stripe Dashboard only)

```
SPFx app: Asset Management Hub. Subscription API: subscription.chronodat.com. Checkout via POST /api/subscription/checkout. One license gates one site URL. Trial is started by the subscription API on first status check (14 days); Stripe trial period is optional depending on API integration.
```

---

## Related docs

- [`partner-center-long-description.html`](./partner-center-long-description.html) — store HTML description
- [`03-teams-and-store-hardening-playbook.md`](./03-teams-and-store-hardening-playbook.md) — package hardening
- [`../microsoft-store-submission.md`](../microsoft-store-submission.md) — pre-submission checklist
