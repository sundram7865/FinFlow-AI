from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import AGGREGATOR_PROMPT


async def aggregator_node(state: FinFlowState) -> dict:
    """
    Merges all agent outputs into one clean response.
    Skips if general_node already set final_response.
    """
    if state.get("final_response"):
        return {}

    llm = get_llm()

    last_message = ""
    for msg in reversed(state["messages"]):
        if hasattr(msg, "content"):
            last_message = msg.content
            break

    agent_output = (
        state.get("analyst_output")  or
        state.get("advisor_output")  or
        state.get("planner_output")  or
        state.get("rag_output")      or
        "No specific analysis available."
    )

    prompt   = AGGREGATOR_PROMPT.format(
        message=last_message,
        agent_output=agent_output,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    return {"final_response": response.content}