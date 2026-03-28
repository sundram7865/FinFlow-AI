from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import ADVISOR_PROMPT
from app.core.logging import logger


async def advisor_node(state: FinFlowState) -> dict:
    """
    Reads transaction chunks + goals from state.
    Generates personalised, actionable financial advice.
    Writes advisor_output to state.

    state.transactions is populated by rag_retriever — never raw from Node.js.
    """
    logger.info(f"[Advisor] ── START ── user_id={state.get('user_id')}")

    llm          = get_llm()
    transactions = state.get("transactions", [])
    goals        = state.get("goals", [])

    logger.info(f"[Advisor] Received {len(transactions)} chunks from rag_retriever")
    logger.info(f"[Advisor] User has {len(goals)} active goals")

    # ── extract last user message ────────────────────────────
    last_message = ""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, "content"):
            last_message = str(msg.content)
            break
    logger.info(f"[Advisor] Advising for: '{last_message[:100]}'")

    # ── no data guard ────────────────────────────────────────
    if not transactions:
        logger.warning("[Advisor] No transaction chunks — giving general advice only")

    # ── format transaction context ───────────────────────────
    tx_lines = []
    for chunk in transactions[:10]:   # top 10 most relevant chunks
        content  = chunk.get("content", "")
        amount   = chunk.get("amount", "")
        tx_type  = chunk.get("type", "")
        category = chunk.get("category", "")
        date     = chunk.get("date", "")

        if amount and tx_type:
            tx_lines.append(f"- {date} | {tx_type} | ₹{amount} | {category}")
        elif content:
            tx_lines.append(f"- {content[:100]}")

    tx_str = "\n".join(tx_lines) if tx_lines else "No transaction data available."
    logger.info(f"[Advisor] Using {len(tx_lines)} transaction lines as context")

    # ── format goals ─────────────────────────────────────────
    goals_str = "\n".join(
        f"- {g.get('title')}: ₹{g.get('savedAmount', 0):,.0f} / ₹{g.get('targetAmount', 0):,.0f} "
        f"by {g.get('deadline', 'N/A')}"
        for g in goals
    ) or "No active goals set."
    logger.info(f"[Advisor] Goals context: {goals_str[:100]}")

    # ── call LLM ─────────────────────────────────────────────
    logger.info("[Advisor] Calling LLM for financial advice...")
    prompt   = ADVISOR_PROMPT.format(
        message=last_message,
        transactions=tx_str,
        goals=goals_str,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    logger.info("[Advisor] ── DONE ── advisor_output generated")

    return {"advisor_output": response.content}