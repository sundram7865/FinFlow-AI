from app.agents.graph.state import FinFlowState
from app.core.logging import logger


def route_after_rag(state: FinFlowState) -> str:
    """
    Conditional edge called AFTER rag_retriever node.
    Supervisor already decided next_node — this just reads it.

    Flow:
        supervisor → rag_retriever → [analyst | advisor | planner | general]

    supervisor sets state.next_node.
    rag_retriever fills state.transactions.
    This function fires after rag_retriever and sends to the correct agent.
    """
    next_node = state.get("next_node", "general")

    valid_nodes = {"analyst", "advisor", "planner", "general"}

    if next_node not in valid_nodes:
        logger.warning(
            f"[Edges] Invalid next_node='{next_node}' — falling back to 'general'"
        )
        return "general"

    logger.info(f"[Edges] route_after_rag → '{next_node}'")
    return next_node