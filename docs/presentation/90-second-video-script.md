# Asset Management Hub — 90-Second Video Script

**Runtime:** 1:30 (90 seconds)  
**Pace:** ~140 words/minute (conversational, confident)  
**Word count:** ~210 words  
**Slides:** AI-generated infographics — prompts in `assets/website/presentation/PROMPTS.md`; full pipeline in `docs/presentation/image-generation-process.md`  
**End-to-end (reusable) process:** [`docs/presentation/video-production-guide.md`](./video-production-guide.md) — slides + thumbnail + voice + assembly, and how to reuse it for another app

---

## Production notes

| Item | Guidance |
|------|----------|
| Format | 1920×1080, 16:9, 30 fps |
| Music | Light corporate underscore; duck −12 dB under voice |
| Voice | Clear, warm B2B narrator (male or female) |
| Transitions | 0.4 s cross-dissolve between slides |
| Logo | Composit Chronodat wordmark after AI generation (`embed-marketing-chronodat-logo.py`) |
| Product name | Always **Asset Management Hub** (never "Asset Management" alone) |
| Platforms | **SharePoint Online** and **Microsoft Teams** only |

### Slide files (generate with AI prompts)

The assembled video uses eight segments (welcome + thank-you bookends), matching the
build order in `scripts/build-presentation-video.py`. The durations below are **minimum
floors** — each slide automatically expands to fit its natural narration so the voice is
never sped up:

| # | File | Min duration |
|---|------|--------------|
| 1 | `presentation-slide-00-welcome-ai.png` | 5 s |
| 2 | `presentation-slide-01-hook-ai.png` | 12 s |
| 3 | `presentation-slide-02-intro-ai.png` | 3 s (visual only) |
| 4 | `presentation-slide-03-dashboard-ai.png` | 15 s |
| 5 | `presentation-slide-04-operations-ai.png` | 15 s |
| 6 | `presentation-slide-05-governance-ai.png` | 15 s |
| 7 | `presentation-slide-06-cta-ai.png` | 24 s |
| 8 | `presentation-slide-07-thankyou-ai.png` | 8 s |

Actual runtime is ~110 s with 0.4 s cross-dissolves (video and narration are cross-faded
together so they stay in sync). To hit a tighter runtime, shorten the narration text in
`SEGMENTS` rather than compressing the audio.

---

## Full narration script

### Segment 0 — Welcome

**Slide:** V0 (`presentation-slide-00-welcome-ai.png`)

**Narration:**

> Welcome to **Asset Management Hub**.

**Direction:** Title card. App icon + product name center frame; hold briefly, then dissolve into the hook.

---

### Segment 1 — Hook (the problem)

**Slide:** V1 (`presentation-slide-01-hook-ai.png`)

**On-screen text:**  
`Stop tracking assets in spreadsheets`

**Narration:**

> But first, let's talk about the problem. If your organization still tracks equipment in scattered spreadsheets, you already know the pain. Laptops go missing, software licenses lapse, and no one can say exactly who has what. There's a better way — one that lives right inside the tools your team uses every day.

**Direction:** Open on pain-point icons (left). Build tension on "no one can say who has what," then lift on "a better way" to bridge into the product reveal.

---

### Segment 2 — Intro (the product reveal)

**Slide:** V2 (`presentation-slide-02-intro-ai.png`)

**On-screen text:**  
`Built natively on SharePoint and Teams`

**Narration:**

> So meet **Asset Management Hub** — a complete hardware and software asset register, built natively on **SharePoint Online** and **Microsoft Teams**. One hub. Your tenant. Your data.

**Direction:** Product hero with app icon center frame. Reveal "SharePoint" and "Teams" wordmarks as they're spoken; land on "Your data" before the dashboard.

---

### Segment 3 — Dashboard & register

**Slide:** V3 (`presentation-slide-03-dashboard-ai.png`)

**On-screen text:**  
`See your entire portfolio at a glance`

**Narration:**

> Open the dashboard and see your entire portfolio at a glance — total assets, assignments, availability, and status charts. Register hardware and software licenses in governed SharePoint lists your IT team already trusts.

**Direction:** Ken Burns slow zoom on laptop mockup (dashboard KPI cards). Highlight KPI numbers as narrator mentions them.

