import asyncio
import json
import re
from typing import AsyncGenerator
from langchain_core.messages import HumanMessage, AIMessage
from app.agents.graph.builder import build_graph
from app.agents.graph.state import FinFlowState
from app.core.logging import logger


def _build_messages(chat_history: list, new_message: str) -> list:
    messages = []
    for msg in chat_history[-10:]:
        role    = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        else:
            messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=new_message))
    return messages


def sanitize_llm_output(text: str) -> str:
    """
    Cleans the raw LLM final_response before streaming.
    Removes any 'data:' artifacts the LLM may have hallucinated.
    """
    if not text:
        return ""
    # Remove any 'data:' the LLM wrote (it should never write this)
    text = re.sub(r"\bdata:\s*", "", text)
    # Insert newlines before emoji section headers that got merged
    text = re.sub(
        r"([^\n])(📊|📋|💰|💸|📉|🧾|📈|💡|👣|🔍|⚠️|✅|❌)",
        r"\1\n\n\2",
        text
    )
    # Collapse 3+ newlines → 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def run_chat_agent(request) -> AsyncGenerator[str, None]:
    """
    Yields RAW text tokens — no 'data:' prefix.
    The SSE wrapper (router.py → token_stream) adds 'data:' exactly once.

    Special tokens:
      "[DONE]"          → signals end of content stream
      "[META]{...json}" → signals metadata (anomalies, memories)
    """
    graph = build_graph()

    logger.info(f"[Service] START user_id={request.userId} msg='{request.message[:80]}'")

    initial_state: FinFlowState = {
        "messages":       _build_messages(request.chat_history, request.message),
        "user_id":        request.userId,
        "goals":          request.goals,
        "memory":         request.memory,
        "intent":         "",
        "rag_query":      "",
        "next_node":      "",
        "transactions":   [],
        "analyst_output": "",
        "advisor_output": "",
        "planner_output": "",
        "final_response": "",
        "anomalies":      [],
        "new_memories":   [],
    }

    final_state  = await graph.ainvoke(initial_state)
    raw_response = final_state.get("final_response", "I could not generate a response.")
    anomalies    = final_state.get("anomalies",    [])
    new_memories = final_state.get("new_memories", [])

    # Sanitize before streaming — removes any 'data:' the LLM hallucinated
    response = sanitize_llm_output(raw_response)

    logger.info(f"[Service] raw={len(raw_response)}c sanitized={len(response)}c anomalies={len(anomalies)}")

    # Yield raw lines — NO 'data:' prefix here, router.py adds that
    for line in response.split("\n"):
        yield line + "\n"
        await asyncio.sleep(0.02)

    # End-of-stream marker
    yield "[DONE]\n"

    # Metadata marker (anomalies + memories)
    meta = json.dumps({"anomalies": anomalies, "new_memories": new_memories})
    yield f"[META]{meta}\n"

    logger.info("[Service] DONE")