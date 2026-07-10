# Asset Management Hub — Architecture infographic AI prompts (structured)

Generated from `scripts/amh_ai_prompts.py`. Save raw outputs to `assets/website/infographic/_raw/`.

```bash
npm run assets:infographic   # letterbox + embed Chronodat logo
```

## Shared suffix (append to every prompt)

```
Professional enterprise SaaS architecture infographic, 16:9 landscape (1600×900).
Soft light gray-teal gradient background #F8FAFC. Microsoft Fluent flat design.
Teal #008080 and blue #0078D4. White rounded cards with subtle shadows.
Label the product Asset Management Hub. Reference SharePoint Online and Microsoft Teams only.
Bottom-right ~24% × 11%: leave clear/empty for Chronodat logo compositing — no wordmark, no placeholder box.
Vector infographic quality, no people, no photos, ultra-sharp text.
```

### Negative prompt

```
Chronodat wordmark, logo, white logo box, logo border, M365, SPFx, Microsoft 365 badge,
blurry text, stock photos, cluttered layout, wrong product name
```

## §A1 — `architecture-overview.png`

**Headline:** Asset Management Hub — Architecture Overview

**Prompt:**

```
Professional B2B SaaS architecture infographic for Asset Management Hub.
Canvas: 1600×900 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Architecture overview
HEADLINE: Asset Management Hub — Architecture Overview

LAYOUT:
Hub-and-spoke diagram. Center dark navy card with teal border: Asset Management Hub, SharePoint Framework · React · Fluent UI. Seven white cards: SharePoint Online, Microsoft Teams, Native list forms, Tenant App Catalog, AM_* SharePoint lists, Microsoft Graph (blue), Chronodat Subscription API. Arrows in from top four; teal arrows out to data layer.

SUBTITLE:
One SharePoint-native package — data stays in your tenant.

LOGO ZONE:
Bottom-right corner empty for post-generation logo compositing.

BRAND / STYLE RULES:
Professional enterprise SaaS architecture infographic, 16:9 landscape (1600×900).
Soft light gray-teal gradient background #F8FAFC. Microsoft Fluent flat design.
Teal #008080 and blue #0078D4. White rounded cards with subtle shadows.
Label the product Asset Management Hub. Reference SharePoint Online and Microsoft Teams only.
Bottom-right ~24% × 11%: leave clear/empty for Chronodat logo compositing — no wordmark, no placeholder box.
Vector infographic quality, no people, no photos, ultra-sharp text.
```

## §A2 — `architecture-data-flow.png`

**Headline:** How Asset Management Hub data flows in your tenant

**Prompt:**

```
Professional B2B SaaS architecture infographic for Asset Management Hub.
Canvas: 1600×900 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Data flow
HEADLINE: How Asset Management Hub data flows in your tenant

LAYOUT:
Left-to-right flow: User actions (Assign, Return, Scan) → SPFx web part → SharePoint REST → AM_* lists (Assets, Assignments, Audit) → Reports export. Optional Graph Mail.Send branch for notifications.

LOGO ZONE:
Bottom-right empty.

BRAND / STYLE RULES:
Professional enterprise SaaS architecture infographic, 16:9 landscape (1600×900).
Soft light gray-teal gradient background #F8FAFC. Microsoft Fluent flat design.
Teal #008080 and blue #0078D4. White rounded cards with subtle shadows.
Label the product Asset Management Hub. Reference SharePoint Online and Microsoft Teams only.
Bottom-right ~24% × 11%: leave clear/empty for Chronodat logo compositing — no wordmark, no placeholder box.
Vector infographic quality, no people, no photos, ultra-sharp text.
```

## §A3 — `architecture-components.png`

**Headline:** Onboard, assign, return, and report

**Prompt:**

```
Professional B2B SaaS architecture infographic for Asset Management Hub.
Canvas: 1600×900 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: End-to-end workflows
HEADLINE: Onboard, assign, return, and report

LAYOUT:
Four-step horizontal journey with yellow-teal numbered circles: 1 Complete setup · 2 Register assets · 3 Assign custodians · 4 Run reports and audit. Small browser panels under each step showing relevant UI silhouettes.

LOGO ZONE:
Bottom-right empty.

BRAND / STYLE RULES:
Professional enterprise SaaS architecture infographic, 16:9 landscape (1600×900).
Soft light gray-teal gradient background #F8FAFC. Microsoft Fluent flat design.
Teal #008080 and blue #0078D4. White rounded cards with subtle shadows.
Label the product Asset Management Hub. Reference SharePoint Online and Microsoft Teams only.
Bottom-right ~24% × 11%: leave clear/empty for Chronodat logo compositing — no wordmark, no placeholder box.
Vector infographic quality, no people, no photos, ultra-sharp text.
```

## §A4 — `architecture-surfaces.png`

**Headline:** Asset Management Hub — Deploy Everywhere

**Prompt:**

```
Professional B2B SaaS architecture infographic for Asset Management Hub.
Canvas: 1600×900 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Deploy everywhere
HEADLINE: Asset Management Hub — Deploy Everywhere

LAYOUT:
Center hub circle Asset Management Hub with teal ring. Four corner cards with dashed connectors: SharePoint Pages, Teams Channel Tab, Teams Personal App, Native Assets List Form.

SUBTITLE:
One package — SharePoint pages, Teams, and native list forms.

LOGO ZONE:
Bottom-right empty.

BRAND / STYLE RULES:
Professional enterprise SaaS architecture infographic, 16:9 landscape (1600×900).
Soft light gray-teal gradient background #F8FAFC. Microsoft Fluent flat design.
Teal #008080 and blue #0078D4. White rounded cards with subtle shadows.
Label the product Asset Management Hub. Reference SharePoint Online and Microsoft Teams only.
Bottom-right ~24% × 11%: leave clear/empty for Chronodat logo compositing — no wordmark, no placeholder box.
Vector infographic quality, no people, no photos, ultra-sharp text.
```

## §A5 — `architecture-modules.png`

**Headline:** Asset Management Hub — Application Modules

**Prompt:**

```
Professional B2B SaaS architecture infographic for Asset Management Hub.
Canvas: 1600×900 landscape (16:9). Ultra-sharp, crisp anti-aliased text, no blur.

TITLE: Application modules
HEADLINE: Asset Management Hub — Application Modules

LAYOUT:
Three columns with teal top accent bars:
Assets — register, lifecycle views, licenses
Operations — assign, return, book, scan, inventory
Analysis & Admin — reports, audit log, settings, lookups
Full-width navy footer bar: Shared SharePoint list platform.

LOGO ZONE:
Bottom-right empty.

BRAND / STYLE RULES:
Professional enterprise SaaS architecture infographic, 16:9 landscape (1600×900).
Soft light gray-teal gradient background #F8FAFC. Microsoft Fluent flat design.
Teal #008080 and blue #0078D4. White rounded cards with subtle shadows.
Label the product Asset Management Hub. Reference SharePoint Online and Microsoft Teams only.
Bottom-right ~24% × 11%: leave clear/empty for Chronodat logo compositing — no wordmark, no placeholder box.
Vector infographic quality, no people, no photos, ultra-sharp text.
```
