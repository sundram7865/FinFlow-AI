from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import ANALYST_PROMPT
from app.agents.tools.transaction_tools import (
    summarize_transactions,
    detect_anomalies,
)


async def analyst_node(state: FinFlowState) -> dict:
    """
    Analyzes transactions from state.
    Detects anomalies.
    Writes analyst_output and anomalies to state.
    """
    llm          = get_llm()
    transactions = state.get("transactions", [])

    last_message = ""
    for msg in reversed(state["messages"]):
        if hasattr(msg, "content"):
            last_message = msg.content
            break

    tx_summary = summarize_transactions(transactions)
    anomalies  = detect_anomalies(transactions)

    recent_tx  = transactions[:10]
    tx_str     = "\n".join(
        f"- {t.get('date', 'N/A')} | {t.get('type')} | ₹{t.get('amount')} | {t.get('category')} | {t.get('description', '')}"
        for t in recent_tx
    )

    prompt   = ANALYST_PROMPT.format(
        message=last_message,
        transaction_summary=str(tx_summary),
        transactions=tx_str,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    return {
        "analyst_output": response.content,
        "anomalies":      anomalies,
    }