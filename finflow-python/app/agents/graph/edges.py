from app.agents.graph.state import FinFlowState


def route_by_intent(state: FinFlowState) -> str:
    """
    Conditional edge after supervisor.
    Reads state.intent and returns the next node name.
    """
    intent_map = {
        "ANALYSIS": "analyst",
        "ADVICE":   "advisor",
        "GOAL":     "planner",
        "RAG":      "rag",
        "GENERAL":  "general",
    }
    return intent_map.get(state.get("intent", "GENERAL"), "general")