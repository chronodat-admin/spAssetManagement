# Microsoft Store Submission Guide — Asset Management

**Version:** 1.0.0.12

## Pre-submission checklist (Asset Management)

- [ ] Set the real Partner Center MPN ID in `config/publisher.json`.
- [ ] Run `npm run sync:publisher`.
- [ ] Bump `version` in `config/package-solution.json` before each store upload (currently **1.0.0.12**).
- [ ] Run `npm run lint && npm test`.
- [ ] Run `npm run assets:icons && npm run assets:sppkg && npm run assets:marketing:crops`.
- [ ] Run `npm run verify:version && npm run verify:display-name && npm run verify:store`.
- [ ] Run `npm run ship`.
- [ ] Upload Partner Center **logo** from `assets/store/listing/logo-300x300.png`.
- [ ] Upload only screenshots from `assets/store/listing/screenshots/marketing`.

Current package version: **1.0.0.12** (update `config/package-solution.json` before each store upload).

`npm run assets:marketing:crops` can generate valid fallback Partner Center screenshots if polished marketing sheets are not present. Replace those generated images with final approved marketing artwork before submission when available.
