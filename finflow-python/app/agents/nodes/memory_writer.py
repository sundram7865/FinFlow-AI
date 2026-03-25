from app.agents.graph.state import FinFlowState


async def memory_writer_node(state: FinFlowState) -> dict:
    """
    Checks if any patterns worth remembering were found.
    Writes new_memories list to state.
    Node.js saves these to MongoDB after the response.
    """
    new_memories = []
    anomalies    = state.get("anomalies", [])

    for anomaly in anomalies:
        if anomaly.get("severity") in ("medium", "high"):
            new_memories.append({
                "summary": f"Detected anomaly: {anomaly.get('description')}",
                "type":    "pattern",
            })

    return {"new_memories": new_memories}