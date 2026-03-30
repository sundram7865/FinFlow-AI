from pydantic import BaseModel
from typing   import List, Any


class AnomalyRequest(BaseModel):
    userId:       str
    uploadId:     str
    transactions: List[Any]


class AnomalyItem(BaseModel):
    amount:      float
    category:    str
    date:        str | None = None
    avg:         float
    zScore:      float
    rank:        str
    description: str
    severity:    str          # 'low' | 'medium' | 'high'


class AnomalyResponse(BaseModel):
    anomalies: List[AnomalyItem]