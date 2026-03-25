from fastapi import APIRouter, Depends
from app.features.pdf_parse.schemas import ParseRequest, ParseResponse
from app.features.pdf_parse.service import parse_statement
from app.core.security              import verify_internal_key

router = APIRouter(prefix="/parse", tags=["parse"])


@router.post("/statement", response_model=ParseResponse, dependencies=[Depends(verify_internal_key)])
async def parse_bank_statement(request: ParseRequest) -> ParseResponse:
    return await parse_statement(request)