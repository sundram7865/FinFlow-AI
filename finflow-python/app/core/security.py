from fastapi import Header, HTTPException
from app.core.config import get_settings


async def verify_internal_key(x_internal_key: str = Header(...)) -> None:
    settings = get_settings()
    if x_internal_key != settings.INTERNAL_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid internal key")