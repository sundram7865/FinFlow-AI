from datetime import datetime, timedelta
from app.agents.graph.state import FinFlowState
from app.agents.tools.rag_tools import search_pdf_chunks
from app.core.logging import logger


MAX_CONTEXT_CHUNKS = 40   # 🚨 VERY IMPORTANT (LLM safe)


def _default_last_30_days():
    today = datetime.utcnow().date()
    start = today - timedelta(days=30)
    return {
        "start_date": str(start),
        "end_date": str(today),
    }


def _rank_chunks(chunks: list[dict]) -> list[dict]:
    """
    Hybrid ranking:
    score = semantic + amount_boost + recency_boost
    """

    now = datetime.utcnow()

    for c in chunks:
        sim = c.get("similarity", 0)
        amt = float(c.get("amount", 0))

        # ── amount boost ───────────────────────────
        amount_score = min(amt / 10000, 1.5)  # normalize

        # ── recency boost ─────────────────────────
        try:
            date = datetime.fromisoformat(c.get("date"))
            days_old = (now - date).days
            recency_score = max(0, 1 - (days_old / 30))
        except:
            recency_score = 0

        # ── final score ───────────────────────────
        c["final_score"] = sim + (0.5 * amount_score) + (0.3 * recency_score)

    return sorted(chunks, key=lambda x: x["final_score"], reverse=True)


async def rag_retriever_node(state: FinFlowState) -> dict:

    user_id   = state.get("user_id", "")
    rag_query = state.get("rag_query", "")
    filters   = state.get("filters", {}) or {}

    logger.info(f"[RAG] ── START ── user_id={user_id}")

    if not user_id or not rag_query:
        logger.warning("[RAG] Missing user_id or query")
        return {"transactions": []}

    # ── fallback filters ─────────────────────────
    if not filters:
        filters = _default_last_30_days()

    mongo_filter = {"userId": user_id}

    if filters.get("start_date") and filters.get("end_date"):
        mongo_filter["date"] = {
            "$gte": filters["start_date"],
            "$lte": filters["end_date"],
        }

    logger.info(f"[RAG] Mongo filter: {mongo_filter}")

    try:
        # 🚨 fetch more, rank later
        chunks = await search_pdf_chunks(
            user_id=user_id,
            query=rag_query,
            top_k=300,   # fetch bigger pool
            mongo_filter=mongo_filter,
        )
    except Exception as e:
        logger.error(f"[RAG] Search failed: {e}")
        return {"transactions": []}

    if not chunks:
        logger.warning("[RAG] No chunks found")
        return {"transactions": []}

    # ── 🔥 HYBRID RANKING ────────────────────────
    ranked = _rank_chunks(chunks)

    # ── 🚨 trim for LLM safety ───────────────────
    final_chunks = ranked[:MAX_CONTEXT_CHUNKS]

    logger.info(f"[RAG] Retrieved={len(chunks)} | After ranking={len(final_chunks)}")

    for i, c in enumerate(final_chunks[:5]):
        logger.info(
            f"[RAG] #{i} score={round(c['final_score'],3)} "
            f"| ₹{c.get('amount')} | {c.get('category')} | {c.get('date')}"
        )

    logger.info("[RAG] ── DONE ──")

    return {"transactions": final_chunks}