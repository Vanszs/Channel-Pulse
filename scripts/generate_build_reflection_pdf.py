from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "output" / "pdf"
TMP_DIR = ROOT / "tmp" / "pdfs"
OUTPUT_PATH = OUTPUT_DIR / "channel-pulse-build-reflection.pdf"
LIVE_URL = "https://skill-deploy-271b54wq33.vercel.app/"
LIVE_LABEL = "skill-deploy-271b54wq33.vercel.app"


def build_styles():
    stylesheet = getSampleStyleSheet()

    stylesheet.add(
        ParagraphStyle(
            name="Eyebrow",
            parent=stylesheet["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#7A6E62"),
            uppercase=True,
            spaceAfter=8,
            tracking=1.4,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="HeroTitle",
            parent=stylesheet["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=32,
            textColor=colors.HexColor("#161411"),
            spaceAfter=10,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="HeroBody",
            parent=stylesheet["BodyText"],
            fontName="Helvetica",
            fontSize=11.5,
            leading=18,
            textColor=colors.HexColor("#4E473F"),
            spaceAfter=14,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=stylesheet["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=22,
            textColor=colors.HexColor("#161411"),
            spaceBefore=4,
            spaceAfter=8,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="SectionBody",
            parent=stylesheet["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=16,
            textColor=colors.HexColor("#37312B"),
            spaceAfter=8,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="Label",
            parent=stylesheet["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#7A6E62"),
            uppercase=True,
            spaceAfter=3,
            tracking=1.0,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="CardValue",
            parent=stylesheet["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#161411"),
            spaceAfter=4,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="CardBody",
            parent=stylesheet["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#4E473F"),
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="BulletText",
            parent=stylesheet["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=15,
            textColor=colors.HexColor("#37312B"),
            leftIndent=0,
            spaceAfter=2,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="CalloutTitle",
            parent=stylesheet["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#161411"),
            spaceAfter=4,
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="CalloutBody",
            parent=stylesheet["BodyText"],
            fontName="Helvetica",
            fontSize=9.8,
            leading=15,
            textColor=colors.HexColor("#4E473F"),
        )
    )
    stylesheet.add(
        ParagraphStyle(
            name="Footer",
            parent=stylesheet["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10,
            textColor=colors.HexColor("#877B70"),
            alignment=TA_CENTER,
        )
    )

    return stylesheet


def metric_card(styles, label: str, value: str, body: str):
    table = Table(
        [
            [Paragraph(label, styles["Label"])],
            [Paragraph(value, styles["CardValue"])],
            [Paragraph(body, styles["CardBody"])],
        ],
        colWidths=[56 * mm],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF8F2")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E7DDD2")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def callout_box(styles, title: str, body: str):
    table = Table(
        [[Paragraph(title, styles["CalloutTitle"])], [Paragraph(body, styles["CalloutBody"])]],
        colWidths=[None],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F6EFE7")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E3D8CC")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def bullet_list(styles, items: list[str]):
    flow = []
    for item in items:
        paragraph = Paragraph(item, styles["BulletText"])
        flow.append(ListItem(paragraph, leftIndent=6, bulletColor=colors.HexColor("#FF6B4A")))
    return ListFlowable(
        flow,
        bulletType="bullet",
        start="circle",
        bulletFontName="Helvetica-Bold",
        bulletFontSize=9,
        leftIndent=14,
        bulletOffsetY=1,
        spaceBefore=2,
        spaceAfter=6,
    )


def draw_page(canvas, doc):
    canvas.saveState()
    width, height = A4

    canvas.setFillColor(colors.HexColor("#F8F2EA"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)

    canvas.setFillColor(colors.HexColor("#FFFDFC"))
    canvas.roundRect(16 * mm, 14 * mm, width - 32 * mm, height - 28 * mm, 18, stroke=0, fill=1)

    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.setFillColor(colors.HexColor("#7A6E62"))
    canvas.drawString(22 * mm, height - 28 * mm, "CHANNEL PULSE - BUILD REFLECTION")

    canvas.setFont("Helvetica", 8.5)
    canvas.drawRightString(width - 22 * mm, height - 28 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_story(styles):
    story = []

    story.extend(
        [
            Spacer(1, 22 * mm),
            Paragraph("Build Reflection", styles["Eyebrow"]),
            Paragraph("Channel Pulse", styles["HeroTitle"]),
            Paragraph(
                "A concise reflection on how the product was built, what was prioritized, "
                "what was intentionally simplified, and where the SaaS can grow next.",
                styles["HeroBody"],
            ),
            callout_box(
                styles,
                "Submission context",
                f"This build took roughly 3-4 hours end-to-end, with a little extra effort because "
                f"I was using Codex Free instead of Claude Code. I automated most of the build from prompt "
                f"improvement through implementation, then manually reviewed the UI and UX, "
                f"checked for missing environment setup, swapped mock data to live YouTube data, "
                f"and tightened anything that still felt off. The live product can be opened here: "
                f"<font color='#C95A3A'><u><link href='{LIVE_URL}'>Open the live app</link></u></font>."
                f"<br/>Live URL: <font color='#C95A3A'><u><link href='{LIVE_URL}'>{LIVE_LABEL}</link></u></font>.",
            ),
            Spacer(1, 10),
            Table(
                [
                    [
                        metric_card(styles, "Build Time", "~3-4 hours", "Prompt iteration, architecture, implementation, live API integration, UI review, security hardening, and final polish."),
                        metric_card(styles, "Core Stack", "Next.js + Tailwind", "Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, and the YouTube Data API v3."),
                        metric_card(styles, "Primary Workflow", "Codex Free + skills", "Prompt-first planning, skill-guided structure, rapid implementation, and manual product review."),
                    ]
                ],
                colWidths=[58 * mm, 58 * mm, 58 * mm],
                hAlign="LEFT",
            ),
            Spacer(1, 18),
            Paragraph("Build Breakdown", styles["SectionTitle"]),
            Paragraph(
                "I approached the build with a prompt-improve workflow: lock the product goal, use the "
                "right skill to keep the structure clean, automate the heavy lifting, then manually review "
                "the experience until it felt credible enough to show.",
                styles["SectionBody"],
            ),
            bullet_list(
                styles,
                [
                    "<b>What I used</b>: Codex Free as the main coding partner, Next.js App Router, React, Tailwind CSS, TypeScript, the YouTube Data API v3, local git, curl-based checks, and the local fullstack-developer and pdf skills.",
                    "<b>What I automated</b>: almost everything from improved prompts, skill-guided structure, and coding from start to finish through data wiring, scoring logic, sorting and filtering, charts, pagination, export, and most refactors.",
                    "<b>What I accelerated</b>: repetitive component work, architecture cleanup, state wiring, API integration, and turning the early mock-backed app into a live product faster.",
                    "<b>What I simplified</b>: I kept the product single-user and stateless, used YouTube public data rather than a stored database layer, and focused the UI on one clear flow instead of overbuilding auth, billing, persistence, and multi-workspace features too early.",
                    "<b>What stayed manual</b>: UI and UX review, product judgment, code audit, catching missing env handling, making sure the API key flow was real, replacing mock assumptions, and the final pass to remove anything that still felt inconsistent or unpolished.",
                ],
            ),
            Spacer(1, 8),
            callout_box(
                styles,
                "How the work actually moved",
                "The fastest loop was: improve the prompt -> use the right skill -> generate structure and "
                "code -> swap mocks for live data -> test locally -> audit semantics -> tighten the UI and UX. "
                "That kept momentum high without losing product judgment.",
            ),
            Spacer(1, 10),
            Paragraph("Security Additions", styles["SectionTitle"]),
            Paragraph(
                "Besides building the MVP features, I also added a small but meaningful security baseline "
                "so the public demo is safer to expose and less likely to be abused. This was a separate "
                "part of the work, not just a side effect of building the UI.",
                styles["SectionBody"],
            ),
            bullet_list(
                styles,
                [
                    "<b>Server-side secret handling</b>: the YouTube API key stays in environment variables and is not committed to GitHub, so the browser never receives the raw secret.",
                    "<b>OWASP-style request hardening</b>: the analyze endpoint only accepts JSON, requires a same-origin request signal, and expects a custom intent header before processing.",
                    "<b>Input and payload validation</b>: the server rejects malformed YouTube URLs, caps request body size, blocks invalid JSON, rejects unexpected payload shape, and returns structured errors instead of blindly trusting client input.",
                    "<b>Abuse protection</b>: I added per-client rate limiting on the analyze route so repeated automated requests are throttled instead of hitting the service endlessly.",
                    "<b>Safer upstream handling</b>: server fetches to YouTube now use timeouts so the app fails closed more cleanly instead of hanging on slow upstream responses.",
                    "<b>Safer response behavior</b>: no-store headers prevent analysis responses from being cached carelessly, and app-wide headers like CSP, HSTS, X-Frame-Options, nosniff, COOP, CORP, and Permissions-Policy give the deployment a stronger browser security posture.",
                ],
            ),
        ]
    )

    story.extend(
        [
            Spacer(1, 10),
            Paragraph("Product Thinking", styles["SectionTitle"]),
            Paragraph(
                "The current version is a solid MVP, but it still feels like the first serious release "
                "of a focused tool, not yet the full SaaS business around it. That is okay for this stage. "
                "The important part is that the core value proposition already works: paste a competitor "
                "channel and quickly understand what is winning right now.",
                styles["SectionBody"],
            ),
            bullet_list(
                styles,
                [
                    "<b>What feels missing today</b>: overall, this is already a solid MVP, but it still wants a fuller SaaS wrapper around it. The core workflow works, yet the product would feel stronger with better onboarding, a clearer dashboard shell, and more polished context around what the user should do next.",
                    "<b>What I would add with more time</b>: recurring refresh jobs, saved competitor watchlists, compare mode across channels, clearer benchmarking against our own channel, and a more opinionated reporting layer that turns raw metrics into recommended actions.",
                    "<b>What I would improve in version 2</b>: historical snapshots, compare mode across multiple competitors, better topic clustering, recurring alerts, stronger reporting, and more opinionated strategic takeaways that help a team turn raw signals into action.",
                ],
            ),
            Spacer(1, 10),
            Table(
                [
                    [
                        callout_box(
                            styles,
                            "What I prioritized and why",
                            "I prioritized stable data shape first, backend-ready logic second, component separation early, and responsive information hierarchy before decoration. That let the MVP stay clean and scalable instead of collapsing into a one-file prototype.",
                        ),
                        callout_box(
                            styles,
                            "Tradeoffs I made",
                            "I intentionally skipped auth, persistence, full dashboard flows, billing, and deeper analysis layers like richer topic clustering. Those were deliberate cuts to keep the build focused, clear, and launch-ready inside the time box.",
                        ),
                    ]
                ],
                colWidths=[88 * mm, 88 * mm],
            ),
            Spacer(1, 6 * mm),
            Paragraph("Room to Go Beyond", styles["SectionTitle"]),
            Paragraph(
                "The strongest next step is not just adding deeper analysis. It is turning this MVP into a "
                "more complete SaaS experience around the scan itself, so users can enter cleanly, understand "
                "what to do, and come back to previous work without feeling like every session starts from zero.",
                styles["SectionBody"],
            ),
            bullet_list(
                styles,
                [
                    "<b>Finish the SaaS wrapper</b>: add a dedicated landing page, a proper login flow, and a more intentional onboarding path so the product feels complete before the user even runs the first scan.",
                    "<b>Make sessions persistent</b>: saved analyses, a clearer dashboard shell, and an easier way to return to prior channel scans would make the tool feel dependable instead of one-off.",
                    "<b>Make the core loop easier to revisit</b>: recent scans, lightweight history, and saved competitor sets would help users keep momentum instead of rebuilding context from scratch.",
                    "<b>Raise confidence in the product surface</b>: clearer entry points, stronger empty states, and more obvious next actions would make the whole experience feel more finished and client-ready.",
                ],
            ),
            Spacer(1, 10),
        ]
    )

    return story


def generate_pdf():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=24 * mm,
        rightMargin=24 * mm,
        topMargin=26 * mm,
        bottomMargin=20 * mm,
        title="Channel Pulse - Build Reflection",
        author="Codex",
    )

    story = build_story(styles)
    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return OUTPUT_PATH


if __name__ == "__main__":
    path = generate_pdf()
    print(path)
