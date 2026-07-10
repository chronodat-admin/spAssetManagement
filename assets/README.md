# Assets

Brand, store listing, architecture diagrams, and marketing images for Asset Management.

## Folders

- `brand/` — Source app icon and publisher logo
- `store/` — Partner Center logo and listing screenshots
- `website/` — Architecture SVGs/PNGs and marketing hero banners

## Scripts

```bash
npm run assets:icons          # All surfaces from assets/app-icon-source-v2.png
npm run assets:sppkg          # Refreshes icons + sharepoint/app-icon.png for .sppkg
npm run assets:architecture   # SVG → PNG + logo embed
npm run assets:marketing:all    # Marketing one-pagers + store crops
```

Requires Python Pillow: `pip install pillow`
