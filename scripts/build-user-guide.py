#!/usr/bin/env python3
"""Rebuild docs/Asset-Management-User-Guide.docx with expanded steps and images."""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
DOC_PATH = ROOT / "docs" / "Asset-Management-User-Guide.docx"
GUIDE_IMAGES = ROOT / "docs" / "user-guide" / "images"
INFOGRAPHIC_IMAGES = ROOT / "assets" / "website" / "infographic"
ARCH_IMAGES = INFOGRAPHIC_IMAGES  # AI infographics with Chronodat logo
PACKAGE_SCREENSHOT = ROOT / "sharepoint" / "assets" / "screenshot-1.png"

sys.path.insert(0, str(ROOT / "scripts"))
from lib.read_app_version import read_app_version  # noqa: E402

VERSION = read_app_version()
GUIDE_DATE = date.today().strftime("%B %Y")


def add_title(doc: Document, text: str, level: int = 1) -> None:
    doc.add_heading(text, level=level)


def add_para(doc: Document, text: str, bold: bool = False) -> None:
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold


def add_steps(doc: Document, steps: list[str]) -> None:
    for step in steps:
        doc.add_paragraph(step, style="List Number")


def add_bullets(doc: Document, items: list[str]) -> None:
    for item in items:
        doc.add_paragraph(item, style="List Bullet")


def add_image(doc: Document, path: Path, caption: str, width: float = 5.9) -> None:
    if not path.is_file():
        add_para(doc, f"[Image not found: {path.name}]")
        return
    doc.add_picture(str(path), width=Inches(width))
    cap = doc.add_paragraph(caption)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if cap.runs:
        cap.runs[0].italic = True
        cap.runs[0].font.size = Pt(9)
    doc.add_paragraph()


def add_table(doc: Document, headers: list[str], rows: list[list[str]]) -> None:
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val
    doc.add_paragraph()


def pick(*candidates: Path) -> Path | None:
    for path in candidates:
        if path.is_file():
            return path
    return None


def img(name: str) -> Path:
    """Resolve a screenshot under docs/user-guide/images/."""
    return GUIDE_IMAGES / name


def list_guide_images() -> list[Path]:
    if not GUIDE_IMAGES.is_dir():
        return []
    return sorted(GUIDE_IMAGES.glob("*.png"))


