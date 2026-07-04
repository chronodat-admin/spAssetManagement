# Assets

Brand, store listing, architecture diagrams, and marketing images for Asset Management.

## Folders

- `brand/` — Source app icon and publisher logo
- `store/` — Partner Center listing screenshots and marketplace icon
- `website/` — Architecture SVGs/PNGs and marketing hero banners

## Scripts

```bash
npm run assets:sppkg          # 96×96 app-icon.png → sharepoint/ + teams/
npm run assets:architecture   # SVG → PNG + logo embed
npm run assets:marketing:all    # Marketing one-pagers + store crops
```

Requires Python Pillow: `pip install pillow`
