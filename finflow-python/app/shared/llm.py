from functools import lru_cache
from langchain_groq import ChatGroq
from app.core.config import get_settings


@lru_cache()
def get_llm() -> ChatGroq:
    settings = get_settings()
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0.3,
        streaming=True,
    )