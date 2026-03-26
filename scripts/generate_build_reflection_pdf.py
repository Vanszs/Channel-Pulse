from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
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
PREVIEW_URL = "https://vibe-coder-quest-mgt8iarrf-vanszs-projects.vercel.app"


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
                f"This build took roughly 3-4 hours end-to-end because I worked at a more "
                f"relaxed pace while still iterating carefully on the product, deployment, "
                f"and security details. The goal was to ship a clean MVP first, then tighten "
                f"semantic quality, trust signals, and production readiness until the product "
                f"felt credible. The latest preview deployment can be opened here: "
                f"<font color='#C95A3A'><u><link href='{PREVIEW_URL}'>Open the live Vercel preview</link></u></font>."
                f"<br/>Preview URL: <font color='#C95A3A'><u><link href='{PREVIEW_URL}'>"
                f"vibe-coder-quest-mgt8iarrf-vanszs-projects.vercel.app</link></u></font>.",
            ),
            Spacer(1, 10),
            Table(
                [
                    [
                        metric_card(styles, "Build Time", "~3-4 hours", "Design, architecture, implementation, deployment setup, security hardening, live API integration, UX audit, and polish."),
                        metric_card(styles, "Core Stack", "Next.js + Tailwind", "Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, YouTube Data API v3, and Vercel preview deployment."),
                        metric_card(styles, "Primary Workflow", "Codex + skills", "Skill-guided implementation with prompt iteration, rapid refactors, and live verification."),
                    ]
                ],
                colWidths=[58 * mm, 58 * mm, 58 * mm],
                hAlign="LEFT",
            ),
            Spacer(1, 18),
            Paragraph("Build Breakdown", styles["SectionTitle"]),
            Paragraph(
                "I approached the build like a fast startup MVP: get the data shape and "
                "information architecture stable first, then tighten the interaction model, "
                "then improve trust by fixing anything that felt misleading or analytically loose.",
                styles["SectionBody"],
            ),
            bullet_list(
                styles,
                [
                    "<b>What I used</b>: Codex Free as the main coding partner, Next.js App Router, React, Tailwind CSS, TypeScript, the YouTube Data API v3, local git, curl-based API checks, and lightweight skill guidance for full-stack and PDF workflows.",
                    "<b>What I automated</b>: prompt iteration, project structure decisions, UI scaffolding, API route work, mock-to-live data replacement, scoring and filtering logic, chart and table implementation, pagination, export flow, and most of the refactor work from start to finish.",
                    "<b>What I accelerated</b>: repetitive code generation, architecture cleanup, component splitting, API wiring, and semantic fixes after auditing the first pass.",
                    "<b>What I simplified</b>: I kept the product single-user and stateless, used YouTube public data rather than a stored database layer, and focused the UI on one clear flow instead of overbuilding auth, billing, persistence, and multi-workspace features too early.",
                    "<b>What stayed manual</b>: UI and UX review, product judgment, visual consistency checks, deciding what felt odd or misleading, deployment setup, environment handling for the API key, and the final audit to move the app from demo-ish to more trustworthy.",
                ],
            ),
            Spacer(1, 8),
            callout_box(
                styles,
                "How the work actually moved",
                "The fastest loop was: improve prompt -> use the right skill -> generate structure "
                "and code -> swap mocks for live API data -> test locally -> audit semantics -> "
                "tighten UX copy and interactions. That kept momentum high without losing control of the product quality.",
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
                    "<b>Request hardening on the API route</b>: the analyze endpoint only accepts JSON, checks same-origin requests, and requires a custom intent header before processing.",
                    "<b>Input and payload validation</b>: the server rejects malformed YouTube URLs, caps request body size, blocks invalid JSON, and returns structured errors instead of blindly trusting client input.",
                    "<b>Abuse protection</b>: I added per-client rate limiting on the analyze route so repeated automated requests are throttled instead of hitting the service endlessly.",
                    "<b>Safer response behavior</b>: no-store headers prevent analysis responses from being cached carelessly, and app-wide headers like CSP, HSTS, X-Frame-Options, nosniff, COOP, and Permissions-Policy give the deployment a stronger browser security posture.",
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
                    "<b>What I would add with more time</b>: a dedicated landing page, a proper login flow, a more complete dashboard shell, persistent channel watchlists, competitor collections, and per-user YouTube API keys so each account can bring its own quota and workspace.",
                    "<b>What feels missing today</b>: the app is useful as an MVP, but it still wants a fuller SaaS wrapper around it. The UX is much stronger now than the first pass, yet I still feel there is room to push the polish, onboarding, and information density further.",
                    "<b>What I would improve in version 2</b>: saved analyses, recurring refresh jobs, historical snapshots, compare mode across multiple competitors, cleaner topic clustering, better chart depth, shareable reports, and more opinionated takeaways for strategy teams.",
                ],
            ),
            Spacer(1, 10),
            Table(
                [
                    [
                        callout_box(
                            styles,
                            "What I prioritized and why",
                            "I prioritized stable data shape first, backend-ready logic second, component separation early, and responsive information hierarchy before decoration. That gave the MVP a better chance of surviving iteration instead of collapsing into a one-file prototype.",
                        ),
                        callout_box(
                            styles,
                            "Tradeoffs I made",
                            "I intentionally skipped auth, persistence, channel history, billing, and a broader SaaS shell. I also used heuristic topic extraction instead of a deeper NLP layer. Those were deliberate cuts to keep the build focused and launch-ready within the time box.",
                        ),
                    ]
                ],
                colWidths=[88 * mm, 88 * mm],
            ),
            PageBreak(),
            Spacer(1, 6 * mm),
            Paragraph("Room to Go Beyond", styles["SectionTitle"]),
            Paragraph(
                "The strongest version of this product is not just a one-off scanner. It becomes a "
                "competitive intelligence workspace that helps teams watch patterns over time and turn them "
                "into weekly decisions.",
                styles["SectionBody"],
            ),
            bullet_list(
                styles,
                [
                    "<b>Move from scan to system</b>: let users save channels, group competitors, and revisit the same workspace instead of starting from zero each time.",
                    "<b>Add ongoing monitoring</b>: scheduled refresh, velocity alerts, breakout notifications, and a simple weekly digest would make the product feel alive instead of one-shot.",
                    "<b>Make insight handoff stronger</b>: generate a cleaner brief view for teams, with saved filters, annotations, and a quick share mode for strategy reviews.",
                    "<b>Deepen the analysis layer</b>: stronger topic clustering, title pattern extraction, format segmentation, and channel-to-channel comparison would raise the product from useful to truly strategic.",
                ],
            ),
            Spacer(1, 10),
            callout_box(
                styles,
                "V2 direction in one sentence",
                "Turn Channel Pulse from a smart competitor scan into a persistent SaaS dashboard where a team can monitor its own channel, track competitors side by side, and act on changes before they become obvious to everyone else.",
            ),
            Spacer(1, 16),
            Paragraph("Closing Note", styles["SectionTitle"]),
            Paragraph(
                "Overall, I think the current build already works as a credible MVP. The next leap is less "
                "about adding random features and more about turning the experience into a true SaaS loop: "
                "onboard, save, monitor, compare, share, and return. That is where the product becomes habit-forming.",
                styles["SectionBody"],
            ),
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
