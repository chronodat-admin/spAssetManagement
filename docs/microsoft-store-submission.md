# Microsoft Store Submission Guide — Asset Management Hub

**Version:** 1.0.0.18

> For how every submission artifact (images, AI prompts, store description, component
> and permission details, icons, screenshots, version metadata) is generated, see
> [`store-submission/README.md`](./store-submission/README.md).

## Marketing image guidelines (Partner Center)

- **Product name in all store/marketing artwork:** **Asset Management Hub** (consistent spelling and casing).
- **App icon:** use `assets/brand/app-icon.png` (same asset as `assets/store/listing/logo-300x300.png` source).
- **Chronodat logo:** `assets/brand/chronodat-logo.png` — header top-right on marketing sheets only; composited via `embed-marketing-chronodat-logo.py`.
- **Platform references in images:** **SharePoint Online** and **Microsoft Teams** only. Do not show Microsoft 365, M365, or SPFx badges in store screenshots.
- **Screenshot specs:** 1366×768 PNG, ≤ 1024 KB each — upload from `assets/store/listing/screenshots/marketing/`.
- **Do not upload** 1536×1024 `*-ai.png` masters from `assets/website/marketing/`.

## Pre-submission checklist

- [ ] Set the real Partner Center MPN ID in `config/publisher.json`.
- [ ] Run `npm run sync:publisher`.
- [ ] Bump `version` in `config/package-solution.json` before each store upload (currently **1.0.0.30**).
- [ ] Run `npm run lint && npm test`.
- [ ] Run `npm run assets:icons && npm run assets:sppkg && npm run assets:marketing:crops`.
- [ ] Run `npm run verify:version && npm run verify:display-name && npm run verify:store`.
- [ ] Run `npm run ship`.
- [ ] Upload Partner Center **logo** from `assets/store/listing/logo-300x300.png`.
- [ ] Upload only screenshots from `assets/store/listing/screenshots/marketing`.

Current package version: **1.0.0.30** (update `config/package-solution.json` before each store upload).

`npm run assets:marketing:crops` can generate valid fallback Partner Center screenshots if polished marketing sheets are not present. Replace those generated images with final approved marketing artwork before submission when available.
