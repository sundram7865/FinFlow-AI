import json
from datetime import datetime, timedelta
from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import SUPERVISOR_PROMPT
from app.core.logging import logger


INTENT_TO_NODE = {
    "ANALYSIS": "analyst",
    "ADVICE":   "advisor",
    "GOAL":     "planner",
    "GENERAL":  "general",
}


def _get_last_user_message(state: FinFlowState) -> str:
    """Extracts the most recent human message from state."""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, "type") and msg.type == "human":
            return str(msg.content).strip()
        if isinstance(msg, dict) and msg.get("role") == "user":
            return str(msg.get("content", "")).strip()
    return ""


def _default_last_30_days_filter():
    """Fallback filter if LLM doesn't return any date range."""
    today = datetime.utcnow().date()
    start = today - timedelta(days=30)
    return {
        "start_date": str(start),
        "end_date": str(today),
    }


async def supervisor_node(state: FinFlowState) -> dict:
    """
    Entry node — runs first for every query.

    Responsibilities:
        1. Classify intent
        2. Generate rag_query
        3. Extract structured filters (date ranges etc.)
        4. Decide next node

    Output:
        intent, rag_query, next_node, filters
    """
    logger.info(f"[Supervisor] ── START ── user_id={state.get('user_id')}")

    llm          = get_llm()
    last_message = _get_last_user_message(state)

    logger.info(f"[Supervisor] Last user message: '{last_message[:120]}'")

    # ── edge case ───────────────────────────────────────────
    if not last_message:
        logger.warning("[Supervisor] No user message — defaulting GENERAL")
        return {
            "intent":    "GENERAL",
            "rag_query": "financial transactions overview",
            "next_node": "general",
            "filters":   _default_last_30_days_filter(),  # ✅ fallback
        }

    # ── call LLM ─────────────────────────────────────────────
    logger.info("[Supervisor] Calling LLM for intent classification...")
    prompt = SUPERVISOR_PROMPT.replace("{message}", last_message)
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw      = str(response.content).strip()

    # clean markdown fences
    raw = raw.replace("```json", "").replace("```", "").strip()
    logger.info(f"[Supervisor] LLM raw response: {raw}")

    # ── parse JSON ───────────────────────────────────────────
    try:
        parsed    = json.loads(raw)

        intent    = str(parsed.get("intent", "GENERAL")).upper().strip()
        rag_query = str(parsed.get("rag_query", last_message)).strip()
        next_node = str(parsed.get("next_node", "general")).lower().strip()
        filters   = parsed.get("filters", {}) or {}

        # ── validate intent ───────────────────────────────────
        if intent not in INTENT_TO_NODE:
            logger.warning(f"[Supervisor] Unknown intent='{intent}' → GENERAL")
            intent = "GENERAL"

        expected_node = INTENT_TO_NODE[intent]
        if next_node != expected_node:
            logger.warning(
                f"[Supervisor] next_node='{next_node}' mismatch → fixing to '{expected_node}'"
            )
            next_node = expected_node

        # ── ensure rag_query ──────────────────────────────────
        if not rag_query:
            rag_query = last_message

        # ── fallback filter if missing ────────────────────────
        if not filters:
            logger.info("[Supervisor] No filters from LLM → using last 30 days")
            filters = _default_last_30_days_filter()

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error(f"[Supervisor] JSON parse failed: {e} → fallback")

        intent    = "GENERAL"
        rag_query = last_message
        next_node = "general"
        filters   = _default_last_30_days_filter()

    logger.info(
        f"[Supervisor] ── DONE ── intent={intent} | next_node={next_node} | "
        f"filters={filters} | rag_query='{rag_query[:80]}'"
    )

    return {
        "intent":    intent,
        "rag_query": rag_query,
        "next_node": next_node,
        "filters":   filters,   # ✅ KEY ADDITION
    }