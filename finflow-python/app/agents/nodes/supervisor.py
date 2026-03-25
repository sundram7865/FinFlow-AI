from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import SUPERVISOR_PROMPT
from app.core.logging import logger


async def supervisor_node(state: FinFlowState) -> dict:
    """
    Reads the last user message.
    Calls LLM to classify intent.
    Returns updated state with intent set.
    """
    llm = get_llm()

    last_message = ""
    for msg in reversed(state["messages"]):
        if hasattr(msg, "content"):
            last_message = msg.content
            break

    prompt  = SUPERVISOR_PROMPT.format(message=last_message)
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    intent  = response.content.strip().upper()

    valid_intents = {"ANALYSIS", "ADVICE", "GOAL", "RAG", "GENERAL"}
    if intent not in valid_intents:
        intent = "GENERAL"

    logger.info(f"Supervisor routed to: {intent}")

    return {"intent": intent}