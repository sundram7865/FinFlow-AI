from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import PLANNER_PROMPT
from app.agents.tools.transaction_tools import calculate_averages
from app.core.logging import logger


async def planner_node(state: FinFlowState) -> dict:
    """
    Reads transaction chunks to compute income/expense averages.
    Combines with user goals to generate realistic goal plans.
    Writes planner_output to state.

    state.transactions is populated by rag_retriever — never raw from Node.js.
    """
    logger.info(f"[Planner] ── START ── user_id={state.get('user_id')}")

    llm          = get_llm()
    transactions = state.get("transactions", [])
    goals        = state.get("goals", [])

    logger.info(f"[Planner] Received {len(transactions)} chunks from rag_retriever")
    logger.info(f"[Planner] User has {len(goals)} active goals")

    # ── extract last user message ────────────────────────────
    last_message = ""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, "content"):
            last_message = str(msg.content)
            break
    logger.info(f"[Planner] Planning for: '{last_message[:100]}'")

    # ── calculate financial averages from chunks ─────────────
    logger.info("[Planner] Calculating income/expense averages from chunks...")
    averages = calculate_averages(transactions)
    avg_income  = averages.get("avg_income",  0.0)
    avg_expense = averages.get("avg_expense", 0.0)
    avg_savings = avg_income - avg_expense

    logger.info(
        f"[Planner] avg_income=₹{avg_income:,.0f} "
        f"avg_expense=₹{avg_expense:,.0f} "
        f"avg_savings=₹{avg_savings:,.0f}"
    )

    # ── no data guard ────────────────────────────────────────
    if not transactions:
        logger.warning("[Planner] No transaction chunks — planning with goals only, no financial data")

    # ── format goals with progress ───────────────────────────
    goals_lines = []
    for g in goals:
        target  = float(g.get("targetAmount", 0))
        saved   = float(g.get("savedAmount",  0))
        pct     = round((saved / target * 100), 1) if target > 0 else 0
        remaining = target - saved
        goals_lines.append(
            f"- {g.get('title')}: ₹{saved:,.0f} / ₹{target:,.0f} ({pct}% done) "
            f"— ₹{remaining:,.0f} remaining by {g.get('deadline', 'N/A')}"
        )

    goals_str = "\n".join(goals_lines) if goals_lines else "No active goals."
    logger.info(f"[Planner] Goals formatted: {len(goals_lines)} goals")

    # ── call LLM ─────────────────────────────────────────────
    logger.info("[Planner] Calling LLM for goal planning...")
    prompt   = PLANNER_PROMPT.format(
        message=last_message,
        avg_income=f"₹{avg_income:,.0f}",
        avg_expense=f"₹{avg_expense:,.0f}",
        avg_savings=f"₹{avg_savings:,.0f}",
        goals=goals_str,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    logger.info("[Planner] ── DONE ── planner_output generated")

    return {"planner_output": response.content}