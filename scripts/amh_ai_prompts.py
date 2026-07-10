"""Structured AI image prompts for Asset Management Hub marketing and architecture assets.

Canonical source for assets/website/marketing/PROMPTS.md and infographic/PROMPTS.md.
Print copy-paste prompts: python scripts/print-amh-prompts.py

Workflow after AI generation (leave header top-right EMPTY in the AI image):
  1. Save masters to assets/website/marketing/*-ai.png (1536×1024) or infographic/_raw/
  2. python scripts/fix-surfaces-showcase-ai.py            # surfaces sheet only (footer)
  3. python scripts/embed-marketing-chronodat-logo.py      # stamp logo on masters
  4. python scripts/generate-marketing-store-crops.py      # crops inherit the logo
  5. python scripts/embed-chronodat-logo.py --ai           # architecture infographics
  6. npm run verify:store
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class PromptZone:
    """One layout region in a structured image prompt."""

    name: str
    instructions: str


@dataclass(frozen=True)
class ImagePrompt:
    """Structured prompt for a single AI-generated marketing or infographic image."""

    section: str
    output_file: str
    title: str
    headline: str
    references: tuple[str, ...]
    zones: tuple[PromptZone, ...]
    aspect_ratio: str = "16:9"
    canvas: str = "1536×1024"
    notes: str = ""
    kind: str = "marketing"  # marketing | infographic

    def negative_prompt(self) -> str:
        return INFOGRAPHIC_NEGATIVE if self.kind == "infographic" else SHARED_NEGATIVE

    def brand_rules(self) -> str:
        return INFOGRAPHIC_SUFFIX if self.kind == "infographic" else SHARED_BRAND_RULES

    def full_prompt(self) -> str:
        lines = [
            f"Professional B2B SaaS {'architecture infographic' if self.kind == 'infographic' else 'marketing infographic'} for {PRODUCT_NAME}.",
            f"Canvas: {self.canvas} landscape ({self.aspect_ratio}). Ultra-sharp, crisp anti-aliased text, no blur.",
            "",
            f"TITLE: {self.title}",
            f"HEADLINE: {self.headline}",
            "",
        ]
        for zone in self.zones:
            lines.append(f"{zone.name.upper()}:")
            lines.append(zone.instructions.strip())
            lines.append("")
        lines.append("BRAND / STYLE RULES:")
        lines.append(self.brand_rules().strip())
        if self.notes and self.kind != "infographic":
            lines.append("")
            lines.append(f"NOTES: {self.notes}")
        return "\n".join(lines).strip()


PRODUCT_NAME = "Asset Management Hub"
PRODUCT_SUBTITLE = "Hardware & software tracking for SharePoint and Teams"
FOOTER_LINE = "Asset Management Hub for SharePoint and Teams"
FOOTER_TAGLINE = "One license per site collection · no per-seat fees"

SHARED_BRAND_RULES = """
Product name: Asset Management Hub (always full name — never "Asset Management" alone).
Platform: SharePoint Online and Microsoft Teams ONLY. No Microsoft 365, M365, SPFx, or Graph badges.
Header left: Asset Management Hub app icon (blue gradient tile, box/QR motif from reference) + bold product name + gray subtitle.
Header top-right: LEAVE EMPTY — smooth background only. Chronodat wordmark is composited after generation (no logo, no box, no CHRONODAT text).
Optional header pills: ONLY "SharePoint Online" and "Microsoft Teams".
Footer left: same app icon + "Asset Management Hub for SharePoint and Teams" + "One license per site collection · no per-seat fees".
Footer right: 4 outlined trust pills — "Built on SharePoint Online", "Your data stays in your tenant",
  "One license per site collection", "14-day free trial".
