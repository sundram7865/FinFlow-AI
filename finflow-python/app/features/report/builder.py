import tempfile
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles    import getSampleStyleSheet
from reportlab.platypus      import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib            import colors
from reportlab.lib.units      import cm


def build_report_pdf(
    month:          int,
    year:           int,
    summary:        str,
    total_income:   float,
    total_expense:  float,
    by_category:    dict,
) -> str:
    """
    Generates a PDF report using ReportLab.
    Returns path to the temp PDF file.
    """
    tmp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp_path = tmp_file.name
    tmp_file.close()

    doc    = SimpleDocTemplate(tmp_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story  = []

    month_names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    story.append(Paragraph(f"FinFlow AI — Monthly Report", styles["Title"]))
    story.append(Paragraph(f"{month_names[month]} {year}", styles["Heading2"]))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Summary", styles["Heading3"]))
    story.append(Paragraph(summary, styles["BodyText"]))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Financial Overview", styles["Heading3"]))
    overview_data = [
        ["Metric",         "Amount"],
        ["Total Income",   f"₹{total_income:,.2f}"],
        ["Total Expenses", f"₹{total_expense:,.2f}"],
        ["Net Savings",    f"₹{total_income - total_expense:,.2f}"],
    ]
    overview_table = Table(overview_data, colWidths=[8 * cm, 6 * cm])
    overview_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#1D9E75")),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("PADDING",      (0, 0), (-1, -1), 8),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 0.5 * cm))

    if by_category:
        story.append(Paragraph("Spending by Category", styles["Heading3"]))
        cat_data = [["Category", "Amount"]] + [
            [cat.title(), f"₹{amt:,.2f}"]
            for cat, amt in sorted(by_category.items(), key=lambda x: x[1], reverse=True)
        ]
        cat_table = Table(cat_data, colWidths=[8 * cm, 6 * cm])
        cat_table.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#534AB7")),
            ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
            ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
            ("PADDING",      (0, 0), (-1, -1), 8),
        ]))
        story.append(cat_table)

    doc.build(story)
    return tmp_path