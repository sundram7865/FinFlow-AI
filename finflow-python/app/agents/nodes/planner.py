from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import PLANNER_PROMPT
from app.agents.tools.transaction_tools import calculate_averages


async def planner_node(state: FinFlowState) -> dict:
    """
    Reads transactions to find income/expense averages.
    Generates goal planning advice with realistic targets.
    Writes planner_output to state.
    """
    llm          = get_llm()
    transactions = state.get("transactions", [])
    goals        = state.get("goals", [])

    last_message = ""
    for msg in reversed(state["messages"]):
        if hasattr(msg, "content"):
            last_message = msg.content
            break

    averages  = calculate_averages(transactions)
    goals_str = "\n".join(
        f"- {g.get('title')}: ₹{g.get('targetAmount')} by {g.get('deadline', 'N/A')}"
        for g in goals
    ) or "No active goals"

    prompt   = PLANNER_PROMPT.format(
        message=last_message,
        avg_income=f"₹{averages['avg_income']:,.0f}",
        avg_expense=f"₹{averages['avg_expense']:,.0f}",
        goals=goals_str,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    return {"planner_output": response.content}