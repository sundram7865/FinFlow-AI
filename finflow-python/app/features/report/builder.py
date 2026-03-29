import tempfile
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import cm
from xml.sax.saxutils import escape


def build_report_pdf(
    month: int,
    year: int,
    summary: str,
    total_income: float,
    total_expense: float,
    by_category: dict,
) -> str:
    """
    Stable PDF generator (production-ready)
    """

    # ✅ ALWAYS use unique temp file (CRITICAL FIX)
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp_path = tmp_file.name
    tmp_file.close()

    styles = getSampleStyleSheet()

    # ✅ safer doc config
    doc = SimpleDocTemplate(
        tmp_path,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=20
    )

    story = []

    month_names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    # ─── HEADER ─────────────────────────────
    story.append(Paragraph("FinFlow AI — Monthly Report", styles["Title"]))
    story.append(Paragraph(f"{month_names[month]} {year}", styles["Heading2"]))
    story.append(Spacer(1, 12))

    # ─── SUMMARY ────────────────────────────
    story.append(Paragraph("Summary", styles["Heading3"]))
    story.append(Spacer(1, 6))

    # ✅ safe text handling
    lines = str(summary).split("\n")

    for line in lines:
        clean = escape(line.strip())
        if clean:
            story.append(Paragraph(clean, styles["BodyText"]))
            story.append(Spacer(1, 6))

    story.append(Spacer(1, 12))

    # ─── FINANCIAL OVERVIEW ────────────────
    story.append(Paragraph("Financial Overview", styles["Heading3"]))
    story.append(Spacer(1, 8))

    overview_data = [
        ["Metric", "Amount"],
        ["Total Income", f"Rs {total_income:,.2f}"],
        ["Total Expenses", f"Rs {total_expense:,.2f}"],
        ["Net Savings", f"Rs {total_income - total_expense:,.2f}"],
    ]

    overview_table = Table(overview_data, colWidths=[8 * cm, 6 * cm])

    overview_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1D9E75")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))

    story.append(overview_table)
    story.append(Spacer(1, 12))

    # ─── CATEGORY TABLE ────────────────────
    if by_category:
        story.append(Paragraph("Spending by Category", styles["Heading3"]))
        story.append(Spacer(1, 8))

        cat_data = [["Category", "Amount"]] + [
            [str(cat).title(), f"Rs {amt:,.2f}"]
            for cat, amt in sorted(by_category.items(), key=lambda x: x[1], reverse=True)
        ]

        cat_table = Table(cat_data, colWidths=[8 * cm, 6 * cm])

        cat_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#534AB7")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))

        story.append(cat_table)

    # ─── BUILD PDF ─────────────────────────
    doc.build(story)

    # ✅ VALIDATION (REALISTIC)
    size = os.path.getsize(tmp_path)
    print("✅ PDF size:", size)

    if size < 1000:
        raise Exception("❌ PDF corrupted or empty")

    return tmp_path