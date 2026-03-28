from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import AGGREGATOR_PROMPT
from app.core.logging import logger


async def aggregator_node(state: FinFlowState) -> dict:
    """
    Merges the active agent's output into one clean, conversational response.

    Skips LLM call if general_node already set final_response
    (general_node writes directly to final_response, no aggregation needed).

    Priority: analyst_output > advisor_output > planner_output
    """
    logger.info(f"[Aggregator] ── START ── user_id={state.get('user_id')}")

    # ── skip if general_node already handled it ──────────────
    if state.get("final_response"):
        logger.info("[Aggregator] final_response already set (general_node) — skipping")
        return {"final_response": state["final_response"]}

    llm = get_llm()

    # ── extract last user message ────────────────────────────
    last_message = ""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, "content"):
            last_message = str(msg.content)
            break

    # ── pick the active agent's output ──────────────────────
    agent_output = (
        state.get("analyst_output")  or
        state.get("advisor_output")  or
        state.get("planner_output")  or
        "No specific analysis available."
    )

    active_agent = (
        "analyst"  if state.get("analyst_output")  else
        "advisor"  if state.get("advisor_output")  else
        "planner"  if state.get("planner_output")  else
        "none"
    )
    logger.info(f"[Aggregator] Aggregating output from: {active_agent}")
    logger.info(f"[Aggregator] Agent output length: {len(agent_output)} chars")

    # ── call LLM to produce clean final response ─────────────
    logger.info("[Aggregator] Calling LLM to produce final response...")
    prompt   = AGGREGATOR_PROMPT.format(
        message=last_message,
        agent_output=agent_output,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    logger.info("[Aggregator] ── DONE ── final_response generated")

    return {"final_response": response.content}