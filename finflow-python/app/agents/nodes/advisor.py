from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import ADVISOR_PROMPT


async def advisor_node(state: FinFlowState) -> dict:
    """
    Reads analyst output + goals.
    Generates personalised financial advice.
    Writes advisor_output to state.
    """
    llm   = get_llm()
    goals = state.get("goals", [])

    last_message = ""
    for msg in reversed(state["messages"]):
        if hasattr(msg, "content"):
            last_message = msg.content
            break

    goals_str = "\n".join(
        f"- {g.get('title')}: ₹{g.get('savedAmount', 0)}/₹{g.get('targetAmount')} by {g.get('deadline', 'N/A')}"
        for g in goals
    )

    analyst_output = state.get("analyst_output", "No analysis available")

    prompt   = ADVISOR_PROMPT.format(
        message=last_message,
        analyst_output=analyst_output,
        goals=goals_str or "No active goals",
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    return {"advisor_output": response.content}