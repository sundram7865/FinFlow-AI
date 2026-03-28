from pydantic import BaseModel
from typing import Any


class ReportRequest(BaseModel):
    userId:       str
    month:        int
    year:         int
    transactions: list[dict[str, Any]] = []


class ReportResponse(BaseModel):
    fileUrl: str
    summary: str