---

### Segment 4 — Operations

**Slide:** V4 (`presentation-slide-04-operations-ai.png`)

**On-screen text:**  
`Assign · Return · Book · Request · Scan`

**Narration:**

> Assign assets to people. Process returns. Book shared equipment. Scan barcodes on mobile. Run inventory counts. Every action updates the register instantly — no manual spreadsheets.

**Direction:** Animate workflow steps 1→5 left to right (0.3 s stagger). Pulse scan/tablet panel on "Scan barcodes."

---

### Segment 5 — Reporting & governance

**Slide:** V5 (`presentation-slide-05-governance-ai.png`)

**On-screen text:**  
`Reports · Depreciation · Audit trail`

**Narration:**

> Build custom reports and export to CSV. Track depreciation schedules. Review a full audit log of every change. Administrators control categories, locations, vendors, and roles from one settings hub.

**Direction:** Reveal three cards sequentially. Navy header "Governance you can prove" fades in at 0:47.

---

### Segment 6 — Deploy & call to action

**Slide:** V6 (`presentation-slide-06-cta-ai.png`)

**On-screen text:**  
`SharePoint pages · Teams tabs · Native list forms`  
`Start your 14-day free trial`

**Narration:**

> Deploy on SharePoint pages, Teams channel tabs, personal apps, and native list forms. Employees use the same experience whether they're in the browser or inside Teams. Your data stays in your tenant. One license per site collection — no per-seat fees. Start your **14-day free trial** today.

**Direction:** Three device frames slide in from right; teal checkmarks on trust bullets. Land on the trial line.

---

### Segment 7 — Thank you

**Slide:** V7 (`presentation-slide-07-thankyou-ai.png`)

**Narration:**

> Thank you for watching. **Asset Management Hub** — hardware and software tracking for SharePoint and Teams. Get started today.

**Direction:** Hold final frame ~3 seconds. Fade music out last 2 seconds. App icon + product name end card.

---

## B-roll suggestions (optional overlays)

| Timestamp | Overlay |
|-----------|---------|
| 0:18 | `docs/user-guide/images/01-dashboard.png` |
| 0:32 | `docs/user-guide/images/05-assign-asset.png` |
| 0:38 | `docs/user-guide/images/09-scan-asset.png` |
| 0:48 | `docs/user-guide/images/13-reports.png` |
| 0:52 | `docs/user-guide/images/15-audit-log.png` |
| 1:05 | `docs/user-guide/images/02-all-assets.png` in Teams frame |

---

## Generate slide images

```bash
# Print all presentation prompts
python scripts/print-amh-prompts.py --presentation

# Or one slide at a time
python scripts/print-amh-prompts.py --sheet hook
python scripts/print-amh-prompts.py --sheet cta

# Export PROMPTS.md
python scripts/print-amh-prompts.py --export-md

# After saving *-ai.png masters to assets/website/presentation/
python scripts/embed-marketing-chronodat-logo.py
```

Attach reference screenshots listed in each prompt (app icon + user-guide captures) when generating in Cursor image generation (16:9).

---

## Generate the 90-second video

After branded slides exist in `assets/website/presentation/`:

```powershell
npm run assets:presentation-video
```

Output: `assets/website/presentation/video/asset-management-hub-90s.mp4` (1920×1080, 30 fps, ~94 s).

The build script (`scripts/build-presentation-video.py`) assembles the eight slides from
the timing table above with 0.4 s cross-dissolves and narrates the script with a **natural
neural voice** (`en-US-JennyNeural` via `edge-tts`). If the neural voice can't be reached
(offline/proxy), it automatically falls back to the Windows SAPI voice (Microsoft Zira).

**One-time dependencies:**

```powershell
pip install edge-tts truststore imageio-ffmpeg pillow
```

`truststore` lets Python use the OS certificate store, which fixes the corporate-proxy
SSL error edge-tts otherwise hits.

Pick a different narrator:

```powershell
python scripts/build-presentation-video.py --voice en-US-GuyNeural
# other good options: en-US-AriaNeural, en-US-AndrewMultilingualNeural
```

Optional silent version (slides only, no voiceover):

```powershell
python scripts/build-presentation-video.py --skip-tts
```
