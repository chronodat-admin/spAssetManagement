# Video Production Guide (reusable)

End-to-end process for producing a narrated ~90-second product video **plus** a matching
YouTube-style thumbnail for any Chronodat app. This is the master guide; it ties together
the slide, thumbnail, voice, and assembly steps and lists exactly what to change to reuse
it for a different app.

The guiding principle throughout: **AI generates layout + blends real screenshots; a
Python step stamps the pixel-accurate brand marks (app icon, product name, Chronodat
logo).** AI cannot reproduce brand assets or wordmarks reliably, so anything brand-critical
is composited afterward.

---

## Pipeline at a glance

```
                 ┌────────────────────────── inputs ──────────────────────────┐
                 │ real screenshots (docs/user-guide/images/*.png)             │
                 │ brand assets (assets/brand/{app-icon,chronodat-logo}.png)   │
                 │ narration script (SEGMENTS in build-presentation-video.py)  │
                 └─────────────────────────────────────────────────────────────┘
   1. SLIDES        AI base slides (reserved header band)  ─┐
                    assets/website/presentation/_raw/*.png   │
   2. BRAND SLIDES  embed-presentation-brand.py  ────────────┼─►  *-ai.png (branded slides)
   3. THUMBNAIL     AI base thumb + embed-thumbnail-brand.py ┘    <app>-thumbnail.png
   4. VOICE+VIDEO   build-presentation-video.py (edge-tts neural voice + ffmpeg xfade)
                    └─►  video/<app>-90s.mp4
```

Each numbered step has a dedicated reference doc / script:

| Step | Script | npm | Deep-dive doc |
|------|--------|-----|---------------|
| 1–2 Slides | `scripts/embed-presentation-brand.py` | `npm run assets:presentation-brand` | [`image-generation-process.md`](./image-generation-process.md) |
| 3 Thumbnail | `scripts/embed-thumbnail-brand.py` | `npm run assets:presentation-thumbnail` | this doc |
| 4 Video | `scripts/build-presentation-video.py` | `npm run assets:presentation-video` | [`90-second-video-script.md`](./90-second-video-script.md) |

---

## One-time setup

```powershell
pip install pillow imageio-ffmpeg edge-tts truststore numpy
```

- **pillow** — image compositing (slides + thumbnail).
- **imageio-ffmpeg** — bundles an `ffmpeg` binary, so no separate install is needed.
- **edge-tts** — Microsoft neural voices (natural narration).
- **numpy** — synthesizes the royalty-free ambient music bed.
- **truststore** — lets Python use the OS certificate store; fixes the corporate-proxy
  SSL error edge-tts otherwise throws. If the neural voice still can't be reached, the
  build automatically falls back to the local Windows SAPI voice.

AI images are generated with Cursor's image generation (16:9), attaching the reference
screenshots listed in each prompt.

---

## Step 1–2 — Slides

Full details in [`image-generation-process.md`](./image-generation-process.md). In short:

1. Generate each slide 16:9 with the **real app screenshots blended into device/browser
   mockups**, a reserved empty **top 12% header band**, and **no** brand marks drawn.
   Save to `assets/website/presentation/_raw/pres-raw-*.png`.
2. Composite the real app icon + product wordmark (Segoe UI) + Chronodat logo:

```powershell
npm run assets:presentation-brand   # -> assets/website/presentation/presentation-slide-*-ai.png
```

Config: `config/presentation-brand.json` (+ `presentation-brand.template.json`).

---

## Step 3 — Thumbnail

A single hero image styled like a YouTube/AppSource demo card: dark navy tech background,
the **app logo** in the top-left corner, a big product title with an orange underline, a
one-line tagline, a row of four feature icons, and the app's real dashboard inside a
browser frame, with the Chronodat logo bottom-right.

**3a. Generate the AI base** (Cursor image generation, 16:9), attaching:
- a **reference thumbnail** for the exact style, and
- the app's **real dashboard screenshot** (crop the top ~1180 px for a clean framing).

Prompt requirements:
- Reproduce the attached dashboard screenshot faithfully inside the browser window.
- Render the title, tagline, and feature row.
- **Leave two reserved empty zones**: top-left for the app logo, and bottom-right for the
  Chronodat logo.
- Do **not** draw any app icon, product logo tile, or `CHRONODAT` wordmark.

> Anything unwanted that the AI still bakes in (e.g. a stray "DEMO" badge) can be painted
> out via `cover_boxes` in the config — it copies a clean nearby patch of background over
> the region, no AI regeneration needed.

Save to `assets/website/presentation/_raw/thumb-raw-<app>.png`.

**3b. Composite the real brand marks:**

```powershell
npm run assets:presentation-thumbnail   # -> assets/website/presentation/<app>-thumbnail.png
```

`scripts/embed-thumbnail-brand.py` stamps the real app icon (top-left) and the real
Chronodat logo (bottom-right, auto-tinted white with a soft scrim), then exports at exactly
1280×720. All placement is config-driven in `config/thumbnail-brand.json`
(+ `thumbnail-brand.template.json`):