def build() -> None:
    doc = Document()

    # Title block
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("Asset Management")
    run.bold = True
    run.font.size = Pt(24)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.add_run("User Guide — Features, Step-by-Step Instructions & Administration").font.size = Pt(14)

    ver = doc.add_paragraph()
    ver.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ver.add_run(f"Version {VERSION}  •  {GUIDE_DATE}").font.size = Pt(11)

    doc.add_paragraph()
    add_para(
        doc,
        "This guide explains how to deploy, configure, and use Asset Management in "
        "Microsoft 365 SharePoint Online and Microsoft Teams. It includes step-by-step "
        "workflows for risks, compliance, reporting, and site-owner settings. "
        "UI screenshots are stored in docs/user-guide/images/ and embedded throughout this document.",
    )

    add_title(doc, "Screenshot index", 2)
    add_table(
        doc,
        ["File", "Shows"],
        [
            ["01-dashboard.png", "Dashboard — summary cards, heat map, charts"],
            ["02-all-risks.png", "All Risks register with search and filters"],
            ["03-risk-rating.png", "Risk Rating — inherent and residual matrices"],
            ["04-compliance-dashboard.png", "Compliance Dashboard KPIs"],
            ["05-compliance-frameworks.png", "Compliance Frameworks and assessments"],
            ["06-business-list.png", "Business lookup list"],
            ["07-projects-list.png", "Projects lookup list"],
            ["08-report-builder.png", "Report Builder"],
            ["09-settings-general.png", "Settings → General"],
            ["10-settings-status-priority.png", "Settings → Risk Status & Priority"],
            ["11-settings-categories.png", "Settings → Risk Categories lookup"],
            ["12-create-risk-form.png", "Create risk panel with category form template fields"],
        ],
    )

    doc.add_page_break()

    # 1. Getting Started
    add_title(doc, "1. Getting Started")
    add_para(
        doc,
        "Asset Management is a SharePoint Framework (SPFx) application that provides a "
        "modern risk register, analytics dashboard, compliance framework tracking, configurable "
        "forms, workflow notifications, and reporting — all within a single web part.",
    )

    add_title(doc, "1.1 Requirements", 2)
    add_bullets(
        doc,
        [
            "Microsoft 365 SharePoint Online (not on-premises SharePoint Server)",
            "Modern browser: Microsoft Edge, Google Chrome, Mozilla Firefox, or Safari",
            "Site owner permission to run initial setup and open Settings",
            "Recommended: dedicated subsite (for example /sites/YourSite/AssetManagement) so 13+ lists stay isolated",
            "Optional: Exchange Online mailbox for users who trigger workflow notification emails",
        ],
    )

    add_title(doc, "1.2 Deploy the app (tenant administrator)", 2)
    add_steps(
        doc,
        [
            "Build or obtain the production package: sharepoint/solution/asset-management.sppkg (run npm run ship in the solution).",
            "Open SharePoint Admin Center → Apps → App Catalog and upload the .sppkg file.",
            "When prompted, deploy the package and make it available to all sites (skipFeatureDeployment is enabled).",
            "On the target site, ensure the app is available from the tenant catalog.",
        ],
    )

    add_title(doc, "1.2.1 Approve Microsoft Graph Mail.Send (email notifications)", 3)
    add_para(
        doc,
        "Workflow notification emails use Microsoft Graph sendMail (delegated Mail.Send). "
        "The app installs and runs without this step; only email delivery requires approval.",
    )
    add_steps(
        doc,
        [
            "Deploy asset-management.sppkg to the tenant App Catalog first — the pending permission request usually appears after deploy.",
            "Sign in as Global administrator or SharePoint administrator.",
            "Open SharePoint Admin Center (https://admin.microsoft.com/sharepoint).",
            "Go to Advanced → API access (direct link may work: .../online/AdminHome.aspx#/webApiPermissionManagement).",
            "Open the Pending requests tab, find Microsoft Graph → Mail.Send, and click Approve.",
            "If nothing is pending, check Approved requests — Mail.Send may already be approved for the tenant.",
        ],
    )
    add_bullets(
        doc,
        [
            "Approval is one-time per tenant (granted to SharePoint Online Web Client Extensibility).",
            "Users who trigger notifications need an Exchange Online mailbox; mail sends from the signed-in user's mailbox.",
            "If API access is missing from the menu, use PowerShell: Get-SPOTenantServicePrincipalPermissionRequests and Approve-SPOTenantServicePrincipalPermissionRequest.",
        ],
    )

    add_title(doc, "1.3 Add the web part to a page (site owner)", 2)
    add_steps(
        doc,
        [
            "Create or edit a modern SharePoint page (full-width layout recommended).",
            "Select Edit, click + (Add a new section/web part), and search for Asset Management.",
            "Add the web part and publish the page.",
            "Open the page while signed in as a site owner.",
        ],
    )
    add_image(
        doc,
        pick(PACKAGE_SCREENSHOT, img("01-dashboard.png")) or PACKAGE_SCREENSHOT,
        "Figure 1 — Asset Management on a SharePoint page",
    )

    add_title(doc, "1.4 Run first-time setup", 2)
    add_steps(
        doc,
        [
            "When the web part loads, click Complete Setup on the banner (or open Settings and run setup from there).",
            "Wait while the app creates 13 SharePoint lists, seeds lookup data (categories, likelihood scales, compliance frameworks), and registers the risk form customizer.",
            "Confirm the banner shows that lists are ready (for example: All 13 SharePoint lists are ready).",
            "Open Settings → General to set the app name and optional procedure document link.",
            "Open Settings → Appearance to choose theme mode and colors if desired.",
        ],
    )
    add_image(doc, ARCH_IMAGES / "architecture-deployment.png", "Figure 2 — Deployment and setup flow")

    add_title(doc, "1.5 Grant app administrators (optional)", 2)
    add_steps(
        doc,
        [
            "Open Settings → App Administrators (site owners and existing app administrators).",
            "Click Add administrator and search for a user.",
            "Click Add administrator, then Save settings at the bottom of the page.",
            "Added users can open Settings from the sidebar ADMIN section without being SharePoint site owners.",
            "The user who runs setup or first adds the web part is added automatically as an app administrator.",
        ],
    )
    add_para(
        doc,
        "Removing administrators: when more than one administrator exists, click Remove on a row and "
        "confirm in the dialog. When only one administrator remains, Remove is disabled — at least one "
        "app administrator is always required.",
    )

    add_title(doc, "1.6 Roles and permissions", 2)
    add_table(
        doc,
        ["Role", "Typical user", "Can do", "Cannot do"],
        [
            [
                "Site owner",
                "SharePoint site collection owner",
                "Run Complete Setup, manage SharePoint list permissions, open Settings",
                "Grant Graph Mail.Send (requires tenant admin)",
            ],
            [
                "App administrator",
                "Risk/compliance lead added in Settings",
                "Open Settings, manage lookups, workflows, templates, compliance frameworks",
                "Change SharePoint site permissions unless also site owner",
            ],
            [
                "Risk contributor",
                "Business analyst, project manager",
                "Create and edit risks, upload attachments, run reports",
                "Open Settings or delete lookup master data (unless granted list permissions)",
            ],
            [
                "Risk viewer",
                "Executive, auditor",
                "View dashboard, lists, compliance posture, export CSV",
                "Create or edit risks (unless Add/Edit granted on Risks list)",
            ],
            [
                "Tenant administrator",
                "Microsoft 365 admin",
                "Deploy .sppkg, approve Mail.Send, sync app to Teams",
                "Configure per-site Settings (done by site owner on each site)",
            ],
        ],
    )
    add_para(
        doc,
        "SharePoint list permissions on the Risks list and lookup lists control create, edit, and delete "
        "for end users. App administrators control configuration inside the web part only.",
    )
    add_image(doc, ARCH_IMAGES / "architecture-overview.png", "Figure 2a — Solution architecture overview")
    add_image(doc, ARCH_IMAGES / "architecture-surfaces.png", "Figure 2b — Deploy on SharePoint, Teams, and native list forms")

    doc.add_page_break()

    # 2. Tour
    add_title(doc, "2. Application Tour")
    add_title(doc, "2.1 Top bar", 2)
    add_bullets(
        doc,
        [
            "App name and branding (Settings → General)",
            "Procedure link — opens your risk management procedure URL (optional)",
            "Dark mode toggle — switches light/dark theme instantly; preference is stored per browser",
            "Portfolio filters — filter by business and project across dashboard and risk views; selections persist per site URL",
            "Create New Risk (or New Assessment on compliance pages)",
            "User profile pill — shown when SharePoint chrome is hidden (Settings → Appearance)",
        ],
    )
    add_para(
        doc,
        "Portfolio filters apply globally while you navigate the app. Clear filters from the top bar "
        "to return to the full portfolio. On the Dashboard, filters also scope heat maps, charts, "
        "summary cards, and the latest-risks table.",
    )

    add_title(doc, "2.3 Dashboard widgets explained", 2)
    add_table(
        doc,
        ["Widget", "What it shows", "Typical action"],
        [
            ["Summary cards", "Counts for Open, In Progress, Closed, Critical risks, average age", "Click a card to jump to a filtered list view"],
            ["Inherent heat map", "Likelihood × Impact distribution for potential ratings", "Click a cell to open matching risks"],
            ["Severity / status charts", "Breakdown by matrix priority and workflow status", "Hover for counts; use legend to compare buckets"],
            ["Latest risks table", "Recent items with tabs: Latest, Assigned to me, Overdue, Due this week", "Click a title to open the risk panel"],
            ["Financial exposure", "Aggregated potential cost when enabled in Settings → Dashboard", "Review high-exposure items; export via Report Builder for detail"],
        ],
    )

    add_title(doc, "2.2 Sidebar navigation", 2)
    add_table(
        doc,
        ["Section", "Page", "Purpose"],
        [
            ["Main", "Dashboard", "Portfolio summary, heat map, charts, latest risks"],
            ["Risks", "All Risks", "Full register with search, filters, and CSV export"],
            ["Risks", "Assigned To Me", "Risks where you are owner or assignee"],
            ["Risks", "Open / In Progress / Closed", "Filtered by workflow status bucket"],
            ["Risks", "Overdue / Due Today / Due This Week", "Date-driven risk views"],
            ["Analysis", "Risk Rating", "Inherent and residual risk matrices"],
            ["Analysis", "Report Builder", "Custom reports and CSV export"],
            ["Compliance", "Compliance Dashboard", "Compliance KPIs and charts"],
            ["Compliance", "Compliance Frameworks", "Framework library and assessments"],
            ["Lookups", "Business", "Business unit master data"],
            ["Lookups", "Projects", "Project portfolio linked to businesses"],
            ["Admin", "Settings", "Site owner / app administrator configuration"],
        ],
    )
    add_image(doc, img("01-dashboard.png"), "Figure 3 — Dashboard overview (docs/user-guide/images/01-dashboard.png)")

    doc.add_page_break()

    # 3. Risks
    add_title(doc, "3. Managing Risks — Step by Step")
    add_title(doc, "3.1 Create a new risk", 2)
    add_steps(
        doc,
        [
            "Click Create New Risk in the top bar (or open All Risks and use the same button).",
            "On the General tab, enter Title and Description.",
            "Select Status, Risk Category, Business, Project, and Risk Profile Type as required.",
            "Switch to the Assessment tab. Set Potential Likelihood and Potential Impact; matrix priority updates automatically in the header.",
            "Optionally set residual ratings, causes, consequences, existing controls, and potential cost.",
            "Switch to the Action Plan tab. Choose response strategy, enter mitigation plan, assign owners, and set due dates.",
            "If the selected Risk Category has a linked Form Template, complete the extra fields shown below the main tabs (for example Environmental Risk Form).",
            "Scroll down to add file attachments if needed.",
            "Click Save risk. A Risk ID (for example Risk-001) is assigned from Settings → Numbering.",
        ],
    )
    add_image(doc, img("12-create-risk-form.png"), "Figure 4 — Create risk form with category template fields")
    add_image(doc, img("02-all-risks.png"), "Figure 5 — All Risks list")

    add_title(doc, "3.2 View, edit, and delete", 2)
    add_steps(
        doc,
        [
            "From any list or dashboard table, click a risk title to open the detail panel.",
            "Click Edit to change fields, then Save risk.",
            "Open the Activity tab on an existing risk to view SharePoint version history.",
            "Use row actions → Delete to remove a risk (requires delete permission). Confirm in the dialog.",
        ],
    )

    add_title(doc, "3.3 List tools", 2)
    add_bullets(
        doc,
        [
            "Switch between table, list, and card views",
            "Search by Risk ID, title, or description",
            "Filter by status and matrix priority (Critical, Major, Moderate, Low)",
            "Apply portfolio filters for business and project",
            "Export filtered results to CSV",
            "Bulk delete when you have delete permission",
        ],
    )

    add_title(doc, "3.4 Risk form tabs and supplemental sections", 2)
    add_table(
        doc,
        ["Tab / section", "Typical content"],
        [
            ["General", "Title, description, status, category, sub-category, business, project, profile type"],
            ["Assessment", "Likelihood, impact, residual ratings, causes, consequences, controls, potential cost"],
            ["Action Plan", "Response strategy, mitigation plan, owners, key dates"],
            ["Category form template", "Extra fields when Settings → Form Templates links a template to the selected category (shown below main tabs)"],
            ["Attachments", "Files linked to the risk item (below main tabs)"],
            ["Activity", "Version history timeline (existing risks only; not shown when creating)"],
        ],
    )

    add_title(doc, "3.5 Category form templates (end user)", 2)
    add_steps(
        doc,
        [
            "Select a Risk Category on the General tab.",
            "If an administrator linked a Form Template to that category, additional fields appear below the General / Assessment / Action Plan tabs.",
            "Complete all required template fields before saving.",
            "Template answers are stored with the risk and appear in Report Builder custom-field columns.",
        ],
    )
    add_para(
        doc,
        "Administrators create templates under Settings → Form Templates. Each template can include "
        "multiple field types (text, dropdown, date, people picker, currency, and more) and optional "
        "internal tabs for long forms.",
    )

    add_title(doc, "3.6 Risk lifecycle and workflow statuses", 2)
    add_para(
        doc,
        "Each risk moves through organizational statuses (for example Draft, Open, In Progress, Mitigation, "
        "Resolved, Closed). Administrators define statuses under Settings → Risk Status & Priority and assign "
        "each status to a workflow bucket. Sidebar views group risks by bucket and due dates.",
    )
    add_table(
        doc,
        ["Workflow bucket", "Sidebar views using it", "Typical meaning"],
        [
            ["Open", "Open", "New or acknowledged risks awaiting action"],
            ["In Progress", "In Progress", "Active treatment or monitoring"],
            ["Mitigation", "(custom views as configured)", "Controls or actions underway"],
            ["Resolved", "(custom views as configured)", "Risk treated; awaiting formal closure"],
            ["Closed", "Closed", "No further action required"],
        ],
    )
    add_bullets(
        doc,
        [
            "Overdue, Due Today, and Due This Week views use action-plan due dates, not status alone.",
            "Matrix priority (Critical / Major / Moderate / Low) is separate from workflow status — it reflects Likelihood × Impact.",
            "Changing status may trigger notification workflows if configured under Settings → Notification Workflows.",
        ],
    )

    add_title(doc, "3.7 Attachments and audit trail", 2)
    add_steps(
        doc,
        [
            "On the create or edit risk panel, scroll to Attachments below the main tabs.",
            "Click Add files or drag files into the drop zone. Supported types follow SharePoint attachment rules for the Risks list.",
            "Remove an attachment with the delete control on the file row before saving.",
            "After save, open the Activity tab on an existing risk to view SharePoint version history (who changed what and when).",
            "Administrators can review cross-app changes under Settings → Audit Log.",
        ],
    )
    add_image(doc, ARCH_IMAGES / "architecture-data-flow.png", "Figure 5a — How risk data flows through the app")

    doc.add_page_break()

    # 4. Dashboard
    add_title(doc, "4. Dashboard & Risk Analysis")
    add_title(doc, "4.1 Use the dashboard", 2)
    add_steps(
        doc,
        [
            "Open Dashboard from the sidebar MAIN section.",
            "Review summary cards: Open, In Progress, Closed, Critical count, and average risk age.",
            "Use portfolio filters (top bar) to scope all widgets to a business or project.",
            "Click a cell on the inherent risk heat map to drill down to matching risks.",
            "Review severity, status, and priority charts below the heat map.",
            "Use the latest risks table tabs (Latest, Assigned to me, Overdue, etc.) to jump to items.",
            "Click Print dashboard (when available) for a print-friendly layout.",
        ],
    )
    add_image(doc, img("03-risk-rating.png"), "Figure 6 — Risk Rating matrices")

    add_title(doc, "4.2 Risk Rating page", 2)
    add_para(
        doc,
        "Open Analysis → Risk Rating. Inherent and residual matrices appear side by side. "
        "Residual ratings use explicit potential likelihood/impact when set; otherwise they "
        "are derived from control effectiveness. Click matrix cells or risk names to open details.",
    )

    add_title(doc, "4.3 Matrix priority", 2)
    add_para(
        doc,
        "Matrix priority (Critical, Major, Moderate, Low) is calculated from Likelihood × Impact "
        "using scales configured under Settings → Likelihood Scale and Consequence Scale. "
        "Custom Priorities in Settings are organizational labels stored for future use and are "
        "separate from matrix priority.",
    )
    add_title(doc, "4.4 Print and export from analytics", 2)
    add_steps(
        doc,
        [
            "Dashboard: click Print dashboard when available for a print-friendly layout without navigation chrome.",
            "Compliance Dashboard: use the print action to capture posture summaries for audit packs.",
            "Risk Rating: use browser print (Ctrl+P) to snapshot matrices; portfolio filters apply to displayed risks.",
            "Report Builder: export filtered datasets to CSV for Excel, Power BI, or archival (see section 7).",
        ],
    )
    add_image(doc, ARCH_IMAGES / "architecture-modules.png", "Figure 7 — Application modules (Risk, Compliance, Administration)")
    add_image(doc, ARCH_IMAGES / "architecture-platform.png", "Figure 7a — Platform and technology stack")

    doc.add_page_break()

    # 5. Compliance
    add_title(doc, "5. Compliance Management — Step by Step")
    add_title(doc, "5.1 Enable frameworks (administrator)", 2)
    add_steps(
        doc,
        [
            "Open Settings → Compliance.",
            "Enable built-in frameworks (ISO 27001, NIST CSF, GDPR, HIPAA, PCI-DSS, SOC 2, and others) or create a custom framework.",
            "Click Save settings. Controls seed on first use of each framework.",
        ],
    )

    add_title(doc, "5.2 Create and run an assessment", 2)
    add_steps(
        doc,
        [
            "Go to Compliance → Compliance Frameworks.",
            "Click New Assessment.",
            "Enter a name, select an active framework, and optionally set a due date.",
            "Save and open the assessment from the list.",
            "For each control, set status (Compliant, Non-Compliant, Partially Compliant, Not Applicable), evidence, and notes.",
            "Monitor progress on Compliance Dashboard.",
            "When all controls are assessed, change assessment status to Complete.",
        ],
    )
    add_image(doc, img("04-compliance-dashboard.png"), "Figure 8 — Compliance Dashboard")
    add_image(doc, img("05-compliance-frameworks.png"), "Figure 9 — Compliance Frameworks")
    add_image(doc, ARCH_IMAGES / "architecture-compliance.png", "Figure 10 — Compliance module architecture")

    add_title(doc, "5.3 Compliance dashboard KPIs", 2)
    add_table(
        doc,
        ["KPI / chart", "Meaning"],
        [
            ["Overall compliance score", "Weighted posture across active assessments and control statuses"],
            ["Framework coverage", "Share of enabled frameworks with at least one assessment started"],
            ["Open gaps", "Controls marked Non-Compliant or Partially Compliant"],
            ["Assessment progress", "Controls evaluated vs total controls in scope"],
            ["Recent activity", "Latest assessment updates and evidence uploads"],
        ],
    )
    add_para(
        doc,
        "First visit to Compliance may seed built-in frameworks and controls — allow extra load time. "
        "Subsequent visits read from SharePoint lists on the site.",
    )

    add_title(doc, "5.4 Link risks to compliance controls", 2)
    add_steps(
        doc,
        [
            "Ensure frameworks are enabled under Settings → Compliance.",
            "Create or open a risk and note its Risk ID and category.",
            "Open Compliance → Compliance Frameworks and select the relevant framework.",
            "Open an assessment and locate the control that maps to the risk domain.",
            "Record evidence or notes on the control; reference the Risk ID in evidence text for traceability.",
            "Use Compliance Dashboard to monitor posture; use Report Builder (Risks source) for risk-level exports.",
        ],
    )
    add_para(
        doc,
        "Risks and compliance share Business and Project lookups and the same SharePoint site permissions model. "
        "Unified navigation in the sidebar lets auditors move between the risk register and compliance views without leaving the app.",
    )

    doc.add_page_break()

    # 6. Business & Projects
    add_title(doc, "6. Business & Projects — Step by Step")
    add_para(
        doc,
        "Business units and projects are master data used to classify risks and drive portfolio filters.",
    )
    add_title(doc, "6.1 Add a business unit", 2)
    add_steps(
        doc,
        [
            "Open Lookups → Business in the sidebar.",
            "Click Add new.",
            "Enter Title and complete visible fields (industry, region, criticality, owner).",
            "Click Save. The new business appears in risk forms and portfolio filters.",
        ],
    )
    add_image(doc, img("06-business-list.png"), "Figure 11 — Business list")

    add_title(doc, "6.2 Add a project", 2)
    add_steps(
        doc,
        [
            "Open Lookups → Projects.",
            "Click Add new.",
            "Enter Title, select linked Business, and complete status, priority, type, and project manager fields.",
            "Click Save.",
        ],
    )
    add_image(doc, img("07-projects-list.png"), "Figure 12 — Projects list")

    doc.add_page_break()

    # 7. Report Builder
    add_title(doc, "7. Report Builder — Step by Step")
    add_steps(
        doc,
        [
            "Open Analysis → Report Builder.",
            "Choose a data source: Risks, Business, or Projects.",
            "Select columns to include in the report.",
            "Add optional filters (field, operator, value).",
            "Click Generate Report to preview up to 200 rows in the browser.",
            "Click Download CSV to export the full filtered result set.",
        ],
    )
    add_image(doc, img("08-report-builder.png"), "Figure 13 — Report Builder")

    add_title(doc, "7.1 Report Builder tips", 2)
    add_bullets(
        doc,
        [
            "Risks source includes standard fields plus custom columns from Form Templates.",
            "Use filters such as Status equals Open, Matrix priority equals Critical, or Business equals a unit name.",
            "Preview shows up to 200 rows; CSV download includes the full filtered set.",
            "Save commonly used column sets by noting them in your team runbook — column selection resets each session.",
            "Combine Report Builder CSV with Compliance assessment exports for integrated audit evidence.",
        ],
    )

    doc.add_page_break()

    # 8. Settings
    add_title(doc, "8. Settings Reference (Site Owners & App Administrators)")
    add_para(
        doc,
        "Open Admin → Settings. Configuration is grouped into General, Preferences, and Lookups. "
        "Most pages use Save settings at the bottom; lookup list pages (categories, scales, etc.) save each item independently.",
    )
    add_table(
        doc,
        ["Setting area", "What you configure"],
        [
            ["General", "App name, procedure document URL"],
            ["Appearance", "Theme mode, color scheme, layout, hide SharePoint chrome"],
            ["Dashboard", "Dashboard name, dynamic naming, heat-map drill-down, financial exposure card"],
            ["Dropdown Options", "Choice values for risk form dropdowns (status is managed under Risk Status & Priority)"],
            ["Forms", "Field visibility, labels, and required flags per entity (Risk, Business, Project)"],
            ["Form Templates", "Category-linked extra fields on create/edit risk forms"],
            ["Risk Status & Priority", "Custom statuses (with workflow buckets) and custom priority labels"],
            ["Compliance", "Enable/disable frameworks; create custom frameworks"],
            ["Subscription", "14-day trial and yearly subscription (when enabled for your deployment)"],
            ["App Administrators", "Users who can open Settings; at least one required; remove requires confirmation"],
            ["Numbering", "Auto Risk ID and project code formats"],
            ["Tags", "Colored tags for risk categorization (Save settings to persist)"],
            ["Notification Workflows", "Email events: created, assigned, overdue, closed, etc."],
            ["Workflow Rules", "Trigger/condition/action rules (execution via Power Automate when configured)"],
            ["Email Templates", "Reusable HTML templates with merge variables"],
            ["Scheduled Reports", "Report schedules (delivery requires automation integration)"],
            ["Lookup lists", "Categories, sub-categories, likelihood, consequence, profile types, response, strategy"],
            ["Audit Log", "Searchable log of create/update/delete actions across the app"],
        ],
    )
    add_image(doc, img("09-settings-general.png"), "Figure 14 — Settings → General")
    add_image(doc, img("10-settings-status-priority.png"), "Figure 15 — Risk Status & Priority (Custom Statuses tab)")
    add_image(doc, img("11-settings-categories.png"), "Figure 16 — Risk Categories lookup")

    add_title(doc, "8.1 Custom statuses and sidebar views", 2)
    add_steps(
        doc,
        [
            "Open Settings → Risk Status & Priority.",
            "On the Custom Statuses tab, click Add Status. Enter a name, color, and Counts as bucket (Open, In Progress, Mitigation, Resolved, or Closed).",
            "Switch to the Custom Priorities tab to add organizational priority labels (separate from matrix priority on the risk form).",
            "Click Save settings. Status names sync to the SharePoint Riskstatus field.",
        ],
    )
    add_para(
        doc,
        "Sidebar views (Open, In Progress, Closed, Overdue, etc.) group risks by status bucket and due dates. "
        "Matrix priority (Critical, Major, Moderate, Low) is calculated from Likelihood × Impact using "
        "Settings → Likelihood Scale and Consequence Scale — not from custom priority labels.",
    )

    add_title(doc, "8.2 Form Templates (administrator)", 2)
    add_steps(
        doc,
        [
            "Open Settings → Form Templates.",
            "Click New form template. Enter a name and link it to a Risk Category.",
            "Add fields (text, dropdown, date, people, currency, etc.) and optional template tabs for long forms.",
            "Save the template and ensure it is marked Active.",
            "When a user selects the linked category on a risk form, the template fields appear below the main tabs.",
        ],
    )

    add_title(doc, "8.3 Lookup lists (administrator)", 2)
    add_para(
        doc,
        "Settings → Lookups section manages master data: Risk Categories, Sub-Categories, Likelihood Scale, "
        "Consequence Scale, Risk Profile Types, Response Strategies, and Risk Strategies. Each list supports "
        "Add new, Edit, and Delete. Delete shows a confirmation dialog; if other records reference a lookup "
        "value, the dialog lists affected lists and offers Delete anyway.",
    )

    add_title(doc, "8.4 Email notifications (Mail.Send)", 2)
    add_steps(
        doc,
        [
            "Deploy asset-management.sppkg, then approve Microsoft Graph Mail.Send (see section 1.2.1).",
            "Configure events under Settings → Notification Workflows.",
            "Customize message bodies under Settings → Email Templates (merge variables: {RiskID}, {Title}, {Status}, {AssignedTo}, {RiskUrl}, and more).",
            "Users who save risks must have an Exchange Online mailbox; mail sends from the signed-in user's mailbox.",
        ],
    )
    add_image(doc, ARCH_IMAGES / "architecture-notifications.png", "Figure 17 — Notification architecture")

    add_title(doc, "8.5 Appearance and layout", 2)
    add_steps(
        doc,
        [
            "Open Settings → Appearance.",
            "Choose Theme mode: Light, Dark, or Follow system.",
            "Adjust Accent color and optional custom header background if your policy allows branding.",
            "Enable Hide SharePoint chrome for a full-app experience on SharePoint pages (not available in Teams).",
            "Enable Show user profile pill when chrome is hidden so users still see their signed-in identity.",
            "Click Save settings and refresh the page to apply layout changes.",
        ],
    )

    add_title(doc, "8.6 Numbering and Risk IDs", 2)
    add_para(
        doc,
        "Settings → Numbering controls auto-generated Risk IDs and project codes. Typical format uses a "
        "prefix (for example Risk-) and a zero-padded sequence. New risks receive the next ID on save. "
        "Changing numbering does not retroactively rename existing items.",
    )

    add_title(doc, "8.7 Audit Log", 2)
    add_para(
        doc,
        "Settings → Audit Log records create, update, and delete actions performed through the web part "
        "and form customizer. Search by user, entity type, or date range. Use alongside SharePoint version "
        "history on individual risk items for full traceability.",
    )
    add_image(doc, ARCH_IMAGES / "architecture-security.png", "Figure 17a — Security, permissions, and licensing boundary")

    doc.add_page_break()

    # 9. Teams
    add_title(doc, "9. SharePoint vs Microsoft Teams")
    add_table(
        doc,
        ["Topic", "SharePoint page", "Teams tab"],
        [
            ["Data storage", "Lists in current SharePoint site", "Same — backing SharePoint site"],
            ["Setup", "Run on hosting site", "Run on backing SharePoint site"],
            ["Settings", "Full access for site owners / app admins", "Same; configure in app Settings"],
            ["SharePoint chrome hiding", "Available in Appearance settings", "Disabled in Teams"],
            ["Native list form customizer", "Works on Risks list URLs", "Not available in Teams"],
        ],
    )
    add_title(doc, "9.1 Enable in Teams", 2)
    add_steps(
        doc,
        [
            "Deploy the .sppkg to the tenant app catalog.",
            "In the app catalog entry, use Sync to Teams (or Deploy to Teams).",
            "In Teams, add the app as a channel tab or personal app.",
            "Complete setup on the backing SharePoint site if not already done.",
        ],
    )

    add_title(doc, "9.2 Native SharePoint list forms (form customizer)", 2)
    add_para(
        doc,
        "Complete Setup registers the Risk Form Customizer on the site Risks list. When users open "
        "SharePoint's native New or Edit form for a risk item (from list views outside the web part), "
        "they see the same rich risk panel used inside the app.",
    )
    add_steps(
        doc,
        [
            "Run Complete Setup after every package upgrade to re-register the form customizer.",
            "Open the SharePoint Risks list → New item to verify the custom form loads.",
            "Native forms work on SharePoint list URLs only — not inside Microsoft Teams.",
            "Attachments, category templates, and matrix calculations behave the same as in the web part.",
        ],
    )
    add_para(
        doc,
        "If the native form reverts to the default SharePoint layout, re-run setup or confirm the "
        "AssetFormCustomizer extension is active for the site collection.",
    )

    doc.add_page_break()

    # 10. Troubleshooting
    add_title(doc, "10. Tips & Troubleshooting")
    add_table(
        doc,
        ["Issue", "What to try"],
        [
            ["Setup banner won't go away", "Complete Setup as site owner; confirm Manage Lists permission"],
            ["Can't open Settings", "Only site owners and app administrators see Settings; ask an admin to add you under App Administrators"],
            ["Can't remove last app administrator", "At least one app administrator is required; add another before removing"],
            ["Graph Mail.Send / API access not visible", "Deploy .sppkg first; use SharePoint Admin Center → Advanced → API access; check Approved tab or use PowerShell"],
            ["Email notifications not sent", "Approve Mail.Send; confirm user has Exchange mailbox; check Notification Workflows are enabled"],
            ["Category template fields missing", "Confirm Settings → Form Templates links an active template to the selected category"],
            ["Lookup delete blocked", "Update referencing risks first, or confirm Delete anyway in the dialog"],
            ["Create Risk disabled", "Finish setup; confirm Add permission on Risks list"],
            ["Status missing in dropdown", "Save Settings → Risk Status & Priority; statuses sync to SharePoint"],
            ["Compliance dashboard slow first visit", "First load seeds frameworks/controls; later visits are faster"],
            ["Changes not visible after save", "Navigate away and back; lookup lists refresh automatically"],
            ["Native list form not custom", "Re-run setup after package upgrade to re-register form customizer"],
            ["Subscription / trial banner", "Verify subscriptionApiUrl; contact administrator for licensing; dev sites may use skipSubscriptionCheck"],
            ["Heat map empty", "Confirm risks have Potential Likelihood and Potential Impact set on Assessment tab"],
            ["CSV export truncated in browser", "Report Builder preview limits rows; use Download CSV for full export"],
            ["Teams tab shows setup banner", "Complete Setup on the backing SharePoint site, not inside Teams"],
        ],
    )

    add_title(doc, "11. Solution architecture (reference)", 2)
    add_para(
        doc,
        "The following diagrams summarize how Asset Management fits in Microsoft 365. "
        "For full technical detail, see docs/Asset-Management-Technical-Architecture.docx.",
    )
    add_image(doc, ARCH_IMAGES / "architecture-components.png", "Figure 19 — Component architecture")
    add_image(doc, ARCH_IMAGES / "architecture-deployment.png", "Figure 20 — Deployment flow")

    doc.add_page_break()

    add_title(doc, "10.1 Regenerate this guide (technical)", 2)
    add_para(
        doc,
        "Solution developers can refresh UI screenshots and rebuild this Word document:",
    )
    add_bullets(
        doc,
        [
            "Set PLAYWRIGHT_BASE_URL to a SharePoint page hosting the web part.",
            "Run npm run test:e2e:setup once to create e2e/.auth/user.json.",
            "Run npm run docs:user-guide:all — captures docs/user-guide/images/*.png and runs this script.",
            "Or run npm run docs:user-guide to rebuild the .docx from existing images only.",
        ],
    )

    add_title(doc, "10.2 Quick reference", 2)
    add_bullets(
        doc,
        [
            "Collapse the sidebar on desktop to maximize content area",
            "Portfolio filters persist per site URL in your browser",
            "Use Back to top on long pages",
            "Breadcrumb Home returns to Dashboard",
        ],
    )

    doc.add_page_break()
    add_title(doc, "Appendix A — Glossary", 2)
    add_table(
        doc,
        ["Term", "Definition"],
        [
            ["Matrix priority", "Critical / Major / Moderate / Low from Likelihood × Impact scales"],
            ["Workflow bucket", "Groups custom statuses for sidebar views (Open, In Progress, Closed, etc.)"],
            ["Portfolio filter", "Business and/or project scope applied across dashboard and lists"],
            ["Form template", "Extra fields shown when a risk category has a linked template"],
            ["Complete Setup", "One-time provisioning of SharePoint lists, seed data, and form customizer"],
            ["App administrator", "User who can open Settings; stored in Administrators list"],
            ["Residual rating", "Rating after controls; uses explicit fields or derived from control effectiveness"],
            ["SPFx", "SharePoint Framework — Microsoft 365 extensibility platform for the web part"],
        ],
    )

    doc.add_page_break()
    add_title(doc, "Appendix B — Keyboard and navigation shortcuts", 2)
    add_bullets(
        doc,
        [
            "Escape — close an open risk or settings panel when focus is inside the panel",
            "Ctrl+P — print current browser view (dashboard print button preferred when available)",
            "Sidebar collapse — click the collapse control to maximize chart and table area on desktop",
            "Breadcrumb Home — returns to Dashboard from any page",
            "Back to top — appears on long list pages after scrolling",
        ],
    )

    doc.add_paragraph()
    add_para(
        doc,
        f"Document generated for Asset Management v{VERSION}. "
        "For deployment, store submission, and technical architecture, see README.md and docs/ in the solution package.",
    )

    DOC_PATH.parent.mkdir(parents=True, exist_ok=True)
    doc.save(DOC_PATH)
    print(f"Wrote {DOC_PATH}")
    missing = [p.name for p in list_guide_images() if not p.is_file()]
    if missing:
        print(f"Warning: missing images in {GUIDE_IMAGES}: {', '.join(missing)}")
    else:
        print(f"Embedded {len(list_guide_images())} screenshots from {GUIDE_IMAGES}")


if __name__ == "__main__":
    build()
