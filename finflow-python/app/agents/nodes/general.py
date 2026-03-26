from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.core.logging import logger


GENERAL_SYSTEM = """You are FinFlow AI, a friendly personal finance assistant built for Indian users.
You help users understand their spending, set financial goals, and make smarter money decisions.
Keep responses concise, warm, and helpful. Use ₹ for Indian Rupees.
If the user asks something off-topic, gently steer them back to finance."""


async def general_node(state: FinFlowState) -> dict:
    """
    Fallback node for greetings, off-topic messages, or anything
    that doesn't fit ANALYSIS / ADVICE / GOAL.

    Uses full conversation history for context.
    Sets final_response directly — bypasses aggregator's LLM call.
    """
    logger.info(f"[General] ── START ── user_id={state.get('user_id')}")

    llm = get_llm()

    # ── extract last user message for logging ────────────────
    last_message = ""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, "content"):
            last_message = str(msg.content)
            break
    logger.info(f"[General] Handling: '{last_message[:100]}'")

    # ── build message list with system prompt ────────────────
    messages = [SystemMessage(content=GENERAL_SYSTEM)] + list(state.get("messages", []))
    logger.info(f"[General] Calling LLM with {len(messages)} messages in context...")

    response = await llm.ainvoke(messages)

    logger.info("[General] ── DONE ── final_response set")

    # set final_response directly — aggregator will skip its LLM call
    return {"final_response": response.content}