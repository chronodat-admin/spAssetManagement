# Store submission images (v2 — screenshot-blended)

Partner Center / AppSource store screenshots for **Asset Management Hub**, regenerated
with the two-step "real screenshot + composited brand" pipeline (the same approach used
for the presentation slides). Final images are exactly **1366×768** and under **1024 KB**,
which is the Partner Center screenshot spec.

## Why this folder is separate

These supersede the older AI-only marketing sheets in `assets/website/marketing/`.
They are kept in their own folder so the store-ready assets are unambiguous and the
older ones are left untouched.

## Files

| Final image (1366×768)                | Story                                              | Real screenshot blended in |
|---------------------------------------|----------------------------------------------------|----------------------------|
| `asset-management-dashboard.png`      | Portfolio visibility — dashboards, KPIs, charts    | `01-dashboard.png`         |
| `asset-management-feature-grid.png`   | Track assets, assignments, and operations          | `02-all-assets.png`        |
| `asset-management-governance.png`     | Governed lists with full audit log + admin control | `15-audit-log.png`         |
| `asset-management-analysis.png`       | Report builder, depreciation, CSV export           | `13-reports.png`, `14-depreciation.png` |
| `asset-management-all-features.png`   | Full feature map (all capabilities)                | (card map, no screenshot)  |
| `asset-management-surfaces.png`       | One hub across SharePoint, Teams, native forms     | `02-all-assets.png`, `05-assign-asset.png` |

`_raw/` holds the AI-generated base sheets (before branding). Do not upload these.

## The two-step pipeline

1. **AI base sheet** (`_raw/store-raw-*.png`): generated 16:9 with the real app
   screenshots blended into laptop/device frames, a reserved empty top 12% header band,
   and **no** brand marks drawn by the model.
2. **Brand composite** (`assets/store-submission/*.png`): a Python script overlays the
   real app icon, the "Asset Management Hub" wordmark (Segoe UI Semibold), and the real
   Chronodat logo into the reserved header band, then resizes to exactly 1366×768.

## Regenerate

```powershell
# Step 2 only (re-run brand composite over existing _raw sheets):
python scripts/embed-presentation-brand.py --config config/store-submission-brand.json
```

Step 1 (the AI base sheets) is produced with the image generator using the prompts
documented in `docs/presentation/image-generation-process.md`. To re-brand for a
different product, edit `config/store-submission-brand.json` (product name, icon, logo,
folders) — no code changes needed.

## Related

- `config/store-submission-brand.json` — brand + geometry + output size config
- `scripts/embed-presentation-brand.py` — the compositing script (config-driven, reusable)
- `docs/presentation/image-generation-process.md` — full pipeline reference
- `docs/store-submission/README.md` — master AppSource submission guide
