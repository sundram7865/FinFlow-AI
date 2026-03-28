import os
from langchain_core.messages         import HumanMessage
from app.features.report.schemas     import ReportRequest, ReportResponse
from app.features.report.builder     import build_report_pdf
from app.agents.tools.transaction_tools import summarize_transactions
from app.shared.llm                  import get_llm
from app.shared.cloudinary           import upload_file
from app.shared.prompts              import REPORT_PROMPT
from app.core.logging                import logger


async def generate_report(request: ReportRequest) -> ReportResponse:
    """
    Full report generation pipeline:
    1. Summarize transactions with tools
    2. LLM writes the summary text
    3. ReportLab builds PDF
    4. Upload to Cloudinary
    5. Return URL + summary
    """
    llm     = get_llm()
    summary = summarize_transactions(request.transactions)

    top_cats = ", ".join(
        f"{cat} ₹{amt:,.0f}"
        for cat, amt in summary["top_categories"][:3]
    )

    prompt   = REPORT_PROMPT.format(
        month=request.month,
        year=request.year,
        total_income=f"{summary['total_income']:,.2f}",
        total_expense=f"{summary['total_expense']:,.2f}",
        net_savings=f"{summary['balance']:,.2f}",
        top_categories=top_cats,
        goals_summary="See goals section",
    )

    response     = await llm.ainvoke([HumanMessage(content=prompt)])
    summary_text = response.content

    pdf_path = build_report_pdf(
        month=request.month,
        year=request.year,
        summary=summary_text,
        total_income=summary["total_income"],
        total_expense=summary["total_expense"],
        by_category=summary["by_category"],
    )

    try:
        file_url = upload_file(pdf_path, folder=f"finflow/reports/{request.userId}")
        logger.info(f"Report uploaded: {file_url}")
    finally:
        os.unlink(pdf_path)

    return ReportResponse(fileUrl=file_url, summary=summary_text)