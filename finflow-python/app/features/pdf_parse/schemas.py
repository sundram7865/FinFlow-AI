from pydantic import BaseModel


class ParseRequest(BaseModel):
    userId:   str
    fileUrl:  str
    uploadId: str


class TransactionItem(BaseModel):
    amount:      float
    type:        str
    category:    str
    description: str | None = None
    date:        str


class ParseResponse(BaseModel):
    transactions: list[TransactionItem]
    chunks_saved: int