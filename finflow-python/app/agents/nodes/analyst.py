from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import ANALYST_PROMPT
from app.agents.tools.transaction_tools import summarize_transactions, detect_anomalies
from app.core.logging import logger


def _format_chunks_for_llm(chunks: list) -> str:
    """
    Converts raw MongoDB chunks into readable text for the LLM.
    Chunks from rag_retriever contain content, amount, type, category, date fields.
    """
    if not chunks:
        return "No transaction data available."

    lines = []
    for chunk in chunks:
        content  = chunk.get("content", "")
        amount   = chunk.get("amount",   "")
        tx_type  = chunk.get("type",     "")
        category = chunk.get("category", "")
        date     = chunk.get("date",     "")

        # if chunk has structured fields, format them cleanly
        if amount and tx_type:
            line = f"- {date} | {tx_type} | ₹{amount} | {category}"
            if content:
                line += f" | {content[:80]}"
        else:
            # fallback — raw content text from PDF chunk
            line = f"- {content[:120]}" if content else ""

        if line:
            lines.append(line)

    return "\n".join(lines)


async def analyst_node(state: FinFlowState) -> dict:
    """
    Analyzes financial chunks retrieved by rag_retriever.
    Detects anomalies.
    Writes analyst_output and anomalies to state.

    state.transactions is populated by rag_retriever — never raw from Node.js.
    """
    logger.info(f"[Analyst] ── START ── user_id={state.get('user_id')}")

    llm          = get_llm()
    transactions = state.get("transactions", [])

    logger.info(f"[Analyst] Received {len(transactions)} chunks from rag_retriever")

    # ── extract last user message ────────────────────────────
    last_message = ""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, "content"):
            last_message = str(msg.content)
            break
    logger.info(f"[Analyst] Analyzing for: '{last_message[:100]}'")

    # ── no data guard ────────────────────────────────────────
    if not transactions:
        logger.warning("[Analyst] No transaction chunks found — user may not have uploaded PDF")
        return {
            "analyst_output": (
                "I don't have your bank statement data yet. "
                "Please upload your bank statement PDF so I can analyze your transactions."
            ),
            "anomalies": [],
        }

    # ── summarize and detect anomalies ──────────────────────
    logger.info("[Analyst] Running transaction summary...")
    tx_summary = summarize_transactions(transactions)
    logger.info(
        f"[Analyst] Summary: income=₹{tx_summary['total_income']:,.0f} "
        f"expense=₹{tx_summary['total_expense']:,.0f} "
        f"balance=₹{tx_summary['balance']:,.0f}"
    )

   
    # ── format chunks for LLM prompt ────────────────────────
    tx_str = _format_chunks_for_llm(transactions)
    logger.info(f"[Analyst] Formatted {len(transactions)} chunks for LLM context")

    # ── call LLM ─────────────────────────────────────────────
    logger.info("[Analyst] Calling LLM for analysis...")
    prompt   = ANALYST_PROMPT.format(
        message=last_message,
        transaction_summary=str(tx_summary),
        transactions=tx_str,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    logger.info("[Analyst] ── DONE ── analyst_output generated")

    return {
        "analyst_output": response.content,
    
    }