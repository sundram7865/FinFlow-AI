from typing import AsyncGenerator
from langchain_core.messages import HumanMessage, AIMessage
from app.agents.graph.builder import build_graph
from app.agents.graph.state import FinFlowState
from app.core.logging import logger


def _build_messages(chat_history: list, new_message: str) -> list:
    """
    Converts raw chat history dicts into LangChain message objects.
    Keeps last 10 messages for context window efficiency.
    """
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
    Runs the full LangGraph pipeline and streams the response token by token.

    Flow:
        supervisor → rag_retriever → [analyst|advisor|planner|general] → aggregator → memory_writer

    Yields:
        SSE tokens for streaming to Node.js
        Final [META] event with anomalies + new_memories
    """
    graph = build_graph()

    logger.info(f"[Service] ── START ── user_id={request.userId}")
    logger.info(f"[Service] message='{request.message[:100]}'")
    logger.info(f"[Service] goals={len(request.goals)} | memory={len(request.memory)} | history={len(request.chat_history)}")

    initial_state: FinFlowState = {
        "messages":       _build_messages(request.chat_history, request.message),
        "user_id":        request.userId,

        # from Node.js — goals only, transactions are fetched via RAG
        "goals":          request.goals,
        "memory":         request.memory,

        # supervisor will fill these
        "intent":         "",
        "rag_query":      "",
        "next_node":      "",

        # rag_retriever will fill this — starts empty
        "transactions":   [],

        # agent outputs — all start empty
        "analyst_output": "",
        "advisor_output": "",
        "planner_output": "",

        # final
        "final_response": "",
        "anomalies":      [],
        "new_memories":   [],
    }

    logger.info("[Service] Invoking LangGraph pipeline...")

    final_state = await graph.ainvoke(initial_state)

    response     = final_state.get("final_response", "I could not generate a response.")
    anomalies    = final_state.get("anomalies",    [])
    new_memories = final_state.get("new_memories", [])

    logger.info(f"[Service] Pipeline complete — response length={len(response)} chars")
    logger.info(f"[Service] anomalies={len(anomalies)} | new_memories={len(new_memories)}")

    # ── stream response word by word ────────────────────────
    words = response.split(" ")
    for i, word in enumerate(words):
        yield word + ("" if i == len(words) - 1 else " ")

    # ── send metadata as final SSE event ────────────────────
    import json
    meta = json.dumps({"anomalies": anomalies, "new_memories": new_memories})
    yield f"\n[META]{meta}"

    logger.info(f"[Service] ── DONE ── streamed {len(words)} words to client")