| Key | Meaning |
|-----|---------|
| `raw` / `out` | base thumbnail in, final thumbnail out |
| `output_size` | final `[w, h]` (1280×720 for 16:9 video) |
| `cover_boxes` | optional; paint out baked-in elements by copying a clean background patch |
| `logo_tint` | recolor a dark logo to this RGB (keeps alpha) so it reads on dark |
| `icon.cx_ratio` / `cy_ratio` / `height_ratio` | app icon center + size (fractions of W/H) |
| `logo.cx_ratio` / `cy_ratio` / `height_ratio` | logo center + size |
| `logo.scrim*` | soft dark pill behind the logo for legibility |

Tweak the ratios and re-run (instant) until the icon/logo sit exactly where the AI base
left room.

---

## Step 4 — Voice + video assembly

Full details in [`90-second-video-script.md`](./90-second-video-script.md).

```powershell
npm run assets:presentation-video     # -> assets/website/presentation/video/<app>-90s.mp4
```

`scripts/build-presentation-video.py`:
- Reads the ordered `SEGMENTS` (slide + narration text + minimum duration).
- Narrates each segment with a **natural neural voice** (`en-US-JennyNeural` by default).
- **Never time-stretches the voice** — each slide expands to fit its natural narration
  (with a short lead-in and tail), so nothing sounds sped-up.
- Cross-dissolves video **and** cross-fades audio together (0.7 s) so A/V stays in sync.
- Lays a **soft ambient music bed** (synthesized locally with numpy — royalty-free) that
  automatically **ducks** under the voice via sidechain compression.

Options:

```powershell
python scripts/build-presentation-video.py --voice en-US-GuyNeural   # different narrator
python scripts/build-presentation-video.py --music-volume 0.3        # louder music bed
python scripts/build-presentation-video.py --no-music                # no music
python scripts/build-presentation-video.py --skip-tts                # silent (slides only)
```

Good voices: `en-US-JennyNeural`, `en-US-AriaNeural`, `en-US-GuyNeural`,
`en-US-AndrewMultilingualNeural`.

---

## Reuse for another app — fork checklist

Everything app-specific lives in **brand assets + config + script text**. No core logic
changes are needed.

1. **Brand assets** — replace in `assets/brand/`:
   - `app-icon.png` (square app tile)
   - `chronodat-logo.png` (company logo; dark art is fine — it gets tinted for dark bg)
2. **Screenshots** — put the new app's captures in `docs/user-guide/images/` and reference
   them in the slide/thumbnail prompts.
3. **Slide config** — edit `config/presentation-brand.json`: `product_name`, in/out dirs,
   `title_slides`, colors.
4. **Thumbnail config** — edit `config/thumbnail-brand.json`: `raw`/`out` paths, and the
   icon/logo placement ratios to match your AI base.
5. **Script + narration** — edit `SEGMENTS` in `scripts/build-presentation-video.py`:
   each entry's `slide`, `text`, and minimum `duration`. Keep the flow continuous
   (welcome → hook/problem → product reveal → features → CTA → thank-you).
6. **Product naming / platform** — always use the full product name (e.g.
   "Asset Management Hub"), and reference **SharePoint Online + Microsoft Teams** (not
   "Microsoft 365" or SPFx).
7. **Regenerate** in order:

```powershell
# after saving AI base slides + AI base thumbnail into _raw/
npm run assets:presentation-brand
npm run assets:presentation-thumbnail
npm run assets:presentation-video
```

---

## Output files (this app)

| Asset | Path |
|-------|------|
| Branded slides | `assets/website/presentation/presentation-slide-*-ai.png` |
| Thumbnail | `assets/website/presentation/asset-management-hub-thumbnail.png` |
| Video | `assets/website/presentation/video/asset-management-hub-90s.mp4` |
| AI bases (not shipped) | `assets/website/presentation/_raw/` |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| edge-tts `CERTIFICATE_VERIFY_FAILED` | ensure `truststore` is installed (the build injects it automatically); otherwise it falls back to the Windows SAPI voice |
| Voice sounds sped-up / robotic | you're on an old build — current script expands slide time to fit natural narration instead of compressing audio |
| `ffmpeg not found` | `imageio-ffmpeg` provides the binary; reinstall it (`pip install imageio-ffmpeg`) |
| Thumbnail icon/logo misaligned | adjust `icon.*`/`logo.*` ratios in `config/thumbnail-brand.json` and re-run (no AI regen needed) |
| Logo invisible on dark bg | set `logo_tint` to `[255,255,255]` and enable `logo.scrim` |
| Video too long | shorten the `text` in `SEGMENTS` (don't compress audio) |

---

## Related files

- `scripts/embed-presentation-brand.py` — slide brand compositor (config-driven)
- `scripts/embed-thumbnail-brand.py` — thumbnail brand compositor (config-driven)
- `scripts/build-presentation-video.py` — voice + video assembly
- `config/presentation-brand.json`, `config/thumbnail-brand.json` (+ `*.template.json`)
- `docs/presentation/image-generation-process.md` — slide pipeline deep-dive
- `docs/presentation/90-second-video-script.md` — narration script + timing
