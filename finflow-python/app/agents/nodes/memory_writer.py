from app.agents.graph.state import FinFlowState
from app.core.logging import logger


async def memory_writer_node(state: FinFlowState) -> dict:
    """
    Final pipeline node before END.

    Scans anomalies detected by analyst.
    Builds new_memories list for medium/high severity anomalies.
    Node.js reads new_memories from the response metadata and persists to MongoDB.
    """
    logger.info(f"[MemoryWriter] ── START ── user_id={state.get('user_id')}")

    anomalies    = state.get("anomalies", [])
    new_memories = []

    logger.info(f"[MemoryWriter] Scanning {len(anomalies)} anomalies for memory candidates...")

    for anomaly in anomalies:
        severity    = anomaly.get("severity", "low")
        description = anomaly.get("description", "")
        category    = anomaly.get("category", "")

        if severity in ("medium", "high"):
            memory = {
                "summary":  f"Spending anomaly detected in {category}: {description}",
                "type":     "pattern",
                "severity": severity,
            }
            new_memories.append(memory)
            logger.info(
                f"[MemoryWriter] New memory [{severity}]: {description[:80]}"
            )

    if not new_memories:
        logger.info("[MemoryWriter] No significant anomalies — no new memories written")

    logger.info(
        f"[MemoryWriter] ── DONE ── {len(new_memories)} new memories ready for Node.js"
    )

    return {"new_memories": new_memories}