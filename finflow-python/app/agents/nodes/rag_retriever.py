from datetime import datetime, timedelta
from app.agents.graph.state import FinFlowState
from app.agents.tools.rag_tools import search_pdf_chunks
from app.core.logging import logger


def _default_last_30_days():
    today = datetime.utcnow().date()
    start = today - timedelta(days=30)
    return {
        "start_date": str(start),
        "end_date": str(today),
    }


async def rag_retriever_node(state: FinFlowState) -> dict:
    """
    Hybrid RAG:
    1. Apply Mongo filters (date, etc.)
    2. Then apply embedding ranking
    """

    user_id   = state.get("user_id", "")
    rag_query = state.get("rag_query", "")
    intent    = state.get("intent", "GENERAL")
    filters   = state.get("filters", {}) or {}

    logger.info(f"[RAG Retriever] ── START ── user_id={user_id}")
    logger.info(f"[RAG Retriever] intent={intent}")
    logger.info(f"[RAG Retriever] rag_query='{rag_query[:100]}'")
    logger.info(f"[RAG Retriever] filters={filters}")

    if not user_id:
        logger.warning("[RAG Retriever] No user_id — skipping")
        return {"transactions": []}

    if not rag_query:
        logger.warning("[RAG Retriever] No rag_query — skipping")
        return {"transactions": []}

    # ── fallback filters ─────────────────────────────
    if not filters:
        logger.info("[RAG Retriever] No filters → using last 30 days")
        filters = _default_last_30_days()

    # ── build mongo filter ──────────────────────────
    mongo_filter = {"userId": user_id}

    if filters.get("start_date") and filters.get("end_date"):
        mongo_filter["date"] = {
            "$gte": filters["start_date"],
            "$lte": filters["end_date"],
        }

    logger.info(f"[RAG Retriever] Mongo filter: {mongo_filter}")

    # ── hybrid search ───────────────────────────────
    try:
        chunks = await search_pdf_chunks(
            user_id=user_id,
            query=rag_query,
            top_k=200,
            mongo_filter=mongo_filter,   # ✅ NEW
        )
    except Exception as e:
        logger.error(f"[RAG Retriever] Search failed: {e}")
        return {"transactions": []}

    # ── logging ─────────────────────────────────────
    if chunks:
        logger.info(f"[RAG Retriever] Found {len(chunks)} chunks")
        for i, chunk in enumerate(chunks[:3]):
            score = round(chunk.get("similarity", 0), 4)
            preview = str(chunk.get("content", ""))[:80]
            logger.info(f"[RAG Retriever] chunk[{i}] score={score} | '{preview}'")
    else:
        logger.warning("[RAG Retriever] No chunks found")

    logger.info(f"[RAG Retriever] ── DONE ── stored {len(chunks)} chunks")

    return {"transactions": chunks}