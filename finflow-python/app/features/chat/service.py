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


async def run_chat_agent(request) -> AsyncGenerator[str, None]:
    """
    Runs the full LangGraph pipeline.
    Yields response tokens for SSE streaming.
    """
    graph = build_graph()

    initial_state: FinFlowState = {
        "messages":       _build_messages(request.chat_history, request.message),
        "user_id":        request.userId,
        "transactions":   request.transactions,
        "goals":          request.goals,
        "memory":         request.memory,
        "intent":         "",
        "analyst_output": "",
        "advisor_output": "",
        "planner_output": "",
        "rag_output":     "",
        "final_response": "",
        "anomalies":      [],
        "new_memories":   [],
    }

    logger.info(f"Running chat agent for user: {request.userId}")

    final_state = await graph.ainvoke(initial_state)

    response     = final_state.get("final_response", "I could not generate a response.")
    anomalies    = final_state.get("anomalies",    [])
    new_memories = final_state.get("new_memories", [])

    # Stream response word by word
    words = response.split(" ")
    for i, word in enumerate(words):
        yield word + ("" if i == len(words) - 1 else " ")

    # Send metadata at end as special event
    import json
    yield f"\n[META]{json.dumps({'anomalies': anomalies, 'new_memories': new_memories})}"