Colors: teal #008080, Microsoft blue #0078D4, navy #0F234B, light gray background #ECEEF2 / #F7F8FA.
Typography: Segoe UI style, clean enterprise SaaS marketing.
NO website URL, NO price tag, NO certification badge, NO footer logos, NO partner logos.
""".strip()

SHARED_NEGATIVE = """
Chronodat, CHRONODAT, CHRC, wordmark, logo in header corner, white box behind logo, frosted pill behind logo,
logo border, rectangular logo background, Asset Management without Hub,
Microsoft 365, M365, SPFx, SharePoint Framework, Graph API badge,
footer logo, partner badge, chronodat.com, website URL, price tag, certification badge,
blurry, distorted text, gibberish UI, loading spinner, Risk & Compliance Hub, employee directory, time billing
""".strip()

INFOGRAPHIC_SUFFIX = """
Professional enterprise SaaS architecture infographic, 16:9 landscape (1600×900).
Soft light gray-teal gradient background #F8FAFC. Microsoft Fluent flat design.
Teal #008080 and blue #0078D4. White rounded cards with subtle shadows.
Label the product Asset Management Hub. Reference SharePoint Online and Microsoft Teams only.
Bottom-right ~24% × 11%: leave clear/empty for Chronodat logo compositing — no wordmark, no placeholder box.
Vector infographic quality, no people, no photos, ultra-sharp text.
""".strip()

INFOGRAPHIC_NEGATIVE = """
Chronodat wordmark, logo, white logo box, logo border, M365, SPFx, Microsoft 365 badge,
blurry text, stock photos, cluttered layout, wrong product name
""".strip()

MARKETING_REFERENCES = (
    "assets/brand/app-icon.png",
    "docs/user-guide/images/01-dashboard.png",
    "docs/user-guide/images/02-all-assets.png",
    "docs/user-guide/images/05-assign-asset.png",
    "docs/user-guide/images/13-reports.png",
    "docs/user-guide/images/15-audit-log.png",
)

MARKETING_PROMPTS: tuple[ImagePrompt, ...] = (
    ImagePrompt(
        section="1",
        output_file="asset-management-feature-grid-ai.png",
        title="Complete asset register and operations",
        headline="Track assets, assignments, and operations in one SharePoint-native hub",
        references=MARKETING_REFERENCES + ("docs/user-guide/images/02-all-assets.png",),
        zones=(
            PromptZone(
                "Background",
                "Light gray-teal subtle triangle pattern on #ECEEF2. Clean enterprise marketing layout.",
            ),
            PromptZone(
                "Header",
                "Left: app icon + bold Asset Management Hub + gray subtitle. "
                "Optional two pills: SharePoint Online, Microsoft Teams. "
                "Top-right: empty clear gradient — NO Chronodat logo or text.",
            ),
            PromptZone(
                "Main left",
                "4×4 grid of 16 white rounded feature cards with teal/blue icon dots. "
                "Cards: Dashboard, All Assets, Assigned To Me, Available, Assign, Return, Book, Request, "
                "Scan, Inventory, Licenses, Maintenance, Reports, Depreciation, Audit Log, Settings.",
            ),
            PromptZone(
                "Main right",
                "Device mockups (laptop + tablet) showing Asset Management Hub asset register UI "
                "mirroring attached 02-all-assets.png — same sidebar, status pills, table columns.",
            ),
            PromptZone(
                "Footer",
                "White bar: app icon + footer product line + tagline left; "
                "4 outlined trust pills right. No logos in footer.",
            ),
        ),
    ),
    ImagePrompt(
        section="2",
        output_file="asset-management-dashboard-showcase-ai.png",
        title="Dashboard and portfolio visibility",
        headline="Portfolio visibility with dashboards, KPI cards, and status charts",
        references=MARKETING_REFERENCES + ("docs/user-guide/images/01-dashboard.png",),
        zones=(
            PromptZone(
                "Background",
                "Soft gray #F7F8FA with subtle depth. Marketing showcase layout.",
            ),
            PromptZone(
                "Header",
                "Left: app icon + Asset Management Hub + subtitle for SharePoint and Teams. Top-right empty.",
            ),
            PromptZone(
                "Main center",
                "Modern laptop with Asset Management Hub dashboard mirrored from attached 01-dashboard.png — "
                "KPI cards (Total, Available, Assigned, In Repair), Latest Assets table, category chart, status donut. "
                "NO loading spinners.",
            ),
            PromptZone(
                "Main left",
                "4 vertical KPI highlight cards: Total Assets, Assigned, Available, Overdue — large numbers with icons.",
            ),
            PromptZone(
                "Main right",
                "White card titled Dashboard highlights with 4 bullets: real-time KPIs, actionable insights, "
                "operational efficiency, trusted SharePoint + Teams platform.",
            ),
            PromptZone(
                "Footer",
                "Trust pills: Built on SharePoint Online, Built for Microsoft Teams, Secure. Compliant. Reliable., "
                "Trusted by IT Teams.",
            ),
        ),
    ),
    ImagePrompt(
        section="3",
        output_file="asset-management-compliance-showcase-ai.png",
        title="Governance and audit",
        headline="Governed SharePoint lists with audit log and administrator controls",
        references=MARKETING_REFERENCES + ("docs/user-guide/images/15-audit-log.png",),
        zones=(
            PromptZone(
                "Background",
                "Dark navy gradient header #0F234B fading to lighter gray-teal below. Enterprise governance theme.",
            ),
            PromptZone(
                "Header",
                "Left: app icon + white Asset Management Hub text. Top-right empty dark header — NO logo.",
            ),
            PromptZone(
                "Main center",
                "Laptop showing Audit Log UI from attached 15-audit-log.png — When, User, Action, Entity columns, "
                "Settings updated / Created pills, sidebar with Operations and Analysis.",
            ),
            PromptZone(
                "Main right",
                "White rounded card Governance at every layer with 5 items and blue icons: "
                "audit trail, administrator controls, transparency, filter and review, secure and reliable.",
            ),
            PromptZone(
                "Footer",
                "White bar: product line left; Built for SharePoint and Built for Teams badges right.",
            ),
        ),
    ),
    ImagePrompt(
        section="4",
        output_file="asset-management-analysis-showcase-ai.png",
        title="Reporting and analysis",
        headline="Report builder, depreciation schedules, and CSV export",
        references=MARKETING_REFERENCES + ("docs/user-guide/images/13-reports.png",),
        zones=(
            PromptZone(
                "Background",
                "Light professional gray-teal marketing background.",
            ),
            PromptZone(
                "Header",
                "App icon + product name + SharePoint and Teams subtitle. Top-right empty.",
            ),
            PromptZone(
                "Main center",
                "Laptop with Report Builder page from 13-reports.png — report list, filters, export actions, sidebar.",
            ),
            PromptZone(
                "Main sides",
                "3 callout cards: Custom report builder, Depreciation schedules, CSV export from SharePoint lists.",
            ),
            PromptZone(
                "Footer",
                "Standard footer with trust pills. No footer logos.",
            ),
        ),
    ),
    ImagePrompt(
        section="5",
        output_file="asset-management-all-features-infographic-ai.png",
        title="Full feature map",
        headline="All Asset Management Hub features — register, operations, and admin",
        references=MARKETING_REFERENCES,
        zones=(
            PromptZone(
                "Background",
                "Light infographic grid on soft gray-teal background.",
            ),
            PromptZone(
                "Header",
                "App icon + product name. Top-right empty.",
            ),
            PromptZone(
                "Main",
                "Six horizontal rows of feature cards:\n"
                "1 Dashboard — KPIs and charts\n"
                "2 Asset register — hardware and software\n"
                "3 Operations — assign, return, book, request, scan, inventory\n"
                "4 Analysis — reports, depreciation, audit log\n"
                "5 Administration — settings, lookups, roles\n"
                "6 Deploy — SharePoint pages and Teams tabs only",
            ),
            PromptZone(
                "Footer",
                "Standard product footer + 4 trust pills.",
            ),
        ),
        notes="Dense readable card grid; avoid tiny illegible text.",
    ),
    ImagePrompt(
        section="6",
        output_file="asset-management-surfaces-showcase-ai.png",
        title="Deploy everywhere",
        headline="One asset hub across SharePoint, Teams, and native list forms",
        references=MARKETING_REFERENCES
        + (
            "docs/user-guide/images/02-all-assets.png",
            "docs/user-guide/images/05-assign-asset.png",
        ),
        zones=(
            PromptZone(
                "Background",
                "Light blue-white gradient #F5F7FA. Clean three-column layout.",
            ),
            PromptZone(
                "Header",
                "App icon + Asset Management Hub. Top-right completely empty — no CHRC, no CHRONODAT, no divider, no logo box.",
            ),
            PromptZone(
                "Main",
                "Three equal columns with SharePoint Online, Microsoft Teams, and Native Assets list form customizer headers.\n"
                "Column 1: asset list UI from 02-all-assets.png.\n"
                "Column 2: same hub in Teams-style frame.\n"
                "Column 3: New Asset form from 05-assign-asset.png style.\n"
                "Each window title must say Asset Management Hub (full name).",
            ),
            PromptZone(
                "Footer",
                "White bar: icon + product line + tagline; 4 trust pills right.",
            ),
        ),
        notes="Run scripts/fix-surfaces-showcase-ai.py after generation to swap mockups with live screenshots.",
    ),
)

def _info(**kwargs) -> ImagePrompt:
    return ImagePrompt(kind="infographic", **kwargs)


INFOGRAPHIC_PROMPTS: tuple[ImagePrompt, ...] = (
    _info(
        section="A1",
        output_file="architecture-overview.png",
        title="Architecture overview",
        headline="Asset Management Hub — Architecture Overview",
        references=("assets/brand/app-icon.png",),
        canvas="1600×900",
        zones=(
            PromptZone(
                "Layout",
                "Hub-and-spoke diagram. Center dark navy card with teal border: Asset Management Hub, "
                "SharePoint Framework · React · Fluent UI. Seven white cards: SharePoint Online, Microsoft Teams, "
                "Native list forms, Tenant App Catalog, AM_* SharePoint lists, Microsoft Graph (blue), "
                "Chronodat Subscription API. Arrows in from top four; teal arrows out to data layer.",
            ),
            PromptZone(
                "Subtitle",
                "One SharePoint-native package — data stays in your tenant.",
            ),
            PromptZone(
                "Logo zone",
                "Bottom-right corner empty for post-generation logo compositing.",
            ),
        ),
    ),
    _info(
        section="A2",
        output_file="architecture-data-flow.png",
        title="Data flow",
        headline="How Asset Management Hub data flows in your tenant",
        references=("assets/brand/app-icon.png",),
        canvas="1600×900",
        zones=(
            PromptZone(
                "Layout",
                "Left-to-right flow: User actions (Assign, Return, Scan) → SPFx web part → "
                "SharePoint REST → AM_* lists (Assets, Assignments, Audit) → Reports export. "
                "Optional Graph Mail.Send branch for notifications.",
            ),
            PromptZone(
                "Logo zone",
                "Bottom-right empty.",
            ),
        ),
    ),
    _info(
        section="A3",
        output_file="architecture-components.png",
        title="End-to-end workflows",
        headline="Onboard, assign, return, and report",
        references=("assets/brand/app-icon.png",),
        canvas="1600×900",
        zones=(
            PromptZone(
                "Layout",
                "Four-step horizontal journey with yellow-teal numbered circles: "
                "1 Complete setup · 2 Register assets · 3 Assign custodians · 4 Run reports and audit. "
                "Small browser panels under each step showing relevant UI silhouettes.",
            ),
            PromptZone(
                "Logo zone",
                "Bottom-right empty.",
            ),
        ),
    ),
    _info(
        section="A4",
        output_file="architecture-surfaces.png",
        title="Deploy everywhere",
        headline="Asset Management Hub — Deploy Everywhere",
        references=("assets/brand/app-icon.png",),
        canvas="1600×900",
        zones=(
            PromptZone(
                "Layout",
                "Center hub circle Asset Management Hub with teal ring. "
                "Four corner cards with dashed connectors: SharePoint Pages, Teams Channel Tab, "
                "Teams Personal App, Native Assets List Form.",
            ),
            PromptZone(
                "Subtitle",
                "One package — SharePoint pages, Teams, and native list forms.",
            ),
            PromptZone(
                "Logo zone",
                "Bottom-right empty.",
            ),
        ),
    ),
    _info(
        section="A5",
        output_file="architecture-modules.png",
        title="Application modules",
        headline="Asset Management Hub — Application Modules",
        references=("assets/brand/app-icon.png",),
        canvas="1600×900",
        zones=(
            PromptZone(
                "Layout",
                "Three columns with teal top accent bars:\n"
                "Assets — register, lifecycle views, licenses\n"
                "Operations — assign, return, book, scan, inventory\n"
                "Analysis & Admin — reports, audit log, settings, lookups\n"
                "Full-width navy footer bar: Shared SharePoint list platform.",
            ),
            PromptZone(
                "Logo zone",
                "Bottom-right empty.",
            ),
        ),
    ),
)


def prompt_by_output(filename: str) -> ImagePrompt | None:
    for p in (*MARKETING_PROMPTS, *INFOGRAPHIC_PROMPTS):
        if p.output_file == filename:
            return p
    return None
