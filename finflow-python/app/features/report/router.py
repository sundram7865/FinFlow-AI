from fastapi import APIRouter, Depends
from app.features.report.schemas import ReportRequest, ReportResponse
from app.features.report.service import generate_report
from app.core.security           import verify_internal_key

router = APIRouter(prefix="/report", tags=["report"])


@router.post("/generate", response_model=ReportResponse, dependencies=[Depends(verify_internal_key)])
async def generate_monthly_report(request: ReportRequest) -> ReportResponse:
    return await generate_report(request)